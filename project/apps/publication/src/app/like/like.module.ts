import { Module } from '@nestjs/common';
import { PublicationModule } from '../publication/publication.module';
import { LikeController } from './like.controller';
import { LikePrismaRepository } from './like-prisma.repository';
import { LIKE_REPOSITORY } from './like.repository';
import { LikeService } from './like.service';

@Module({
  imports: [PublicationModule],
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
