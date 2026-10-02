import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createMongoConnectionString } from './config/database.config';
import { validateEnvironment } from './config/environment.validation';
import { MailService } from './mail/mail.service';
import {
  NotificationPublicationModel,
  NotificationPublicationSchema,
} from './notification-publication/notification-publication.model';
import { NotificationPublicationRepository } from './notification-publication/notification-publication.repository';
import { NotificationController } from './notification/notification.controller';
import { NotificationService } from './notification/notification.service';
import { RabbitController } from './rabbit/rabbit.controller';
import { SubscriberModel, SubscriberSchema } from './subscriber/subscriber.model';
import { SubscriberRepository } from './subscriber/subscriber.repository';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['apps/notification/.env', '.env'],
      validate: validateEnvironment,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: createMongoConnectionString(config),
      }),
    }),
    MongooseModule.forFeature([
      { name: SubscriberModel.name, schema: SubscriberSchema },
      {
        name: NotificationPublicationModel.name,
        schema: NotificationPublicationSchema,
      },
    ]),
  ],
  controllers: [NotificationController, RabbitController],
  providers: [
    SubscriberRepository,
    NotificationPublicationRepository,
    MailService,
    NotificationService,
  ],
})
export class AppModule {}
