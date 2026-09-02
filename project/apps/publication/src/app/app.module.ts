import { Module } from '@nestjs/common';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { PublicationModule } from './publication/publication.module';

@Module({
  imports: [PublicationModule, CommentModule, LikeModule],
})
export class AppModule {}
