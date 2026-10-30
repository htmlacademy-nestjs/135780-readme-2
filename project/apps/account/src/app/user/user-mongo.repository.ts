import { ConflictException, Injectable } from '@nestjs/common';
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
    try {
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
            $setOnInsert: { notificationPending: true },
          },
          {
            upsert: true,
            runValidators: true,
            setDefaultsOnInsert: true,
          },
        )
        .exec();
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }

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

  public async findPendingNotifications(limit: number) {
    const documents = await this.userModel
      .find({ notificationPending: { $ne: false } })
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit)
      .lean()
      .exec();
    return documents.map((user) => ({
      userId: user._id,
      email: user.email,
      name: user.name,
    }));
  }

  public async markNotificationPublished(id: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: id }, { $set: { notificationPending: false } })
      .exec();
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
