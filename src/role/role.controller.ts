import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { PermissionGuard } from 'src/permission/guards';
import { JwtAuthGuard } from 'src/auth/guards';
import { PermissionAction, PermissionResource } from 'src/common/constants';
import { Permission } from 'src/permission/decorators';
import { RoleResponseDto, CreateRoleBodyDto, UpdateRoleBodyDto } from './dto';
import { SuccessResponseType } from 'src/common/types';
import { Swagger } from 'src/libs/swagger';
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({
  action: PermissionAction.READ,
  resource: PermissionResource.ADMIN,
})
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}
  @Get()
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Get all roles',
    description: 'Get all roles',
    response: [RoleResponseDto],
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
    withAuth: true,
  })
  async getAllRoles(): Promise<SuccessResponseType<RoleResponseDto[]>> {
    return this.roleService.getAllRoles();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Get role by id',
    description: 'Get role by id',
    response: RoleResponseDto,
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
    withAuth: true,
  })
  async getRoleById(
    @Param('id') id: string,
  ): Promise<SuccessResponseType<RoleResponseDto>> {
    return this.roleService.getRoleById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permission({
    action: PermissionAction.WRITE,
    resource: PermissionResource.ADMIN,
  })
  @Swagger({
    summary: 'Create role',
    description: 'Create role',
    response: RoleResponseDto,
    successCode: HttpStatus.CREATED,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
    withAuth: true,
  })
  async createRole(
    @Body() payload: CreateRoleBodyDto,
  ): Promise<SuccessResponseType<RoleResponseDto>> {
    return this.roleService.createRole(payload);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permission({
    action: PermissionAction.WRITE,
    resource: PermissionResource.ADMIN,
  })
  @Swagger({
    summary: 'Update role by id',
    description: 'Update role by id',
    response: RoleResponseDto,
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
    withAuth: true,
  })
  async updateRoleById(
    @Param('id') id: string,
    @Body() payload: UpdateRoleBodyDto,
  ): Promise<SuccessResponseType<RoleResponseDto>> {
    return this.roleService.updateRoleById(id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Permission({
    action: PermissionAction.WRITE,
    resource: PermissionResource.ADMIN,
  })
  @Swagger({
    summary: 'Delete role by id',
    description: 'Delete role by id',
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
    withAuth: true,
  })
  async deleteRoleById(@Param('id') id: string): Promise<SuccessResponseType> {
    return this.roleService.deleteRoleById(id);
  }

  @Get('user/:userId')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Get role by user id',
    description: 'Get role by user id',
    response: [RoleResponseDto],
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
    withAuth: true,
  })
  async getRoleByUserId(
    @Param('userId') userId: string,
  ): Promise<SuccessResponseType<RoleResponseDto[]>> {
    return this.roleService.getRoleByUserId(userId);
  }
}
