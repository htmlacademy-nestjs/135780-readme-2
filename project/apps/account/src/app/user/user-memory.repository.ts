import { Injectable } from '@nestjs/common';
import { UserEntity } from './user.entity';
import { UserRepository } from './user.repository';

@Injectable()
export class UserMemoryRepository implements UserRepository {
  private readonly users = new Map<string, UserEntity>();

  public async save(entity: UserEntity): Promise<UserEntity> {
    this.users.set(entity.id, entity);
    return entity;
  }

  public async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }
}
