import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserEntity } from './user.entity';
import { UserDocument, UserModel } from './user.model';
import { UserRepository } from './user.repository';

@Injectable()
export class UserMongoRepository implements UserRepository {
  public constructor(
    @InjectModel(UserModel.name)
    private readonly userModel: Model<UserModel>,
  ) {}

  public async save(entity: UserEntity): Promise<UserEntity> {
    await this.userModel
      .findByIdAndUpdate(
        entity.id,
        {
          email: entity.email,
          name: entity.name,
          avatarId: entity.avatarId,
          passwordHash: entity.getPasswordHash(),
          publicationCount: entity.publicationCount,
          subscriberCount: entity.subscriberCount,
          createdAt: entity.createdAt,
        },
        {
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      )
      .exec();

    return entity;
  }

  public async findById(id: string): Promise<UserEntity | null> {
    const document = await this.userModel.findById(id).exec();
    return document ? this.toEntity(document) : null;
  }

  public async findByEmail(email: string): Promise<UserEntity | null> {
    const document = await this.userModel.findOne({ email }).exec();
    return document ? this.toEntity(document) : null;
  }

  private toEntity(document: UserDocument): UserEntity {
    return UserEntity.restore({
      id: document._id,
      email: document.email,
      name: document.name,
      avatarId: document.avatarId,
      passwordHash: document.passwordHash,
      publicationCount: document.publicationCount,
      subscriberCount: document.subscriberCount,
      createdAt: document.createdAt,
    });
  }
}
