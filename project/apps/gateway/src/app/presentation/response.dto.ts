import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CommentRdo,
  LikeRdo,
  NotificationResultRdo,
  PublicationRdo,
  StoredFileRdo,
  SubscriptionRdo,
  UserDetailRdo,
} from '@project/shared-api';

export class FileResponseDto extends StoredFileRdo {}

export class UserResponseDto extends UserDetailRdo {
  @ApiPropertyOptional({ type: FileResponseDto })
  public avatar?: FileResponseDto;
}

export class PublicationResponseDto extends PublicationRdo {
  @ApiProperty({ type: UserResponseDto }) public author!: UserResponseDto;
  @ApiPropertyOptional({ type: FileResponseDto })
  public photo?: FileResponseDto;
  @ApiPropertyOptional({ type: UserResponseDto })
  public originalAuthor?: UserResponseDto;
}

export class CommentResponseDto extends CommentRdo {
  @ApiProperty({ type: UserResponseDto }) public author!: UserResponseDto;
}

export class LikeResponseDto extends LikeRdo {}
export class NotificationResponseDto extends NotificationResultRdo {}

export class SubscriptionResponseDto extends SubscriptionRdo {
  @ApiProperty({ type: UserResponseDto }) public author!: UserResponseDto;
}
