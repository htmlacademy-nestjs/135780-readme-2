import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PUBLICATION_LIMITS } from './publication.constants.js';
import { IsTextWithoutNullCharacters } from './text-without-null.validator.js';

export class SearchPublicationQueryDto {
  @ApiProperty({
    description: 'A full title or a title fragment',
    maxLength: PUBLICATION_LIMITS.title.maximum,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsTextWithoutNullCharacters()
  @IsNotEmpty()
  @MaxLength(PUBLICATION_LIMITS.title.maximum)
  public title!: string;
}
