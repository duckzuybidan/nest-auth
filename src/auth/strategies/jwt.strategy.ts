import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayloadType } from '../types';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ErrorResponseType } from 'src/common/types';
import { ACCESS_TOKEN } from 'src/common/constants';
import { UserResponseDto } from '../dto';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prismaService: PrismaService,
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
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException({
        message: 'Unauthorized',
      } satisfies ErrorResponseType);
    }

    const res: UserResponseDto = { id: user.id, email: user.email };
    return res;
  }
}
