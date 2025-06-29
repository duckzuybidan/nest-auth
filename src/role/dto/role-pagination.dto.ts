import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class RolePaginationRequestDto {
  @ApiPropertyOptional({
    example: ['123', '456'],
    isArray: true,
    type: 'string',
    description: 'Filter by permission ids, this is and operator',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    return [value];
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}
