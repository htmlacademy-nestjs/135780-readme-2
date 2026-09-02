import { Comment } from '@project/shared-types';
import { randomUUID } from 'node:crypto';

export class CommentEntity implements Comment {
  public readonly id: string;
  public readonly publicationId: string;
  public readonly authorId: string;
  public readonly text: string;
  public readonly createdAt: Date;

  public constructor(publicationId: string, authorId: string, text: string) {
    this.id = randomUUID();
    this.publicationId = publicationId;
    this.authorId = authorId;
    this.text = text;
    this.createdAt = new Date();
  }
}
