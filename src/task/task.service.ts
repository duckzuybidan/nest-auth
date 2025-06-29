import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly prismaService: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async cleanUpRefreshTokens() {
    try {
      const now = new Date();
      const result = await this.prismaService.refreshToken.deleteMany({
        where: {
          OR: [{ revokedAt: { lt: now } }, { expiresAt: { lt: now } }],
        },
      });

      this.logger.log(
        `🧹 Deleted ${result.count} expired or revoked refresh tokens`,
      );
    } catch (error) {
      this.logger.error('❌ Failed to clean up refresh tokens', error);
    }
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async cleanUnverifiedUsers() {
    try {
      const now = new Date();
      const result = await this.prismaService.user.deleteMany({
        where: { isVerified: false, createdAt: { lt: now } },
      });

      this.logger.log(`🧹 Deleted ${result.count} unverified users`);
    } catch (error) {
      this.logger.error('❌ Failed to clean up unverified users', error);
    }
  }
}
