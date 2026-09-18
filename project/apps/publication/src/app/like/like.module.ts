import { Module } from '@nestjs/common';
import { LikeController } from './like.controller';
import { LikePrismaRepository } from './like-prisma.repository';
import { LIKE_REPOSITORY } from './like.repository';
import { LikeService } from './like.service';

@Module({
  controllers: [LikeController],
  providers: [
    LikeService,
    LikePrismaRepository,
    {
      provide: LIKE_REPOSITORY,
      useExisting: LikePrismaRepository,
    },
  ],
})
export class LikeModule {}
