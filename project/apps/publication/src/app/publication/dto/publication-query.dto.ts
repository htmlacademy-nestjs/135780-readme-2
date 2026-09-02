import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  PublicationSort,
  PublicationType,
} from '@project/shared-types';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PublicationQueryDto {
  @ApiPropertyOptional({ enum: PublicationType })
  @IsOptional()
  @IsEnum(PublicationType)
  public type?: PublicationType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public authorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  public tag?: string;

  @ApiPropertyOptional({ enum: PublicationSort })
  @IsOptional()
  @IsEnum(PublicationSort)
  public sort?: PublicationSort;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 25, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(25)
  public limit?: number;
}
