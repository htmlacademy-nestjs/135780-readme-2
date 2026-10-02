import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  AccountNotificationPublisher,
  NOTIFICATION_CLIENT,
} from './notification.publisher';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: NOTIFICATION_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBITMQ_URL')],
            queue: config.getOrThrow<string>('RABBITMQ_QUEUE'),
            queueOptions: { durable: true },
            persistent: true,
          },
        }),
      },
    ]),
  ],
  providers: [AccountNotificationPublisher],
  exports: [AccountNotificationPublisher],
})
export class AccountNotificationModule {}
