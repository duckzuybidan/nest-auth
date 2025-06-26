import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';
import { PermissionAction, PermissionResource } from 'src/common/constants';

const prisma = new PrismaClient();
const logger = new Logger('PermissionSeed');
async function main() {
  const filePath = path.join(__dirname, 'permissions.json');
  const permissions: {
    action: PermissionAction;
    resource: PermissionResource;
  }[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  await prisma.permission.deleteMany({});
  for (const { action, resource } of permissions) {
    await prisma.permission.upsert({
      where: {
        action_resource: { action, resource },
      },
      update: {},
      create: {
        action,
        resource,
        description: `${action} access to ${resource}`,
      },
    });
  }

  logger.log(`✅ Seeded ${permissions.length} permissions`);
}

main()
  .catch((e) => {
    logger.error('❌ Permission seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
