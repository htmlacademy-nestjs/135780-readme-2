import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { COMMENT_LIMITS } from './comment.constants.js';

export class CreateCommentDto {
  @ApiProperty({
    minLength: COMMENT_LIMITS.minimum,
    maxLength: COMMENT_LIMITS.maximum,
  })
  @IsString()
  @Length(COMMENT_LIMITS.minimum, COMMENT_LIMITS.maximum)
  public text!: string;
}
