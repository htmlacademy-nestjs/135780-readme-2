import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { CreatePublicationDto } from './create-publication.dto.js';
import { PUBLICATION_CONTENT_FIELDS } from './publication.constants.js';

export function ApiCreatePublicationBody() {
  const variants = Object.entries(PUBLICATION_CONTENT_FIELDS).map(
    ([type, fields]) => {
      const properties = Object.fromEntries(
        ['status', 'tags', ...fields].map((field) => [
          field,
          {
            $ref: getSchemaPath(CreatePublicationDto) + '/properties/' + field,
          },
        ]),
      );
      return {
        title: type,
        type: 'object' as const,
        additionalProperties: false,
        properties: {
          ...properties,
          type: { type: 'string' as const, enum: [type] },
        },
        required: [
          'type',
          ...fields.filter((field) => field !== 'description'),
        ],
      };
    },
  );
  return applyDecorators(
    ApiExtraModels(CreatePublicationDto),
    ApiBody({
      schema: { oneOf: variants, discriminator: { propertyName: 'type' } },
    }),
  );
}
