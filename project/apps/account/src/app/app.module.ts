import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { createMongoConnectionString } from './config/database.config';
import { validateEnvironment } from './config/environment.validation';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['apps/account/.env', '.env'],
      validate: validateEnvironment,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: createMongoConnectionString(configService),
      }),
    }),
    UserModule,
  ],
})
export class AppModule {}
