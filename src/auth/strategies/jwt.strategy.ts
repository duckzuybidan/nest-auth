import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheUserType, JwtPayloadType } from '../types';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ErrorResponseType } from 'src/common/types';
import { ACCESS_TOKEN, USER } from 'src/common/constants';
import { UserResponseDto } from '../dto';
import { RedisService } from 'src/redis/redis.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        if (!req || !req.cookies) return null;
        return req.cookies[ACCESS_TOKEN];
      },
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayloadType): Promise<UserResponseDto> {
    let user: CacheUserType | null = null;
    const cacheKey = `${USER}:${payload.sub}`;
    const cachedUser = await this.redisService.get(cacheKey);

    if (cachedUser) {
      user = JSON.parse(cachedUser);
    } else {
      user = await this.prismaService.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, tokenVersion: true },
      });

      if (user) {
        await this.redisService.set(cacheKey, JSON.stringify(user));
      }
    }

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
      } satisfies ErrorResponseType);
    }

    const res: UserResponseDto = { id: user.id, email: user.email };
    return res;
  }
}
