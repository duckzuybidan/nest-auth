import { ApiProperty } from '@nestjs/swagger';
import { PermissionAction, PermissionResource } from 'src/common/constants';

class PermissionDto {
  @ApiProperty({ example: '123' })
  id: string;
  @ApiProperty({ example: PermissionAction.READ })
  action: PermissionAction;
  @ApiProperty({ example: PermissionResource.ADMIN })
  resource: PermissionResource;
}
export class RoleResponseDto {
  @ApiProperty({ example: '123' })
  id: string;

  @ApiProperty({ example: 'super_admin' })
  name: string;

  @ApiProperty({
    type: [PermissionDto],
  })
  permissions: PermissionDto[];
}
