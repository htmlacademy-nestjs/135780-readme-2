import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createMongoConnectionString } from './config/database.config';
import { validateEnvironment } from './config/environment.validation';
import { NotificationModule } from './notification/notification.module';
import { RabbitModule } from './rabbit/rabbit.module';

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
    NotificationModule,
    RabbitModule,
  ],
})
export class AppModule {}
