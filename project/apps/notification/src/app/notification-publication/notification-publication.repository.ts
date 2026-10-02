import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type PublicationPublishedEvent } from '@project/shared-types';
import { Model } from 'mongoose';
import { NotificationPublicationModel } from './notification-publication.model';

@Injectable()
export class NotificationPublicationRepository {
  public constructor(
    @InjectModel(NotificationPublicationModel.name)
    private readonly model: Model<NotificationPublicationModel>,
  ) {}

  public async save(event: PublicationPublishedEvent): Promise<void> {
    await this.model.updateOne(
      { publicationId: event.publicationId },
      {
        $setOnInsert: {
          ...event,
          publishedAt: new Date(event.publishedAt),
        },
      },
      { upsert: true },
    ).exec();
  }

  public async findPending(): Promise<NotificationPublicationModel[]> {
    return this.model
      .find({ notifiedAt: { $exists: false } })
      .sort({ publishedAt: 1 })
      .lean()
      .exec();
  }

  public async markNotified(publicationIds: string[]): Promise<void> {
    await this.model.updateMany(
      {
        publicationId: { $in: publicationIds },
        notifiedAt: { $exists: false },
      },
      { $set: { notifiedAt: new Date() } },
    ).exec();
  }
}
