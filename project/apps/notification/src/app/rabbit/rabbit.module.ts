import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { RabbitController } from './rabbit.controller';
import { NotificationEventFilter } from './notification-event.filter';

@Module({
  imports: [NotificationModule],
  controllers: [RabbitController],
  providers: [NotificationEventFilter],
})
export class RabbitModule {}
