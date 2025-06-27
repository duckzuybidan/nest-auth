import { ApiProperty } from '@nestjs/swagger';
import { PermissionAction, PermissionResource } from 'src/common/constants';

export class PermissionResponseDto {
  @ApiProperty({
    enum: PermissionAction,
    example: PermissionAction.READ,
  })
  action: PermissionAction;

  @ApiProperty({
    enum: PermissionResource,
    example: PermissionResource.ADMIN,
  })
  resource: PermissionResource;

  @ApiProperty({ example: 'Read access to admin' })
  description: string;
}
