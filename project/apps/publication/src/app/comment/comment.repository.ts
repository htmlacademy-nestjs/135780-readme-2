import { Repository } from '@project/shared-types';
import { CommentEntity } from './comment.entity';

export const COMMENT_REPOSITORY = Symbol('COMMENT_REPOSITORY');

export interface CommentRepository extends Repository<CommentEntity> {
  findByPublicationId(
    publicationId: string,
    offset: number,
    limit: number,
  ): Promise<CommentEntity[]>;
  delete(id: string): Promise<boolean>;
}
