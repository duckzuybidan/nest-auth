import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly logger = new Logger(RedisService.name);
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.client = createClient({
      username: 'default',
      password: this.configService.get<string>('REDIS_PASSWORD'),
      socket: {
        host: this.configService.get<string>('REDIS_HOST'),
        port: Number(this.configService.get<string>('REDIS_PORT')),
      },
    });

    this.client.on('error', (err) =>
      this.logger.error('Redis Client Error', err),
    );

    await this.client.connect();
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.client.set(key, value, { EX: ttl });
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string) {
    await this.client.del(key);
  }
  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async onModuleDestroy() {
    await Promise.all([this.client?.quit()]);
  }
}
