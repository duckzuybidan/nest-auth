import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateRoleBodyDto {
  @ApiPropertyOptional({ example: 'super_admin' })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: ['123', '456'] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  permissionIds?: string[];
}
