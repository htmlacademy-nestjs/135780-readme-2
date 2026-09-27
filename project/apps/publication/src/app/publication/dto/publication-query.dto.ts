import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  PublicationSort,
  PublicationType,
} from '@project/shared-types';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { QUERY_LIMITS } from '../../common/query.constants';

const TAG_PATTERN = /^[a-zа-яё][a-zа-яё0-9-]{2,9}$/i;

export class PublicationQueryDto {
  @ApiPropertyOptional({ enum: PublicationType })
  @IsOptional()
  @IsEnum(PublicationType)
  public type?: PublicationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  public authorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(TAG_PATTERN)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  public tag?: string;

  @ApiPropertyOptional({ enum: PublicationSort })
  @IsOptional()
  @IsEnum(PublicationSort)
  public sort?: PublicationSort;

  @ApiPropertyOptional({ minimum: 1, default: QUERY_LIMITS.defaultPage })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: QUERY_LIMITS.publicationsPerPage,
    default: QUERY_LIMITS.publicationsPerPage,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(QUERY_LIMITS.publicationsPerPage)
  public limit?: number;
}
