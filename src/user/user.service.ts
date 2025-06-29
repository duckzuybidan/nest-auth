import { BadRequestException, Injectable } from '@nestjs/common';
import {
  UserPaginationRequestDto,
  UserPaginationResponseDto,
  UserResponseDto,
} from './dto';
import { SuccessResponseType } from 'src/common/types';
import { PrismaService } from 'src/prisma/prisma.service';
import { SortOptions } from './constants';
import { Prisma, User } from 'generated/prisma';
import { CreateUserBodyDto } from './dto/create-user-body.dto';
import { UpdateUserBodyDto } from './dto/update-user-body.dto';
import { checkArrayContain } from 'src/common/utils';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}
  mapSortOptionsToOrderBy(
    sortArray?: SortOptions[],
  ): Prisma.UserOrderByWithRelationInput[] | undefined {
    if (!sortArray || !sortArray.length) {
      return undefined;
    }

    return sortArray.map((item) => {
      const [field, order] = item.split(':') as [string, 'asc' | 'desc'];
      return { [field]: order };
    });
  }
  async getAllUsers(
    query: UserPaginationRequestDto,
  ): Promise<
    SuccessResponseType<UserResponseDto[], UserPaginationResponseDto>
  > {
    const { page, limit, isActive, search, sort, roleIds } = query;
    if (roleIds && roleIds.length > 0) {
      for (const id of roleIds) {
        this.prismaService.validateObjectId(id, 'roleIds');
      }
    }
    const where: Prisma.UserWhereInput = {
      email: search ? { contains: search, mode: 'insensitive' } : undefined,
      isActive,
    };

    const orderBy = this.mapSortOptionsToOrderBy(sort);

    const [totalCount, candidateUsers] = await this.prismaService.$transaction([
      this.prismaService.user.count({ where }),
      this.prismaService.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where,
        orderBy,
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }),
    ]);
    const users = candidateUsers.filter((u) => {
      if (!roleIds) return true;
      return checkArrayContain<string>(
        u.roles.map((r) => r.role.id),
        roleIds,
      );
    });
    const data: UserResponseDto[] = users.map((u) => ({
      id: u.id,
      email: u.email,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      roles: u.roles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    }));

    const meta: UserPaginationResponseDto = {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };

    return {
      message: 'Success',
      data,
      meta,
    };
  }

  async getUserById(id: string): Promise<SuccessResponseType<UserResponseDto>> {
    this.prismaService.validateObjectId(id, 'id');
    const user = await this.prismaService.user.findUniqueOrThrow({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    const result: SuccessResponseType<UserResponseDto> = {
      message: 'Success',
      data: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        roles: user.roles.map((ur) => ur.role),
      },
    };
    return result;
  }

  async createUser(
    payload: CreateUserBodyDto,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    if (payload.roleIds) {
      for (const id of payload.roleIds) {
        this.prismaService.validateObjectId(id, 'roleIds');
      }
    }
    let roles: UserResponseDto['roles'] = [];
    if (payload.roleIds && payload.roleIds.length > 0) {
      const foundRoles = await this.prismaService.role.findMany({
        where: { id: { in: payload.roleIds } },
      });
      if (foundRoles.length !== payload.roleIds.length) {
        throw new BadRequestException('Some roles not found');
      }
      roles = foundRoles.map(
        (r) =>
          ({ id: r.id, name: r.name }) satisfies UserResponseDto['roles'][0],
      );
    }
    const result = await this.prismaService.$transaction(async (tx) => {
      const user = await tx.user
        .create({
          data: {
            email: payload.email,
            passwordHash: payload.password,
            isActive: payload.isActive,
          },
        })
        .catch((error) => {
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2002'
          ) {
            throw new BadRequestException('Email already exists');
          }
          throw error;
        });
      if (payload.roleIds && payload.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: payload.roleIds.map((id) => ({
            userId: user.id,
            roleId: id,
          })),
        });
      }
      const response: SuccessResponseType<UserResponseDto> = {
        message: 'Success',
        data: {
          id: user.id,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
          roles,
        },
      };
      return response;
    });
    return result;
  }

  async updateUserById(
    id: string,
    payload: UpdateUserBodyDto,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    this.prismaService.validateObjectId(id, 'id');
    if (payload.roleIds) {
      for (const id of payload.roleIds) {
        this.prismaService.validateObjectId(id, 'roleIds');
      }
    }
    let roles: UserResponseDto['roles'] = [];
    if (payload.roleIds && payload.roleIds.length > 0) {
      const foundRoles = await this.prismaService.role.findMany({
        where: { id: { in: payload.roleIds } },
      });
      if (foundRoles.length !== payload.roleIds.length) {
        throw new BadRequestException('Some roles not found');
      }
      roles = foundRoles.map(
        (r) =>
          ({ id: r.id, name: r.name }) satisfies UserResponseDto['roles'][0],
      );
    }
    const queries = [
      this.prismaService.user.update({
        where: { id },
        data: {
          email: payload.email,
          passwordHash: payload.password,
          isActive: payload.isActive,
        },
      }),
      this.prismaService.userRole.deleteMany({ where: { userId: id } }),
    ];
    if (payload.roleIds && payload.roleIds.length > 0) {
      queries.push(
        this.prismaService.userRole.createMany({
          data: payload.roleIds.map((id) => ({
            userId: id,
            roleId: id,
          })),
        }),
      );
    }
    const [user, _, __] = (await this.prismaService
      .$transaction(queries)
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            throw new BadRequestException('Email already exists');
          } else if (error.code === 'P2025') {
            throw new BadRequestException('User not found');
          }
        }
      })) as [User, Prisma.BatchPayload, Prisma.BatchPayload];
    const result: SuccessResponseType<UserResponseDto> = {
      message: 'Success',
      data: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        roles,
      },
    };
    return result;
  }

  async deleteUserById(
    id: string,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    this.prismaService.validateObjectId(id, 'id');
    const user = await this.prismaService.user.delete({
      where: { id },
      include: { roles: { include: { role: true } } },
    });
    const result: SuccessResponseType<UserResponseDto> = {
      message: 'Success',
      data: {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        roles: user.roles.map((ur) => ur.role),
      },
    };
    return result;
  }
}
