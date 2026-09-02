import { Injectable } from '@nestjs/common';
import { CommentEntity } from './comment.entity';
import { CommentRepository } from './comment.repository';

@Injectable()
export class CommentMemoryRepository implements CommentRepository {
  private readonly comments = new Map<string, CommentEntity>();

  public async save(entity: CommentEntity): Promise<CommentEntity> {
    this.comments.set(entity.id, entity);
    return entity;
  }

  public async findById(id: string): Promise<CommentEntity | null> {
    return this.comments.get(id) ?? null;
  }

  public async findByPublicationId(
    publicationId: string,
  ): Promise<CommentEntity[]> {
    return [...this.comments.values()].filter(
      (comment) => comment.publicationId === publicationId,
    );
  }

  public async delete(id: string): Promise<boolean> {
    return this.comments.delete(id);
  }
}
