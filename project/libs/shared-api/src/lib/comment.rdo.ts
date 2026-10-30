import { ApiProperty } from '@nestjs/swagger';
import type { Comment } from '@project/shared-types';
import { COMMENT_LIMITS } from './comment.constants.js';

export class CommentRdo implements Comment {
  @ApiProperty({ type: String, format: 'uuid' }) public id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) public publicationId!: string;
  @ApiProperty({ type: String, format: 'uuid' }) public authorId!: string;
  @ApiProperty({
    type: String,
    minLength: COMMENT_LIMITS.minimum,
    maxLength: COMMENT_LIMITS.maximum,
  })
  public text!: string;
  @ApiProperty({ type: String, format: 'date-time' }) public createdAt!: Date;
}
