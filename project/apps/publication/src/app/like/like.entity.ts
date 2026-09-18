import { Like } from '@project/shared-types';
import { randomUUID } from 'node:crypto';

export class LikeEntity implements Like {
  public readonly id: string;
  public readonly publicationId: string;
  public readonly userId: string;
  public readonly createdAt: Date;

  private constructor(data: Like) {
    this.id = data.id;
    this.publicationId = data.publicationId;
    this.userId = data.userId;
    this.createdAt = data.createdAt;
  }

  public static create(publicationId: string, userId: string): LikeEntity {
    return new LikeEntity({
      id: randomUUID(),
      publicationId,
      userId,
      createdAt: new Date(),
    });
  }

  public static restore(data: Like): LikeEntity {
    return new LikeEntity(data);
  }
}
