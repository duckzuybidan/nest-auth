import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PermissionGuard } from './guards';

@Module({
  providers: [PermissionService, PermissionGuard],
  controllers: [PermissionController],
  exports: [PermissionService],
})
export class PermissionModule {}
