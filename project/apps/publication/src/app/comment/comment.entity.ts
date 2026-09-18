import { Comment } from '@project/shared-types';
import { randomUUID } from 'node:crypto';

export class CommentEntity implements Comment {
  public readonly id: string;
  public readonly publicationId: string;
  public readonly authorId: string;
  public readonly text: string;
  public readonly createdAt: Date;

  private constructor(data: Comment) {
    this.id = data.id;
    this.publicationId = data.publicationId;
    this.authorId = data.authorId;
    this.text = data.text;
    this.createdAt = data.createdAt;
  }

  public static create(
    publicationId: string,
    authorId: string,
    text: string,
  ): CommentEntity {
    return new CommentEntity({
      id: randomUUID(),
      publicationId,
      authorId,
      text,
      createdAt: new Date(),
    });
  }

  public static restore(data: Comment): CommentEntity {
    return new CommentEntity(data);
  }
}
