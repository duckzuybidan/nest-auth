import { IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignUpDto {
  @ApiProperty({
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    example: 'StrongPass123',
    minLength: 6,
  })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
