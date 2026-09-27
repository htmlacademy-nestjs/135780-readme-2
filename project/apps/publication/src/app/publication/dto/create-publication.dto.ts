import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PublicationStatus,
  PublicationType,
} from '@project/shared-types';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsDefined,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsPublicationText } from './publication-text.validator';

const TAG_PATTERN = /^[a-zа-яё][a-zа-яё0-9-]{2,9}$/i;
const YOUTUBE_URL_PATTERN =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?(?:[^#\s]*&)?v=[\w-]+|youtu\.be\/[\w-]+)(?:[?&#][^\s]*)?$/i;

export class CreatePublicationDto {
  @ApiProperty({ enum: PublicationType })
  @IsEnum(PublicationType)
  public type!: PublicationType;

  @ApiPropertyOptional({ enum: PublicationStatus })
  @IsOptional()
  @IsEnum(PublicationStatus)
  public status?: PublicationStatus;

  @ApiPropertyOptional({ minLength: 20, maxLength: 50 })
  @ValidateIf((dto: CreatePublicationDto) =>
    [PublicationType.Video, PublicationType.Text].includes(dto.type),
  )
  @IsDefined()
  @IsString()
  @Length(20, 50)
  public title?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreatePublicationDto) =>
    dto.type === PublicationType.Video,
  )
  @IsDefined()
  @IsUrl()
  @Matches(YOUTUBE_URL_PATTERN)
  public videoUrl?: string;

  @ApiPropertyOptional({ minLength: 50, maxLength: 255 })
  @ValidateIf((dto: CreatePublicationDto) =>
    dto.type === PublicationType.Text,
  )
  @IsDefined()
  @IsString()
  @Length(50, 255)
  public announcement?: string;

  @ApiPropertyOptional({
    description: '100–1024 characters for text, 20–300 for a quote',
  })
  @ValidateIf((dto: CreatePublicationDto) =>
    [PublicationType.Text, PublicationType.Quote].includes(dto.type),
  )
  @IsDefined()
  @IsString()
  @IsPublicationText()
  public text?: string;

  @ApiPropertyOptional({ minLength: 3, maxLength: 50 })
  @ValidateIf((dto: CreatePublicationDto) =>
    dto.type === PublicationType.Quote,
  )
  @IsDefined()
  @IsString()
  @Length(3, 50)
  public quoteAuthor?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreatePublicationDto) =>
    dto.type === PublicationType.Photo,
  )
  @IsDefined()
  @IsUUID()
  public photoId?: string;

  @ApiPropertyOptional()
  @ValidateIf((dto: CreatePublicationDto) =>
    dto.type === PublicationType.Link,
  )
  @IsDefined()
  @IsUrl()
  public linkUrl?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  public description?: string;

  @ApiPropertyOptional({ type: [String], maxItems: 8 })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @Matches(TAG_PATTERN, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? [...new Set(value.map((tag: string) => tag.toLowerCase()))]
      : value,
  )
  public tags?: string[];

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  public publishedAt?: string;
}
