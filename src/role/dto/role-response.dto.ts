import { ApiProperty } from '@nestjs/swagger';
import { PermissionAction, PermissionResource } from 'src/common/constants';
import { PermissionResponseDto } from 'src/permission/dto';

export class RoleResponseDto {
  @ApiProperty({ example: '123' })
  id: string;

  @ApiProperty({ example: 'super_admin' })
  name: string;

  @ApiProperty({
    type: [PermissionResponseDto],
    example: [
      {
        action: PermissionAction.READ,
        resource: PermissionResource.ADMIN,
        description: 'Read access to admin',
      },
    ],
  })
  permissions: PermissionResponseDto[];
}
