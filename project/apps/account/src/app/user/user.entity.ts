import { User } from '@project/shared-types';
import { compare, hash } from 'bcrypt';
import { randomUUID } from 'node:crypto';

const PASSWORD_SALT_ROUNDS = 10;

export interface CreateUserData {
  email: string;
  name: string;
  avatarId?: string;
}

export interface StoredUserData extends CreateUserData {
  id: string;
  createdAt: Date;
  publicationCount: number;
  subscriberCount: number;
  passwordHash: string;
}

export class UserEntity implements User {
  public readonly id: string;
  public readonly email: string;
  public readonly name: string;
  public readonly avatarId?: string;
  public readonly createdAt: Date;
  public readonly publicationCount: number;
  public readonly subscriberCount: number;
  private passwordHash: string;

  private constructor(data: StoredUserData) {
    this.id = data.id;
    this.email = data.email;
    this.name = data.name;
    this.avatarId = data.avatarId;
    this.createdAt = data.createdAt;
    this.publicationCount = data.publicationCount;
    this.subscriberCount = data.subscriberCount;
    this.passwordHash = data.passwordHash;
  }

  public static async create(data: CreateUserData, password: string): Promise<UserEntity> {
    const entity = new UserEntity({
      ...data,
      id: randomUUID(),
      createdAt: new Date(),
      publicationCount: 0,
      subscriberCount: 0,
      passwordHash: '',
    });
    await entity.setPassword(password);
    return entity;
  }

  public static restore(data: StoredUserData): UserEntity {
    return new UserEntity(data);
  }

  public getPasswordHash(): string {
    return this.passwordHash;
  }

  public async setPassword(password: string): Promise<void> {
    this.passwordHash = await hash(password, PASSWORD_SALT_ROUNDS);
  }

  public async comparePassword(password: string): Promise<boolean> {
    return compare(password, this.passwordHash);
  }
}
