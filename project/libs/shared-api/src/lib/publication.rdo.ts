import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PublicationStatus,
  PublicationType,
  type Publication,
} from '@project/shared-types';
import { PUBLICATION_LIMITS } from './publication.constants.js';

export class PublicationRdo implements Publication {
  @ApiProperty({ type: String, format: 'uuid' }) public id!: string;
  @ApiProperty({ type: String, format: 'uuid' }) public authorId!: string;
  @ApiProperty({ enum: PublicationType }) public type!: PublicationType;
  @ApiProperty({ enum: PublicationStatus }) public status!: PublicationStatus;
  @ApiProperty({ type: String, format: 'date-time' }) public createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) public publishedAt!: Date;
  @ApiProperty({ type: [String], maxItems: PUBLICATION_LIMITS.tags })
  public tags!: string[];
  @ApiProperty({ type: 'integer', minimum: 0 }) public likeCount!: number;
  @ApiProperty({ type: 'integer', minimum: 0 }) public commentCount!: number;
  @ApiProperty({ type: Boolean }) public isRepost!: boolean;
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  public originalPublicationId?: string;
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  public originalAuthorId?: string;
  @ApiPropertyOptional({
    type: String,
    minLength: PUBLICATION_LIMITS.title.minimum,
    maxLength: PUBLICATION_LIMITS.title.maximum,
  })
  public title?: string;
  @ApiPropertyOptional({ type: String, format: 'uri' })
  public videoUrl?: string;
  @ApiPropertyOptional({
    type: String,
    minLength: PUBLICATION_LIMITS.announcement.minimum,
    maxLength: PUBLICATION_LIMITS.announcement.maximum,
  })
  public announcement?: string;
  @ApiPropertyOptional({ type: String }) public text?: string;
  @ApiPropertyOptional({
    type: String,
    minLength: PUBLICATION_LIMITS.quoteAuthor.minimum,
    maxLength: PUBLICATION_LIMITS.quoteAuthor.maximum,
  })
  public quoteAuthor?: string;
  @ApiPropertyOptional({ type: String, format: 'uuid' })
  public photoId?: string;
  @ApiPropertyOptional({ type: String, format: 'uri' }) public linkUrl?: string;
  @ApiPropertyOptional({
    type: String,
    maxLength: PUBLICATION_LIMITS.description,
  })
  public description?: string;
}
