import { ApiProperty } from '@nestjs/swagger';
import { PublicationType } from '@project/shared-types';
import { IsEnum, ValidateBy, type ValidationArguments } from 'class-validator';
import { PublicationContentDto } from './publication-content.dto.js';
import { PUBLICATION_CONTENT_FIELDS } from './publication.constants.js';

export class CreatePublicationDto extends PublicationContentDto {
  @ApiProperty({ enum: PublicationType })
  @IsEnum(PublicationType)
  @ValidateBy({
    name: 'publicationContent',
    validator: {
      validate(value: unknown, args: ValidationArguments): boolean {
        if (
          typeof value !== 'string' ||
          !Object.hasOwn(PUBLICATION_CONTENT_FIELDS, value)
        ) {
          return true;
        }
        const allowedFields: readonly string[] =
          PUBLICATION_CONTENT_FIELDS[value as PublicationType];
        const content = args.object as unknown as Record<string, unknown>;
        return Object.values(PUBLICATION_CONTENT_FIELDS)
          .flat()
          .every(
            (field) =>
              content[field] === undefined || allowedFields.includes(field),
          );
      },
      defaultMessage: () => 'Content fields must match the publication type',
    },
  })
  public type!: PublicationType;
}
