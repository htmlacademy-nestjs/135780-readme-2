import { Repository } from '@project/shared-types';
import { LikeEntity } from './like.entity';

export const LIKE_REPOSITORY = Symbol('LIKE_REPOSITORY');

export interface LikeRepository extends Repository<LikeEntity> {
  findByPublicationIdAndUserId(
    publicationId: string,
    userId: string,
  ): Promise<LikeEntity | null>;
  delete(id: string): Promise<boolean>;
}
