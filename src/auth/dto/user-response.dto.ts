import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '123' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;
}
