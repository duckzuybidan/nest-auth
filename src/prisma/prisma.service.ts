import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
  validateObjectId(id: string, fieldName = 'id') {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid ObjectId for ${fieldName}: ${id}`);
    }
    return id;
  }
}
