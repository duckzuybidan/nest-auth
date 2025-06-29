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
import { JwtAuthGuard } from 'src/auth/guards';
import { PermissionAction, PermissionResource } from 'src/common/constants';
import { Permission } from 'src/permission/decorators';
import { PermissionGuard } from 'src/permission/guards';
import {
  UpdateUserBodyDto,
  UserPaginationRequestDto,
  UserPaginationResponseDto,
  UserResponseDto,
  CreateUserBodyDto,
} from './dto';
import { SuccessResponseType } from 'src/common/types';
import { UserService } from './user.service';
import { Swagger, swaggerConfig } from 'src/libs/swagger';
import { ApiParam } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Permission({
  action: PermissionAction.READ,
  resource: PermissionResource.ADMIN,
})
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {
    swaggerConfig.addTag(
      'User',
      `Permission required: ${PermissionAction.READ} ${PermissionResource.ADMIN} and ${PermissionAction.WRITE} ${PermissionResource.ADMIN}`,
    );
  }
  @Get()
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Get all users',
    description: 'Get all users',
    response: [UserResponseDto],
    metaResponse: UserPaginationResponseDto,
    successCode: HttpStatus.OK,
    withAuth: true,
    errorCodes: [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.BAD_REQUEST,
    ],
  })
  async getAllUsers(
    @Query() query: UserPaginationRequestDto,
  ): Promise<
    SuccessResponseType<UserResponseDto[], UserPaginationResponseDto>
  > {
    return this.userService.getAllUsers(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Get user by id',
    description: 'Get user by id',
    response: UserResponseDto,
    successCode: HttpStatus.OK,
    withAuth: true,
    errorCodes: [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.BAD_REQUEST,
    ],
  })
  @ApiParam({ name: 'id', type: String })
  async getUserById(
    @Param('id') id: string,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    return this.userService.getUserById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Swagger({
    summary: 'Create user',
    description: 'Create user',
    response: UserResponseDto,
    successCode: HttpStatus.CREATED,
    withAuth: true,
    errorCodes: [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.BAD_REQUEST,
    ],
  })
  async createUser(
    @Body() payload: CreateUserBodyDto,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    return this.userService.createUser(payload);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Update user by id',
    description: 'Update user by id',
    response: UserResponseDto,
    successCode: HttpStatus.OK,
    withAuth: true,
    errorCodes: [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.BAD_REQUEST,
    ],
  })
  @ApiParam({ name: 'id', type: String })
  async updateUserById(
    @Param('id') id: string,
    @Body() payload: UpdateUserBodyDto,
  ): Promise<SuccessResponseType<UserResponseDto>> {
    return this.userService.updateUserById(id, payload);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Swagger({
    summary: 'Delete user by id',
    description: 'Delete user by id',
    response: UserResponseDto,
    successCode: HttpStatus.OK,
    withAuth: true,
    errorCodes: [
      HttpStatus.UNAUTHORIZED,
      HttpStatus.FORBIDDEN,
      HttpStatus.BAD_REQUEST,
    ],
  })
  @ApiParam({ name: 'id', type: String })
  async deleteUserById(@Param('id') id: string): Promise<SuccessResponseType> {
    return this.userService.deleteUserById(id);
  }
}
