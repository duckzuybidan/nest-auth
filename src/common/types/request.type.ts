import { Request } from 'express';
import { GoogleUserResponseType, JwtPayloadType } from 'src/auth/types';

export interface AuthenticatedRequest extends Request {
  user: JwtPayloadType;
}

export interface GoogleRequest extends Request {
  user: GoogleUserResponseType;
}
