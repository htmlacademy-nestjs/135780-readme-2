import { Repository } from '@project/shared-types';
import { UserEntity } from './user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository extends Repository<UserEntity> {
  findByEmail(email: string): Promise<UserEntity | null>;
}
