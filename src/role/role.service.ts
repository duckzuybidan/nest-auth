import { BadRequestException, Injectable } from '@nestjs/common';
import { SuccessResponseType } from 'src/common/types';
import { RoleResponseDto } from './dto/role-response.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PermissionAction, PermissionResource } from 'src/common/constants';
import { CreateRoleBodyDto, UpdateRoleBodyDto } from './dto';
import { Prisma, Role } from 'generated/prisma';
import { RolePaginationRequestDto } from './dto/role-pagination.dto';
import { checkArrayContain } from 'src/common/utils';

@Injectable()
export class RoleService {
  constructor(private readonly prismaService: PrismaService) {}
  async getAllRoles(
    query: RolePaginationRequestDto,
  ): Promise<SuccessResponseType<RoleResponseDto[]>> {
    const { permissionIds } = query;
    if (permissionIds && permissionIds.length > 0) {
      for (const id of permissionIds) {
        this.prismaService.validateObjectId(id, 'permissionId');
      }
    }
    const candidateRoles = await this.prismaService.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
    const roles = candidateRoles.filter((r) => {
      if (!permissionIds) return true;
      return checkArrayContain<string>(
        r.permissions.map((p) => p.id),
        permissionIds,
      );
    });
    const result: SuccessResponseType<RoleResponseDto[]> = {
      message: 'Success',
      data: roles.map((r) => {
        return {
          id: r.id,
          name: r.name,
          permissions: r.permissions.map(
            (rp) =>
              ({
                id: rp.id,
                action: rp.permission.action as PermissionAction,
                resource: rp.permission.resource as PermissionResource,
              }) satisfies RoleResponseDto['permissions'][0],
          ),
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
          id: rp.id,
          action: rp.permission.action as PermissionAction,
          resource: rp.permission.resource as PermissionResource,
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
    let permissions: RoleResponseDto['permissions'] = [];
    if (payload.permissionIds && payload.permissionIds.length > 0) {
      const foundPermissions = await this.prismaService.permission.findMany({
        where: {
          id: { in: payload.permissionIds },
        },
      });

      if (foundPermissions.length !== payload.permissionIds.length) {
        throw new BadRequestException('Some permissions not found');
      }

      permissions = foundPermissions.map(
        (p) =>
          ({
            id: p.id,
            action: p.action as PermissionAction,
            resource: p.resource as PermissionResource,
          }) satisfies RoleResponseDto['permissions'][0],
      );
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
      const response: SuccessResponseType<RoleResponseDto> = {
        message: 'Success',
        data: {
          id: role.id,
          name: role.name,
          permissions,
        } satisfies RoleResponseDto,
      };
      return response;
    });
    return result;
  }

  async updateRoleById(id: string, payload: UpdateRoleBodyDto) {
    if (payload.permissionIds) {
      for (const id of payload.permissionIds) {
        this.prismaService.validateObjectId(id, 'permissionId');
      }
    }
    let permissions: RoleResponseDto['permissions'] = [];
    if (payload.permissionIds && payload.permissionIds.length > 0) {
      const foundPermissions = await this.prismaService.permission.findMany({
        where: {
          id: { in: payload.permissionIds },
        },
      });

      if (foundPermissions.length !== payload.permissionIds.length) {
        throw new BadRequestException('Some permissions not found');
      }

      permissions = foundPermissions.map(
        (p) =>
          ({
            id: p.id,
            action: p.action as PermissionAction,
            resource: p.resource as PermissionResource,
          }) satisfies RoleResponseDto['permissions'][0],
      );
    }
    const queries = [
      this.prismaService.role.update({
        where: { id },
        data: { name: payload.name },
      }),
      this.prismaService.rolePermission.deleteMany({
        where: { roleId: id },
      }),
    ];

    if (payload.permissionIds && payload.permissionIds.length > 0) {
      queries.push(
        this.prismaService.rolePermission.createMany({
          data: payload.permissionIds.map((p) => ({
            roleId: id,
            permissionId: p,
          })),
        }),
      );
    }

    const [role, _, __] = (await this.prismaService
      .$transaction(queries)
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new BadRequestException('Role already exists');
          } else if (error.code === 'P2025') {
            throw new BadRequestException('Role not found');
          }
        }
        throw error;
      })) as [Role, Prisma.BatchPayload, Prisma.BatchPayload];
    const result: SuccessResponseType<RoleResponseDto> = {
      message: 'Success',
      data: {
        id,
        name: role.name,
        permissions,
      } satisfies RoleResponseDto,
    };
    return result;
  }
  async deleteRoleById(id: string): Promise<SuccessResponseType> {
    this.prismaService.validateObjectId(id, 'id');
    await this.prismaService
      .$transaction([
        this.prismaService.rolePermission.deleteMany({
          where: { roleId: id },
        }),
        this.prismaService.role.delete({
          where: { id },
        }),
      ])
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

  async getRolesByUserId(
    userId: string,
  ): Promise<SuccessResponseType<RoleResponseDto[]>> {
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
          permissions: r.role.permissions.map(
            (rp) =>
              ({
                id: rp.id,
                action: rp.permission.action as PermissionAction,
                resource: rp.permission.resource as PermissionResource,
              }) satisfies RoleResponseDto['permissions'][0],
          ),
        } satisfies RoleResponseDto;
      }),
    };
    return result;
  }
}
