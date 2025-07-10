import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  AuthenticatedRequest,
  GoogleRequest,
  SuccessResponseType,
} from 'src/common/types';
import {
  SignUpDto,
  AuthResponseDto,
  TokenResponseDto,
  SignInDto,
  ResendOtpBodyDto,
  VerifyUserBodyDto,
} from './dto';
import { randomBytes, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Request, Response } from 'express';
import {
  ACCESS_TOKEN,
  OTP,
  OTP_COOLDOWN,
  REFRESH_TOKEN,
} from 'src/common/constants';
import { PermissionService } from 'src/permission/permission.service';
import { JwtPayloadType } from './types';
import { EmailPublisherService } from 'src/email-publisher/email-publisher.service';
import { RedisService } from 'src/redis/redis.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly permissionService: PermissionService,
    private readonly emailPublisherService: EmailPublisherService,
    private readonly redisService: RedisService,
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

  sendVerificationEmail(payload: { to: string }) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.redisService.set(`OTP:${payload.to}`, JSON.stringify({ otp }), 300);
    this.emailPublisherService.sendVerificationEmail({
      to: payload.to,
      otp,
    });
  }
  async signUp(
    payload: SignUpDto,
  ): Promise<SuccessResponseType<AuthResponseDto>> {
    const { email, password } = payload;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashed = await this.hashPassword(password);

    const user = await this.prismaService.user.create({
      data: { email, passwordHash: hashed, isVerified: false, isActive: true },
    });

    this.sendVerificationEmail({ to: email });
    const result: SuccessResponseType<AuthResponseDto> = {
      message: 'Success',
      data: { id: user.id, email: user.email },
    };
    return result;
  }

  async signIn(
    payload: SignInDto,
    req: Request,
    res: Response,
  ): Promise<SuccessResponseType<AuthResponseDto & TokenResponseDto>> {
    const { email, password } = payload;

    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (!user.isVerified) throw new BadRequestException('User is not verified');
    if (!user.isActive) throw new BadRequestException('User is not active');
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

    const result: SuccessResponseType<AuthResponseDto & TokenResponseDto> = {
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
  ): Promise<SuccessResponseType<AuthResponseDto>> {
    const user = await this.prismaService.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true },
    });
    if (!user) throw new BadRequestException('User not found');

    const result: SuccessResponseType<AuthResponseDto> = {
      message: 'Success',
      data: {
        id: user.id,
        email: user.email,
      },
    };
    return result;
  }

  async refreshToken(
    refreshToken: string,
    req: Request,
    res: Response,
  ): Promise<SuccessResponseType<TokenResponseDto>> {
    if (!refreshToken)
      throw new BadRequestException('Refresh token is required');
    const hashed = this.getHashedRefreshToken(refreshToken);
    const token = await this.prismaService.refreshToken.findFirst({
      where: {
        tokenHash: hashed,
        revokedAt: undefined,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
    if (!token || !token.user || !token.user.isActive) {
      this.clearAccessTokenCookie(res);
      this.clearRefreshTokenCookie(res);
      throw new BadRequestException('Invalid or expired refresh token');
    }
    const permissions = await this.permissionService
      .getPermissionsByUserId(token.user.id)
      .then((res) => res.data);
    const accessToken = this.generateAccessToken({
      sub: token.user.id,
      permissions,
    });

    const { rawRefreshToken, refreshTokenExpiry, hashedRefreshToken } =
      this.generateRefreshToken();
    await this.prismaService.$transaction([
      this.prismaService.refreshToken.update({
        where: { id: token.id },
        data: { revokedAt: new Date() },
      }),
      this.prismaService.refreshToken.create({
        data: {
          tokenHash: hashedRefreshToken,
          userId: token.user.id,
          expiresAt: refreshTokenExpiry,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        },
      }),
    ]);

    const result: SuccessResponseType<TokenResponseDto> = {
      message: 'Success',
      data: {
        accessToken,
      },
    };

    this.setAccessTokenCookie(res, accessToken);
    this.setRefreshTokenCookie(res, rawRefreshToken);
    return result;
  }

  async signOut(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<{ message: string; data: {} }> {
    const user = req.user;
    const refreshToken = req.cookies[REFRESH_TOKEN];

    await this.prismaService.refreshToken.updateMany({
      where: { tokenHash: this.getHashedRefreshToken(refreshToken) },
      data: { revokedAt: new Date() },
    });

    this.clearAccessTokenCookie(res);
    this.clearRefreshTokenCookie(res);
    return { message: 'Success', data: {} };
  }

  async googleAuthRedirect(
    req: GoogleRequest,
    res: Response,
  ): Promise<SuccessResponseType<AuthResponseDto & TokenResponseDto>> {
    const { email } = req.user;
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (user) {
      if (!user.isActive) throw new BadRequestException('User is not active');
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
      const result: SuccessResponseType<AuthResponseDto & TokenResponseDto> = {
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
      data: { email, passwordHash: hashed, isActive: true, isVerified: true },
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
    const result: SuccessResponseType<AuthResponseDto & TokenResponseDto> = {
      message: 'Success',
      data: {
        id: newUser.id,
        email: newUser.email,
        accessToken,
      },
    };
    return result;
  }

  async resendOtp(payload: ResendOtpBodyDto): Promise<SuccessResponseType<{}>> {
    const cooldown = await this.redisService.get(
      `${OTP_COOLDOWN}:${payload.email}`,
    );
    if (cooldown) {
      const ttl = await this.redisService.ttl(
        `${OTP_COOLDOWN}:${payload.email}`,
      );
      throw new BadRequestException(
        `Please wait ${ttl} seconds before requesting another OTP`,
      );
    }
    this.redisService.set(`${OTP_COOLDOWN}:${payload.email}`, '1', 60);
    this.sendVerificationEmail({ to: payload.email });
    return { message: 'Success', data: {} };
  }

  async verifyUser(
    payload: VerifyUserBodyDto,
  ): Promise<SuccessResponseType<{}>> {
    const otp = await this.redisService.get(`${OTP}:${payload.email}`);
    if (!otp) {
      throw new BadRequestException('Invalid OTP');
    }
    const otpJson = JSON.parse(otp);
    if (otpJson.otp !== payload.otp) {
      throw new BadRequestException('Invalid OTP');
    }
    await this.redisService.del(`${OTP}:${payload.email}`);
    await this.prismaService.user.update({
      where: { email: payload.email },
      data: { isVerified: true },
    });
    return { message: 'Success', data: {} };
  }
}
