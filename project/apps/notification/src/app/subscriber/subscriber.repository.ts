import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type UserRegisteredEvent } from '@project/shared-types';
import { Model } from 'mongoose';
import { SubscriberModel } from './subscriber.model';

@Injectable()
export class SubscriberRepository {
  public constructor(
    @InjectModel(SubscriberModel.name)
    private readonly model: Model<SubscriberModel>,
  ) {}

  public async save(event: UserRegisteredEvent): Promise<void> {
    await this.model.updateOne(
      { userId: event.userId },
      { $setOnInsert: event },
      { upsert: true },
    ).exec();
  }

  public async findAll(): Promise<SubscriberModel[]> {
    return this.model.find().lean().exec();
  }
}
