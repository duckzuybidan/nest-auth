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
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { PermissionGuard } from 'src/permission/guards';
import { JwtAuthGuard } from 'src/auth/guards';
import { PermissionAction, PermissionResource } from 'src/common/constants';
import { Permission } from 'src/permission/decorators';
import { RoleResponseDto, CreateRoleBodyDto, UpdateRoleBodyDto } from './dto';
import { SuccessResponseType } from 'src/common/types';
import { Swagger, swaggerConfig } from 'src/libs/swagger';
import { RolePaginationRequestDto } from './dto/role-pagination.dto';
@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({
  action: PermissionAction.READ,
  resource: PermissionResource.ADMIN,
})
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {
    swaggerConfig.addTag(
      'Role',
      `Permission required: ${PermissionAction.READ} ${PermissionResource.ADMIN} and ${PermissionAction.WRITE} ${PermissionResource.ADMIN}`,
    );
  }
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
  async getAllRoles(
    @Query() query: RolePaginationRequestDto,
  ): Promise<SuccessResponseType<RoleResponseDto[]>> {
    return this.roleService.getAllRoles(query);
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
  @Permission({
    action: PermissionAction.WRITE,
    resource: PermissionResource.ADMIN,
  })
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
  @Permission({
    action: PermissionAction.WRITE,
    resource: PermissionResource.ADMIN,
  })
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
  @Permission({
    action: PermissionAction.WRITE,
    resource: PermissionResource.ADMIN,
  })
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
    summary: 'Get roles by user id',
    description: 'Get roles by user id',
    response: [RoleResponseDto],
    successCode: HttpStatus.OK,
    errorCodes: [
      HttpStatus.BAD_REQUEST,
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
    ],
    withAuth: true,
  })
  async getRolesByUsersId(
    @Param('userId') userId: string,
  ): Promise<SuccessResponseType<RoleResponseDto[]>> {
    return this.roleService.getRolesByUserId(userId);
  }
}
