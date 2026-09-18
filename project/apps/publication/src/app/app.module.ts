import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommentModule } from './comment/comment.module';
import { validateEnvironment } from './config/environment.validation';
import { LikeModule } from './like/like.module';
import { PrismaModule } from './prisma/prisma.module';
import { PublicationModule } from './publication/publication.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['apps/publication/.env', '.env'],
      validate: validateEnvironment,
    }),
    PrismaModule,
    PublicationModule,
    CommentModule,
    LikeModule,
  ],
})
export class AppModule {}
