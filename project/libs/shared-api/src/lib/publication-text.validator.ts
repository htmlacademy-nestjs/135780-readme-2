import { PublicationType } from '@project/shared-types';
import {
  length,
  ValidateBy,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';
import { PUBLICATION_LIMITS } from './publication.constants.js';

function getLimits(type?: PublicationType): {
  minimum: number;
  maximum: number;
} {
  if (type === PublicationType.Text) {
    return PUBLICATION_LIMITS.text;
  }
  if (type === PublicationType.Quote) {
    return PUBLICATION_LIMITS.quote;
  }
  return {
    minimum: PUBLICATION_LIMITS.quote.minimum,
    maximum: PUBLICATION_LIMITS.text.maximum,
  };
}

export function IsPublicationText(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isPublicationText',
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const limits = getLimits(
            (args.object as { type?: PublicationType }).type,
          );
          return length(value, limits.minimum, limits.maximum);
        },
        defaultMessage(args: ValidationArguments): string {
          const limits = getLimits(
            (args.object as { type?: PublicationType }).type,
          );
          return `text must be between ${limits.minimum} and ${limits.maximum} characters`;
        },
      },
    },
    validationOptions,
  );
}
