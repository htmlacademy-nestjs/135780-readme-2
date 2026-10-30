import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import type { Subscription } from '@project/shared-types';
import type { UserModel } from '../user/user.model';
import { SubscriptionModel } from './subscription.model';

const USER_MODEL_NAME = 'UserModel';

@Injectable()
export class SubscriptionRepository {
  public constructor(
    @InjectModel(SubscriptionModel.name)
    private readonly subscriptions: Model<SubscriptionModel>,
    @InjectModel(USER_MODEL_NAME) private readonly users: Model<UserModel>,
  ) {}

  public async authorExists(id: string): Promise<boolean> {
    return Boolean(await this.users.exists({ _id: id }));
  }

  public async subscribe(
    subscriberId: string,
    authorId: string,
  ): Promise<Subscription> {
    const filter = { subscriberId, authorId };
    try {
      const document = await this.subscriptions
        .findOneAndUpdate(
          filter,
          {
            $setOnInsert: {
              _id: randomUUID(),
              ...filter,
              createdAt: new Date(),
            },
          },
          { upsert: true, returnDocument: 'after', runValidators: true },
        )
        .lean()
        .exec();
      return this.toEntity(document!);
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) {
        throw error;
      }
      const document = await this.subscriptions.findOne(filter).lean().exec();
      if (!document) {
        throw error;
      }
      return this.toEntity(document);
    }
  }

  public async unsubscribe(
    subscriberId: string,
    authorId: string,
  ): Promise<void> {
    await this.subscriptions.deleteOne({ subscriberId, authorId }).exec();
  }

  public async findBySubscriberId(
    subscriberId: string,
  ): Promise<Subscription[]> {
    const documents = await this.subscriptions
      .find({ subscriberId })
      .sort({ createdAt: -1, _id: -1 })
      .lean()
      .exec();
    return documents.map((document) => this.toEntity(document));
  }

  public countByAuthor(authorId: string): Promise<number> {
    return this.subscriptions.countDocuments({ authorId }).exec();
  }

  private toEntity(document: SubscriptionModel): Subscription {
    return {
      id: document._id,
      subscriberId: document.subscriberId,
      authorId: document.authorId,
      createdAt: document.createdAt,
    };
  }
}
