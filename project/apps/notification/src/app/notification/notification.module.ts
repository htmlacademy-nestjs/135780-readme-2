import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailService } from '../mail/mail.service';
import {
  SubscriberModel,
  SubscriberSchema,
} from '../subscriber/subscriber.model';
import { SubscriberRepository } from '../subscriber/subscriber.repository';
import {
  NotificationPublicationModel,
  NotificationPublicationSchema,
} from '../notification-publication/notification-publication.model';
import { NotificationPublicationRepository } from '../notification-publication/notification-publication.repository';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationEventService } from './notification-event.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubscriberModel.name, schema: SubscriberSchema },
      {
        name: NotificationPublicationModel.name,
        schema: NotificationPublicationSchema,
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [
    SubscriberRepository,
    NotificationPublicationRepository,
    MailService,
    NotificationService,
    NotificationEventService,
  ],
  exports: [NotificationEventService],
})
export class NotificationModule {}
