import { Injectable } from '@nestjs/common';
import { LikeEntity } from './like.entity';
import { LikeRepository } from './like.repository';

@Injectable()
export class LikeMemoryRepository implements LikeRepository {
  private readonly likes = new Map<string, LikeEntity>();

  public async save(entity: LikeEntity): Promise<LikeEntity> {
    this.likes.set(entity.id, entity);
    return entity;
  }

  public async findById(id: string): Promise<LikeEntity | null> {
    return this.likes.get(id) ?? null;
  }

  public async findByPublicationIdAndUserId(
    publicationId: string,
    userId: string,
  ): Promise<LikeEntity | null> {
    return (
      [...this.likes.values()].find(
        (like) =>
          like.publicationId === publicationId && like.userId === userId,
      ) ?? null
    );
  }

  public async delete(id: string): Promise<boolean> {
    return this.likes.delete(id);
  }
}
