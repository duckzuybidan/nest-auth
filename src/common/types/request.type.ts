import { Request } from 'express';
import { UserResponseDto } from 'src/auth/dto/user-response.dto';

export interface AuthenticatedRequest extends Request {
  user: UserResponseDto;
}
