import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionResponseDto } from './dto';
import { JwtAuthGuard } from 'src/auth/guards';
import { PermissionGuard } from './guards';
import { Swagger } from 'src/libs/swagger';
import { Permission } from './decorators';
import { PermissionAction, PermissionResource } from 'src/common/constants';
import { ApiParam } from '@nestjs/swagger';
import { SuccessResponseType } from 'src/common/types';
import { UpdatePermissionBodyDto } from './dto/update-permission-body.dto';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({
  action: PermissionAction.READ,
  resource: PermissionResource.ADMIN,
})
@Controller('permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Get all permissions',
    description: 'Get all permissions',
    response: [PermissionResponseDto],
    withAuth: true,
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
  })
  async getAllPermissions(): Promise<
    SuccessResponseType<PermissionResponseDto[]>
  > {
    return this.permissionService.getAllPermissions();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Get permission by id',
    description: 'Get permission by id',
    response: PermissionResponseDto,
    withAuth: true,
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
  })
  @ApiParam({ name: 'id', type: String })
  async getPermissionById(
    @Param('id') id: string,
  ): Promise<SuccessResponseType<PermissionResponseDto>> {
    return this.permissionService.getPermissionById(id);
  }

  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Get permissions by user id',
    description: 'Get permissions by user id',
    response: [PermissionResponseDto],
    withAuth: true,
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
  })
  @ApiParam({ name: 'userId', type: String })
  async getPermissionsByUserId(
    @Param('userId') userId: string,
  ): Promise<SuccessResponseType<PermissionResponseDto[]>> {
    return this.permissionService.getPermissionsByUserId(userId);
  }

  @Get(':roleId')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Get permissions by role id',
    description: 'Get permissions by role id',
    response: [PermissionResponseDto],
    withAuth: true,
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
  })
  @ApiParam({ name: 'roleId', type: String })
  async getPermissionsByRoleId(
    @Param('roleId') roleId: string,
  ): Promise<SuccessResponseType<PermissionResponseDto[]>> {
    return this.permissionService.getPermissionsByRoleId(roleId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permission({
    action: PermissionAction.WRITE,
    resource: PermissionResource.ADMIN,
  })
  @Swagger({
    summary: 'Update permission by id',
    description: 'Update permission by id',
    withAuth: true,
    response: PermissionResponseDto,
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
  })
  async updatePermissionById(
    @Param('id') id: string,
    @Body() payload: UpdatePermissionBodyDto,
  ): Promise<SuccessResponseType<PermissionResponseDto>> {
    return this.permissionService.updatePermissionById(id, payload);
  }
}
