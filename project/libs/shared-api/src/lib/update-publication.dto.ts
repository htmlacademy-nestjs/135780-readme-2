import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { PublicationContentDto } from './publication-content.dto.js';
import { IsPublicationDate } from './publication-date.validator.js';

export class UpdatePublicationDto extends PublicationContentDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @ValidateIf((_dto, value) => value !== undefined)
  @IsPublicationDate()
  public publishedAt?: string;
}
