import {
  PublicationSort,
  PublicationType,
  Repository,
  PublicationNotificationEvent,
} from '@project/shared-types';
import { PublicationEntity } from './publication.entity';

export const PUBLICATION_REPOSITORY = Symbol('PUBLICATION_REPOSITORY');

export interface PublicationFilter {
  type?: PublicationType;
  authorId?: string;
  authorIds?: string[];
  tag?: string;
  sort: PublicationSort;
  page: number;
  limit: number;
}

export interface PublicationRepository extends Repository<PublicationEntity> {
  save(
    entity: PublicationEntity,
    event?: PublicationNotificationEvent,
  ): Promise<PublicationEntity>;
  update(
    entity: PublicationEntity,
    event?: PublicationNotificationEvent,
  ): Promise<PublicationEntity>;
  countPublishedByAuthor(authorId: string): Promise<number>;
  findPublished(filter: PublicationFilter): Promise<PublicationEntity[]>;
  findDrafts(authorId: string): Promise<PublicationEntity[]>;
  search(title: string, limit: number): Promise<PublicationEntity[]>;
  findRepost(
    authorId: string,
    originalPublicationId: string,
  ): Promise<PublicationEntity | null>;
  delete(id: string, event?: PublicationNotificationEvent): Promise<boolean>;
}
