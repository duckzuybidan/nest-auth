import { ApiProperty } from '@nestjs/swagger';
import { PermissionAction, PermissionResource } from 'src/common/constants';

export class PermissionResponseDto {
  @ApiProperty({
    enum: PermissionAction,
    example: PermissionAction.READ,
    enumName: 'PermissionAction',
  })
  action: PermissionAction;

  @ApiProperty({
    enum: PermissionResource,
    example: PermissionResource.ADMIN,
    enumName: 'PermissionResource',
  })
  resource: PermissionResource;

  @ApiProperty({ example: 'Read access to admin' })
  description: string;
}
