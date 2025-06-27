import { BadRequestException, Injectable } from '@nestjs/common';
import { SuccessResponseType } from 'src/common/types';
import { RoleResponseDto } from './dto/role-response.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionAction, PermissionResource } from 'src/common/constants';
import { CreateRoleBodyDto, UpdateRoleBodyDto } from './dto';
import { PermissionResponseDto } from 'src/permission/dto';
import { Prisma } from 'generated/prisma';

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}
  async getAllRoles(): Promise<SuccessResponseType<RoleResponseDto[]>> {
    const roles = await this.prismaService.role.findMany({
      include: { permissions: { include: { permission: true } } },
    });
    const result: SuccessResponseType<RoleResponseDto[]> = {
      message: 'Success',
      data: roles.map((r) => {
        return {
          id: r.id,
          name: r.name,
          permissions: r.permissions.map((rp) => ({
            action: rp.permission.action as PermissionAction,
            resource: rp.permission.resource as PermissionResource,
            description: rp.permission.description,
          })),
        } satisfies RoleResponseDto;
      }),
    };
    return result;
  }

  async getRoleById(id: string): Promise<SuccessResponseType<RoleResponseDto>> {
    this.prismaService.validateObjectId(id, 'id');
    const role = await this.prismaService.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) throw new BadRequestException('Role not found');
    const result: SuccessResponseType<RoleResponseDto> = {
      message: 'Success',
      data: {
        id: role.id,
        name: role.name,
        permissions: role.permissions.map((rp) => ({
          action: rp.permission.action as PermissionAction,
          resource: rp.permission.resource as PermissionResource,
          description: rp.permission.description,
        })),
      } satisfies RoleResponseDto,
    };
    return result;
  }

  async createRole(
    payload: CreateRoleBodyDto,
  ): Promise<SuccessResponseType<RoleResponseDto>> {
    if (payload.permissionIds) {
      for (const id of payload.permissionIds) {
        this.prismaService.validateObjectId(id, 'permissionId');
      }
    }
    const result = await this.prismaService.$transaction(async (tx) => {
      const role = await tx.role
        .create({ data: { name: payload.name } })
        .catch((error) => {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            throw new BadRequestException('Role already exists');
          }
          throw error;
        });
      if (payload.permissionIds && payload.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: payload.permissionIds.map((p) => ({
            roleId: role.id,
            permissionId: p,
          })),
        });
      }
      const permissions = await tx.rolePermission
        .findMany({
          where: { roleId: role.id },
          include: { permission: true },
        })
        .then((rps) =>
          rps.map(
            (rp) =>
              ({
                action: rp.permission.action as PermissionAction,
                resource: rp.permission.resource as PermissionResource,
                description: rp.permission.description,
              }) satisfies PermissionResponseDto,
          ),
        );
      const res: SuccessResponseType<RoleResponseDto> = {
        message: 'Success',
        data: {
          id: role.id,
          name: role.name,
          permissions,
        } satisfies RoleResponseDto,
      };
      return res;
    });
    return result;
  }

  async updateRoleById(id: string, payload: UpdateRoleBodyDto) {
    if (payload.permissionIds) {
      for (const id of payload.permissionIds) {
        this.prismaService.validateObjectId(id, 'permissionId');
      }
    }
    const result = await this.prismaService.$transaction(async (tx) => {
      const role = await tx.role
        .update({
          where: { id },
          data: { name: payload.name },
        })
        .catch((error) => {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
              throw new BadRequestException('Role already exists');
            } else if (error.code === 'P2025') {
              throw new BadRequestException('Role not found');
            }
          }
          throw error;
        });
      if (payload.permissionIds && payload.permissionIds.length > 0) {
        await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
        await tx.rolePermission.createMany({
          data: payload.permissionIds.map((p) => ({
            roleId: role.id,
            permissionId: p,
          })),
        });
      }
      const permissions = await tx.rolePermission
        .findMany({
          where: { roleId: role.id },
          include: { permission: true },
        })
        .then((rps) =>
          rps.map(
            (rp) =>
              ({
                action: rp.permission.action as PermissionAction,
                resource: rp.permission.resource as PermissionResource,
                description: rp.permission.description,
              }) satisfies PermissionResponseDto,
          ),
        );
      const res: SuccessResponseType<RoleResponseDto> = {
        message: 'Success',
        data: {
          id: role.id,
          name: role.name,
          permissions,
        } satisfies RoleResponseDto,
      };
      return res;
    });
    return result;
  }
  async deleteRoleById(id: string): Promise<SuccessResponseType> {
    this.prismaService.validateObjectId(id, 'id');
    await this.prismaService
      .$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        await tx.role.delete({
          where: { id },
        });
      })
      .catch((error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2025'
        ) {
          throw new BadRequestException('Role not found');
        }
        throw error;
      });
    return { message: 'Success', data: {} };
  }

  async getRoleByUserId(
    userId: string,
  ): Promise<SuccessResponseType<RoleResponseDto[]>> {
    console.log(userId);
    const roles = await this.prismaService.userRole.findMany({
      where: { userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
      },
    });
    const result: SuccessResponseType<RoleResponseDto[]> = {
      message: 'Success',
      data: roles.map((r) => {
        return {
          id: r.role.id,
          name: r.role.name,
          permissions: r.role.permissions.map((rp) => ({
            action: rp.permission.action as PermissionAction,
            resource: rp.permission.resource as PermissionResource,
            description: rp.permission.description,
          })),
        } satisfies RoleResponseDto;
      }),
    };
    return result;
  }
}
