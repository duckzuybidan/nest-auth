export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
}
export enum PermissionResource {
  ADMIN = 'admin',
}

export const PERMISSIONS = [
  { action: PermissionAction.READ, resource: PermissionResource.ADMIN },
  { action: PermissionAction.WRITE, resource: PermissionResource.ADMIN },
] as const;
