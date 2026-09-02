import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LikeEntity } from './like.entity';
import { LIKE_REPOSITORY, type LikeRepository } from './like.repository';

@Injectable()
export class LikeService {
  public constructor(
    @Inject(LIKE_REPOSITORY)
    private readonly repository: LikeRepository,
  ) {}

  public async add(
    publicationId: string,
    userId: string,
  ): Promise<LikeEntity> {
    const existingLike =
      await this.repository.findByPublicationIdAndUserId(publicationId, userId);

    if (existingLike) {
      throw new ConflictException('Publication is already liked');
    }

    return this.repository.save(new LikeEntity(publicationId, userId));
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
