import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
} from 'class-validator';
import {
  PublicationType,
  type PublicationPublishedEvent,
  type UserRegisteredEvent,
} from '@project/shared-types';
import {
  IsPublicationDate,
  PUBLICATION_LIMITS,
  USER_LIMITS,
} from '@project/shared-api';

export class UserRegisteredMessage implements UserRegisteredEvent {
  @IsUUID() public userId!: string;
  @IsEmail() public email!: string;
  @IsString()
  @Length(USER_LIMITS.name.minimum, USER_LIMITS.name.maximum)
  public name!: string;
}
export class PublicationWithdrawnMessage {
  @IsUUID() public publicationId!: string;
}
export class PublicationPublishedMessage
  extends PublicationWithdrawnMessage
  implements PublicationPublishedEvent
{
  @IsUUID() public authorId!: string;
  @IsEnum(PublicationType) public type!: PublicationType;
  @IsOptional()
  @IsString()
  @MaxLength(PUBLICATION_LIMITS.title.maximum)
  public title?: string;
  @IsPublicationDate() public publishedAt!: string;
}
