import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { CacheUserType, JwtPayloadType } from '../types';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ErrorResponseType } from 'src/common/types';
import { ACCESS_TOKEN, USER } from 'src/common/constants';
import { AuthResponseDto } from '../dto';
import { RedisService } from 'src/redis/redis.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
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

  async validate(payload: JwtPayloadType): Promise<JwtPayloadType> {
    return payload;
  }
}
