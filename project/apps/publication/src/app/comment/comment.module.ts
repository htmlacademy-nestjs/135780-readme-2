import { Module } from '@nestjs/common';
import { PublicationModule } from '../publication/publication.module';
import { CommentController } from './comment.controller';
import { CommentPrismaRepository } from './comment-prisma.repository';
import { COMMENT_REPOSITORY } from './comment.repository';
import { CommentService } from './comment.service';

@Module({
  imports: [PublicationModule],
  controllers: [CommentController],
  providers: [
    CommentService,
    CommentPrismaRepository,
    {
      provide: COMMENT_REPOSITORY,
      useExisting: CommentPrismaRepository,
    },
  ],
})
export class CommentModule {}
