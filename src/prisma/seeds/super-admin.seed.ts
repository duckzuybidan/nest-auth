import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const logger = new Logger('SuperAdminSeed');

async function main() {
  const email = 'superadmin@gmail.com';
  const password = 'Password123!';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  const superAdminRole = await prisma.role.findUnique({
    where: { name: 'super_admin' },
  });

  if (!superAdminRole) {
    logger.error('❌ Role "super_admin" not found. Seed roles first.');
    process.exit(1);
  }

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: superAdminRole.id,
    },
  });

  logger.log(`✅ Created super admin user: ${email}`);
}

main()
  .catch((e) => {
    logger.error('❌ Super admin seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
