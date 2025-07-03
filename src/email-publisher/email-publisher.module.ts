import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailPublisherService } from './email-publisher.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_QUEUE_NAME } from 'src/common/constants';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: EMAIL_QUEUE_NAME,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URL') ||
                'amqp://guest:guest@localhost:5672',
            ],
            queue: configService.get<string>('RABBITMQ_EMAIL_QUEUE'),
            queueOptions: {
              durable: true,
            },
          },
        }),
      },
    ]),
  ],
  providers: [EmailPublisherService],
  exports: [EmailPublisherService],
})
export class EmailPublisherModule {}
