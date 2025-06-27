import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  AuthenticatedRequest,
  ErrorResponseType,
  GoogleRequest,
  SuccessResponseType,
} from 'src/common/types';
import { SignUpDto, UserResponseDto, TokenResponseDto, SignInDto } from './dto';
import { randomBytes, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Request, Response } from 'express';
import { CacheUserType, JwtPayloadType } from './types';
import { ACCESS_TOKEN, REFRESH_TOKEN, USER } from 'src/common/constants';
import { RedisService } from 'src/redis/redis.service';
import { PermissionService } from 'src/permission/permission.service';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly permissionService: PermissionService,
  ) {}
  generateAccessToken(payload: JwtPayloadType): string {
    return this.jwtService.sign(payload);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async checkPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateRefreshToken(): {
    rawRefreshToken: string;
    refreshTokenExpiry: Date;
    hashedRefreshToken: string;
  } {
    const rawRefreshToken = randomBytes(64).toString('hex');
    const refreshTokenTtl =
      (this.configService.get<string>(
        'REFRESH_TOKEN_EXPIRES_IN',
      ) as ms.StringValue) ?? '7d';
    const refreshTokenExpiry = new Date(Date.now() + ms(refreshTokenTtl));
    const hashedRefreshToken = this.getHashedRefreshToken(rawRefreshToken);
    return { rawRefreshToken, refreshTokenExpiry, hashedRefreshToken };
  }

  getHashedRefreshToken(rawRefreshToken: string): string {
    return createHash('sha256').update(rawRefreshToken).digest('hex');
  }

  setAccessTokenCookie(res: Response, accessToken: string) {
    res.cookie(ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: ms(
        (this.configService.get<string>('JWT_EXPIRES_IN') as ms.StringValue) ||
          '15m',
      ),
    });
  }

  setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: ms(
        (this.configService.get<string>(
          'REFRESH_TOKEN_EXPIRES_IN',
        ) as ms.StringValue) || '7d',
      ),
    });
  }

  clearAccessTokenCookie(res: Response) {
    res.clearCookie(ACCESS_TOKEN, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  clearRefreshTokenCookie(res: Response) {
    res.clearCookie(REFRESH_TOKEN, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }
  async signUp(
    payload: SignUpDto,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    const { email, password } = payload;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashed = await this.hashPassword(password);

    const user = await this.prismaService.user.create({
      data: { email, passwordHash: hashed },
    });

    const result: SuccessResponseType<UserResponseDto> = {
      message: 'Success',
      data: { id: user.id, email: user.email },
    };
    return result;
  }

  async signIn(
    payload: SignInDto,
    req: Request,
    res: Response,
  ): Promise<SuccessResponseType<UserResponseDto & TokenResponseDto>> {
    const { email, password } = payload;

    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await this.checkPassword(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }
    const permissions = await this.permissionService
      .getPermissionsByUserId(user.id)
      .then((res) => res.data);
    const accessToken = this.generateAccessToken({
      sub: user.id,
      permissions,
    });

    const { rawRefreshToken, refreshTokenExpiry, hashedRefreshToken } =
      this.generateRefreshToken();
    await this.prismaService.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        userId: user.id,
        expiresAt: refreshTokenExpiry,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });

    this.setAccessTokenCookie(res, accessToken);
    this.setRefreshTokenCookie(res, rawRefreshToken);

    const result: SuccessResponseType<UserResponseDto & TokenResponseDto> = {
      message: 'Success',
      data: {
        id: user.id,
        email: user.email,
        accessToken,
      },
    };
    return result;
  }

  async me(
    req: AuthenticatedRequest,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    let user: CacheUserType | null = null;
    const cacheKey = `${USER}:${req.user.sub}`;
    const cachedUser = await this.redisService.get(cacheKey);

    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      user = await this.prismaService.user.findUnique({
        where: { id: req.user.sub },
        select: { id: true, email: true },
      });

      if (user) {
        void this.redisService
          .set(cacheKey, JSON.stringify(user))
          .catch((error) => this.logger.error('Redis set error', error));
      }
    }

    if (!user) {
      throw new BadRequestException('User not found');
    }
    const result: SuccessResponseType<UserResponseDto> = {
      message: 'Success',
      data: user,
    };
    return result;
  }

  async refreshToken(
    refreshToken: string,
    req: Request,
    res: Response,
  ): Promise<SuccessResponseType<TokenResponseDto>> {
    const hashed = this.getHashedRefreshToken(refreshToken);
    const token = await this.prismaService.refreshToken.findFirst({
      where: {
        tokenHash: hashed,
        revokedAt: undefined,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!token || !token.user) {
      this.clearAccessTokenCookie(res);
      this.clearRefreshTokenCookie(res);
      throw new BadRequestException('Invalid or expired refresh token');
    }

    const result = await this.prismaService.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: token.id },
        data: { revokedAt: new Date() },
      });

      const { rawRefreshToken, refreshTokenExpiry, hashedRefreshToken } =
        this.generateRefreshToken();

      await tx.refreshToken.create({
        data: {
          tokenHash: hashedRefreshToken,
          userId: token.user.id,
          expiresAt: refreshTokenExpiry,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      const permissions = await this.permissionService
        .getPermissionsByUserId(token.user.id)
        .then((res) => res.data);
      const accessToken = this.generateAccessToken({
        sub: token.user.id,
        permissions,
      });

      this.setAccessTokenCookie(res, accessToken);
      this.setRefreshTokenCookie(res, rawRefreshToken);

      const response: SuccessResponseType<TokenResponseDto> = {
        message: 'Success',
        data: {
          accessToken,
        },
      };

      return response;
    });
    return result;
  }

  async signOut(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<{ message: string; data: {} }> {
    const user = req.user;
    const userId = user.sub;
    const refreshToken = req.cookies[REFRESH_TOKEN];

    await this.prismaService.refreshToken.updateMany({
      where: { tokenHash: this.getHashedRefreshToken(refreshToken) },
      data: { revokedAt: new Date() },
    });

    void this.redisService
      .del(`${USER}:${userId}`)
      .catch((error) => this.logger.error('Redis del error', error));

    this.clearAccessTokenCookie(res);
    this.clearRefreshTokenCookie(res);
    return { message: 'Success', data: {} };
  }

  async googleAuthRedirect(
    req: GoogleRequest,
    res: Response,
  ): Promise<SuccessResponseType<UserResponseDto & TokenResponseDto>> {
    const { email } = req.user;
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (user) {
      const permissions = await this.permissionService
        .getPermissionsByUserId(user.id)
        .then((res) => res.data);
      const accessToken = this.generateAccessToken({
        sub: user.id,
        permissions,
      });
      const { rawRefreshToken, refreshTokenExpiry, hashedRefreshToken } =
        this.generateRefreshToken();
      await this.prismaService.refreshToken.create({
        data: {
          tokenHash: hashedRefreshToken,
          userId: user.id,
          expiresAt: refreshTokenExpiry,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      });

      this.setAccessTokenCookie(res, accessToken);
      this.setRefreshTokenCookie(res, rawRefreshToken);
      res.redirect(
        this.configService.get<string>('CLIENT_REDIRECT_URL') as string,
      );
      const result: SuccessResponseType<UserResponseDto & TokenResponseDto> = {
        message: 'Success',
        data: {
          id: user.id,
          email: user.email,
          accessToken,
        },
      };
      return result;
    }

    const randomPassword = randomBytes(12).toString('hex');
    const hashed = await this.hashPassword(randomPassword);
    const newUser = await this.prismaService.user.create({
      data: { email, passwordHash: hashed },
    });
    const accessToken = this.generateAccessToken({
      sub: newUser.id,
      permissions: [],
    });
    const { rawRefreshToken, refreshTokenExpiry, hashedRefreshToken } =
      this.generateRefreshToken();
    await this.prismaService.refreshToken.create({
      data: {
        tokenHash: hashedRefreshToken,
        userId: newUser.id,
        expiresAt: refreshTokenExpiry,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      },
    });
    this.setAccessTokenCookie(res, accessToken);
    this.setRefreshTokenCookie(res, rawRefreshToken);
    res.redirect(
      this.configService.get<string>('CLIENT_REDIRECT_URL') as string,
    );
    const result: SuccessResponseType<UserResponseDto & TokenResponseDto> = {
      message: 'Success',
      data: {
        id: newUser.id,
        email: newUser.email,
        accessToken,
      },
    };
    return result;
  }
}
