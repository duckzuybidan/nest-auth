import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators';
import { PermissionAction, PermissionResource } from 'src/common/constants';
import { AuthenticatedRequest } from 'src/common/types';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<
      {
        action: PermissionAction;
        resource: PermissionResource;
      }[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.permissions) {
      throw new ForbiddenException('Forbidden');
    }

    const hasPermission = requiredPermissions.every((rp) =>
      user.permissions?.some(
        (up) => up.action === rp.action && up.resource === rp.resource,
      ),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Forbidden');
    }

    return true;
  }
}
