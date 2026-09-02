import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentMemoryRepository } from './comment-memory.repository';
import { COMMENT_REPOSITORY } from './comment.repository';
import { CommentService } from './comment.service';

@Module({
  controllers: [CommentController],
  providers: [
    CommentService,
    CommentMemoryRepository,
    {
      provide: COMMENT_REPOSITORY,
      useExisting: CommentMemoryRepository,
    },
  ],
})
export class CommentModule {}
