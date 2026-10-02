import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PublicationType } from '@project/shared-types';

@Schema({ collection: 'notification_publications', versionKey: false })
export class NotificationPublicationModel {
  @Prop({ required: true, unique: true })
  public publicationId!: string;

  @Prop({ required: true })
  public authorId!: string;

  @Prop({ type: String, required: true, enum: PublicationType })
  public type!: PublicationType;

  @Prop()
  public title?: string;

  @Prop({ required: true })
  public publishedAt!: Date;

  @Prop()
  public notifiedAt?: Date;
}

export const NotificationPublicationSchema = SchemaFactory.createForClass(
  NotificationPublicationModel,
);
