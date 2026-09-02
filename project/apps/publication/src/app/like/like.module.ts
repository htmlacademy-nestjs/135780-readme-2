import { Module } from '@nestjs/common';
import { LikeController } from './like.controller';
import { LikeMemoryRepository } from './like-memory.repository';
import { LIKE_REPOSITORY } from './like.repository';
import { LikeService } from './like.service';

@Module({
  controllers: [LikeController],
  providers: [
    LikeService,
    LikeMemoryRepository,
    {
      provide: LIKE_REPOSITORY,
      useExisting: LikeMemoryRepository,
    },
  ],
})
export class LikeModule {}
