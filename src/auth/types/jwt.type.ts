import { PermissionResponseDto } from 'src/permission/dto';

export type JwtPayloadType = {
  sub: string;
  permissions: PermissionResponseDto[];
};
