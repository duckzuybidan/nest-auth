import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';

const prisma = new PrismaClient();
const logger = new Logger('RoleSeed');

async function main() {
  const allPermissions = await prisma.permission.findMany();

  if (allPermissions.length === 0) {
    logger.error('❌ No permissions found. Please seed permissions first.');
    process.exit(1);
  }

  const superAdminRole = await prisma.role.upsert({
    where: { name: 'super_admin' },
    update: {},
    create: { name: 'super_admin' },
  });

  const rolePermissionData = allPermissions.map((permission) => ({
    roleId: superAdminRole.id,
    permissionId: permission.id,
  }));

  await prisma.rolePermission.deleteMany({
    where: {
      roleId: superAdminRole.id,
    },
  });

  await prisma.rolePermission.createMany({
    data: rolePermissionData,
  });

  logger.log(
    `✅ Super admin role seeded with ${allPermissions.length} permissions`,
  );
}

main()
  .catch((e) => {
    logger.error('❌ Role seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
