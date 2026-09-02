import { Repository } from '@project/shared-types';
import { FileEntity } from './file.entity';

export const FILE_REPOSITORY = Symbol('FILE_REPOSITORY');

export type FileRepository = Repository<FileEntity>;
