import { Request } from 'express';
import { UserResponseDto } from 'src/auth/dto/user-response.dto';
import { GoogleUserResponseType } from 'src/auth/types';

export interface AuthenticatedRequest extends Request {
  user: UserResponseDto;
}

export interface GoogleRequest extends Request {
  user: GoogleUserResponseType;
}
