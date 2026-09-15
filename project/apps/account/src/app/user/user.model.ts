import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({
  collection: 'users',
  id: false,
  versionKey: false,
})
export class UserModel {
  @Prop({ type: String, required: true })
  public _id!: string;

  @Prop({ required: true, lowercase: true, trim: true })
  public email!: string;

  @Prop({ required: true, trim: true })
  public name!: string;

  @Prop()
  public avatarId?: string;

  @Prop({ required: true })
  public passwordHash!: string;

  @Prop({ required: true, min: 0, default: 0 })
  public publicationCount!: number;

  @Prop({ required: true, min: 0, default: 0 })
  public subscriberCount!: number;

  @Prop({ required: true })
  public createdAt!: Date;
}

export type UserDocument = HydratedDocument<UserModel>;
export const UserSchema = SchemaFactory.createForClass(UserModel);

UserSchema.index({ email: 1 }, { unique: true });
