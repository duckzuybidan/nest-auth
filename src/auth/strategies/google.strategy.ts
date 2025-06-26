import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { GoogleProfileType, GoogleUserResponseType } from '../types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }
  authorizationParams(): Record<string, string> {
    return {
      prompt: 'select_account',
    };
  }
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfileType,
    done: VerifyCallback,
  ): Promise<any> {
    const email = profile.emails[0].value;
    if (!email) {
      return done(new Error('No email found'), null);
    }
    const user: GoogleUserResponseType = { email };
    done(null, user);
  }
}
