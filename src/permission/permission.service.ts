import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionResponseDto } from './dto';
import { PermissionAction, PermissionResource } from 'src/common/constants';
import { SuccessResponseType } from 'src/common/types';
import { UpdatePermissionBodyDto } from './dto/update-permission-body.dto';
@Injectable()
export class PermissionService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllPermissions(): Promise<
    SuccessResponseType<PermissionResponseDto[]>
  > {
    const permissions = await this.prismaService.permission.findMany();
    const result: SuccessResponseType<PermissionResponseDto[]> = {
      message: 'Success',
      data: permissions.map((p) => {
        return {
          action: p.action as PermissionAction,
          resource: p.resource as PermissionResource,
          description: p.description,
        } satisfies PermissionResponseDto;
      }),
    };
    return result;
  }

  async getPermissionById(
    id: string,
  ): Promise<SuccessResponseType<PermissionResponseDto>> {
    this.prismaService.validateObjectId(id, 'id');
    const permission = await this.prismaService.permission.findUnique({
      where: { id },
    });
    if (!permission) throw new BadRequestException('Permission not found');
    const result: SuccessResponseType<PermissionResponseDto> = {
      message: 'Success',
      data: {
        action: permission.action as PermissionAction,
        resource: permission.resource as PermissionResource,
        description: permission.description,
      },
    };
    return result;
  }
  async getPermissionsByUserId(
    userId: string,
  ): Promise<SuccessResponseType<PermissionResponseDto[]>> {
    this.prismaService.validateObjectId(userId, 'userId');
    const userRoles = await this.prismaService.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (userRoles.length === 0) {
      return { message: 'Success', data: [] };
    }

    const permissions = userRoles.flatMap((userRole) =>
      userRole.role.permissions.map(
        (rp) =>
          ({
            action: rp.permission.action as PermissionAction,
            resource: rp.permission.resource as PermissionResource,
            description: rp.permission.description,
          }) satisfies PermissionResponseDto,
      ),
    );

    const result: SuccessResponseType<PermissionResponseDto[]> = {
      message: 'Success',
      data: permissions,
    };
    return result;
  }

  async getPermissionsByRoleId(
    roleId: string,
  ): Promise<SuccessResponseType<PermissionResponseDto[]>> {
    this.prismaService.validateObjectId(roleId, 'roleId');
    const permissions = await this.prismaService.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    const result: SuccessResponseType<PermissionResponseDto[]> = {
      message: 'Success',
      data: permissions.map(
        (rp) =>
          ({
            action: rp.permission.action as PermissionAction,
            resource: rp.permission.resource as PermissionResource,
            description: rp.permission.description,
          }) satisfies PermissionResponseDto,
      ),
    };
    return result;
  }

  async updatePermissionById(
    id: string,
    payload: UpdatePermissionBodyDto,
  ): Promise<SuccessResponseType<PermissionResponseDto>> {
    this.prismaService.validateObjectId(id, 'id');

    const permission = await this.prismaService.permission.update({
      where: { id },
      data: payload,
    });
    const result: SuccessResponseType<PermissionResponseDto> = {
      message: 'Success',
      data: {
        action: permission.action as PermissionAction,
        resource: permission.resource as PermissionResource,
        description: permission.description,
      } satisfies PermissionResponseDto,
    };
    return result;
  }
}
