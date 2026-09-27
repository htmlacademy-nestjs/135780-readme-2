import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LikeEntity } from './like.entity';
import { LIKE_REPOSITORY, type LikeRepository } from './like.repository';
import { PublicationService } from '../publication/publication.service';

@Injectable()
export class LikeService {
  public constructor(
    @Inject(LIKE_REPOSITORY)
    private readonly repository: LikeRepository,
    private readonly publicationService: PublicationService,
  ) {}

  public async add(
    publicationId: string,
    userId: string,
  ): Promise<LikeEntity> {
    await this.publicationService.getPublishedById(publicationId);
    const existingLike =
      await this.repository.findByPublicationIdAndUserId(publicationId, userId);

    if (existingLike) {
      throw new ConflictException('Publication is already liked');
    }

    return this.repository.save(LikeEntity.create(publicationId, userId));
  }

  public async remove(publicationId: string, userId: string): Promise<void> {
    const entity =
      await this.repository.findByPublicationIdAndUserId(publicationId, userId);

    if (!entity) {
      throw new NotFoundException('Like not found');
    }

    await this.repository.delete(entity.id);
  }
}
