import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'notification_subscribers', versionKey: false })
export class SubscriberModel {
  @Prop({ required: true, unique: true })
  public userId!: string;

  @Prop({ required: true, unique: true })
  public email!: string;

  @Prop({ required: true })
  public name!: string;
}

export const SubscriberSchema = SchemaFactory.createForClass(SubscriberModel);
