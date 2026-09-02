import { Repository } from '@project/shared-types';
import { PublicationEntity } from './publication.entity';

export const PUBLICATION_REPOSITORY = Symbol('PUBLICATION_REPOSITORY');

export interface PublicationRepository extends Repository<PublicationEntity> {
  find(): Promise<PublicationEntity[]>;
  delete(id: string): Promise<boolean>;
}
