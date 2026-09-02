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
  IsUrl,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const TAG_PATTERN = /^[a-zа-яё][a-zа-яё0-9-]{2,9}$/i;

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
  public videoUrl?: string;

  @ApiPropertyOptional({ minLength: 50, maxLength: 255 })
  @ValidateIf((dto: CreatePublicationDto) =>
    dto.type === PublicationType.Text,
  )
  @IsDefined()
  @IsString()
  @Length(50, 255)
  public announcement?: string;

  @ApiPropertyOptional({ minLength: 20, maxLength: 1024 })
  @ValidateIf((dto: CreatePublicationDto) =>
    [PublicationType.Text, PublicationType.Quote].includes(dto.type),
  )
  @IsDefined()
  @IsString()
  @Length(20, 1024)
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
  @IsString()
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
