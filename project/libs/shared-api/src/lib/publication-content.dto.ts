import { ApiPropertyOptional } from '@nestjs/swagger';
import { PublicationStatus, PublicationType } from '@project/shared-types';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDefined,
  IsEnum,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsPublicationText } from './publication-text.validator.js';
import { IsTextWithoutNullCharacters } from './text-without-null.validator.js';
import {
  PUBLICATION_LIMITS,
  TAG_PATTERN,
  YOUTUBE_URL_PATTERN,
} from './publication.constants.js';

interface TypedContent {
  type?: PublicationType;
}

export class PublicationContentDto {
  @ApiPropertyOptional({ enum: PublicationStatus })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsEnum(PublicationStatus)
  public status?: PublicationStatus;

  @ApiPropertyOptional({
    minLength: PUBLICATION_LIMITS.title.minimum,
    maxLength: PUBLICATION_LIMITS.title.maximum,
  })
  @ValidateIf(
    (dto: TypedContent, value) =>
      dto.type === PublicationType.Video ||
      dto.type === PublicationType.Text ||
      value !== undefined,
  )
  @IsDefined()
  @IsString()
  @Length(PUBLICATION_LIMITS.title.minimum, PUBLICATION_LIMITS.title.maximum)
  @IsTextWithoutNullCharacters()
  public title?: string;

  @ApiPropertyOptional({
    description: 'YouTube video URL; required for video publications',
  })
  @ValidateIf(
    (dto: TypedContent, value) =>
      dto.type === PublicationType.Video || value !== undefined,
  )
  @IsDefined()
  @IsUrl()
  @Matches(YOUTUBE_URL_PATTERN)
  @IsTextWithoutNullCharacters()
  public videoUrl?: string;

  @ApiPropertyOptional({
    minLength: PUBLICATION_LIMITS.announcement.minimum,
    maxLength: PUBLICATION_LIMITS.announcement.maximum,
  })
  @ValidateIf(
    (dto: TypedContent, value) =>
      dto.type === PublicationType.Text || value !== undefined,
  )
  @IsDefined()
  @IsString()
  @Length(
    PUBLICATION_LIMITS.announcement.minimum,
    PUBLICATION_LIMITS.announcement.maximum,
  )
  @IsTextWithoutNullCharacters()
  public announcement?: string;

  @ApiPropertyOptional({
    description: '100–1024 characters for a text post, 20–300 for a quote',
  })
  @ValidateIf(
    (dto: TypedContent, value) =>
      dto.type === PublicationType.Text ||
      dto.type === PublicationType.Quote ||
      value !== undefined,
  )
  @IsDefined()
  @IsString()
  @IsPublicationText()
  @IsTextWithoutNullCharacters()
  public text?: string;

  @ApiPropertyOptional({
    minLength: PUBLICATION_LIMITS.quoteAuthor.minimum,
    maxLength: PUBLICATION_LIMITS.quoteAuthor.maximum,
  })
  @ValidateIf(
    (dto: TypedContent, value) =>
      dto.type === PublicationType.Quote || value !== undefined,
  )
  @IsDefined()
  @IsString()
  @Length(
    PUBLICATION_LIMITS.quoteAuthor.minimum,
    PUBLICATION_LIMITS.quoteAuthor.maximum,
  )
  @IsTextWithoutNullCharacters()
  public quoteAuthor?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Required for photo publications',
  })
  @ValidateIf(
    (dto: TypedContent, value) =>
      dto.type === PublicationType.Photo || value !== undefined,
  )
  @IsDefined()
  @IsUUID()
  public photoId?: string;

  @ApiPropertyOptional({ description: 'Required for link publications' })
  @ValidateIf(
    (dto: TypedContent, value) =>
      dto.type === PublicationType.Link || value !== undefined,
  )
  @IsDefined()
  @IsUrl()
  @IsTextWithoutNullCharacters()
  public linkUrl?: string;

  @ApiPropertyOptional({ maxLength: PUBLICATION_LIMITS.description })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsString()
  @MaxLength(PUBLICATION_LIMITS.description)
  @IsTextWithoutNullCharacters()
  public description?: string;

  @ApiPropertyOptional({ type: [String], maxItems: PUBLICATION_LIMITS.tags })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsArray()
  @ArrayMaxSize(PUBLICATION_LIMITS.tags)
  @IsString({ each: true })
  @Matches(TAG_PATTERN, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value) &&
    value.length <= PUBLICATION_LIMITS.tags &&
    value.every((tag) => typeof tag === 'string')
      ? [...new Set(value.map((tag: string) => tag.toLowerCase()))]
      : value,
  )
  public tags?: string[];
}
