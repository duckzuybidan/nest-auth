import { SetMetadata } from '@nestjs/common';
import { PermissionAction, PermissionResource } from 'src/common/constants';

export const PERMISSIONS_KEY = 'permissions';
export const Permission = (
  ...permissions: {
    action: PermissionAction;
    resource: PermissionResource;
  }[]
) => SetMetadata(PERMISSIONS_KEY, permissions);
