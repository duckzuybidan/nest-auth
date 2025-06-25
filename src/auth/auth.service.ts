import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import {
  AuthenticatedRequest,
  ErrorResponseType,
  SuccessResponseType,
} from 'src/common/types';
import { SignUpDto, UserResponseDto } from './dto';
import { SignInDto } from './dto/sign-in.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { randomBytes, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Request, Response } from 'express';
import { JwtPayloadType } from './types';
import { ACCESS_TOKEN, REFRESH_TOKEN } from 'src/common/constants';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}
  generateToken(payload: JwtPayloadType): string {
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
  async signUp(
    payload: SignUpDto,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    const { email, password } = payload;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException({
        message: 'User already exists',
      } satisfies ErrorResponseType);
    }

    const hashed = await this.hashPassword(password);

    const user = await this.prismaService.user.create({
      data: { email, passwordHash: hashed, tokenVersion: 1 },
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
      throw new BadRequestException({
        message: 'User not found',
      } satisfies ErrorResponseType);
    }

    const isPasswordValid = await this.checkPassword(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException({
        message: 'Invalid password',
      } satisfies ErrorResponseType);
    }

    const accessToken = this.generateToken({
      sub: user.id,
      tokenVersion: user.tokenVersion,
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

    res.cookie(ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: ms(
        (this.configService.get<string>('JWT_EXPIRES_IN') as ms.StringValue) ||
          '15m',
      ),
    });
    res.cookie(REFRESH_TOKEN, rawRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: ms(
        (this.configService.get<string>(
          'REFRESH_TOKEN_EXPIRES_IN',
        ) as ms.StringValue) || '7d',
      ),
    });

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
    const user = req.user;
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
      throw new BadRequestException({
        message: 'Invalid or expired refresh token',
      } satisfies ErrorResponseType);
    }

    const result = await this.prismaService.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { id: token.id },
        data: { revokedAt: new Date() },
      });

      const accessToken = this.generateToken({
        sub: token.user.id,
        tokenVersion: token.user.tokenVersion,
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

      res.cookie(ACCESS_TOKEN, accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: ms(
          (this.configService.get<string>(
            'JWT_EXPIRES_IN',
          ) as ms.StringValue) || '15m',
        ),
      });
      res.cookie(REFRESH_TOKEN, rawRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: ms(
          (this.configService.get<string>(
            'REFRESH_TOKEN_EXPIRES_IN',
          ) as ms.StringValue) || '7d',
        ),
      });

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
    const userId = user.id;
    const refreshToken = req.cookies[REFRESH_TOKEN];

    await this.prismaService.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
    await this.prismaService.refreshToken.updateMany({
      where: { tokenHash: this.getHashedRefreshToken(refreshToken) },
      data: { revokedAt: new Date() },
    });

    res.clearCookie(ACCESS_TOKEN, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
    res.clearCookie(REFRESH_TOKEN, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });

    return { message: 'Success', data: {} };
  }
}
