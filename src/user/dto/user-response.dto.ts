import { ApiProperty } from '@nestjs/swagger';

class RoleDto {
  @ApiProperty({ example: '123' })
  id: string;

  @ApiProperty({ example: 'super_admin' })
  name: string;
}

export class UserResponseDto {
  @ApiProperty({ example: '123' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: string;

  @ApiProperty({ example: new Date().toISOString() })
  updatedAt: string;

  @ApiProperty({ type: [RoleDto] })
  roles: RoleDto[];
}
