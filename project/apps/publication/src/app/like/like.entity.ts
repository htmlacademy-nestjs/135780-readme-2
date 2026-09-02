import { Like } from '@project/shared-types';
import { randomUUID } from 'node:crypto';

export class LikeEntity implements Like {
  public readonly id: string;
  public readonly publicationId: string;
  public readonly userId: string;
  public readonly createdAt: Date;

  public constructor(publicationId: string, userId: string) {
    this.id = randomUUID();
    this.publicationId = publicationId;
    this.userId = userId;
    this.createdAt = new Date();
  }
}
