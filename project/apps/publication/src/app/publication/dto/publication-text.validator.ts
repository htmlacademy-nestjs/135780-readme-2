import { PublicationType } from '@project/shared-types';
import {
  ValidateBy,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

const TEXT_LENGTH = {
  [PublicationType.Text]: { minimum: 100, maximum: 1024 },
  [PublicationType.Quote]: { minimum: 20, maximum: 300 },
} as const;

interface PublicationTextContainer {
  type: PublicationType;
}

export function IsPublicationText(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isPublicationText',
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (typeof value !== 'string') {
            return false;
          }

          const { type } = args.object as PublicationTextContainer;
          const limits =
            type === PublicationType.Text || type === PublicationType.Quote
              ? TEXT_LENGTH[type]
              : undefined;

          return Boolean(
            limits &&
              value.length >= limits.minimum &&
              value.length <= limits.maximum,
          );
        },
        defaultMessage(args: ValidationArguments): string {
          const { type } = args.object as PublicationTextContainer;
          const limits =
            type === PublicationType.Text || type === PublicationType.Quote
              ? TEXT_LENGTH[type]
              : undefined;

          return limits
            ? `text must be between ${limits.minimum} and ${limits.maximum} characters`
            : 'text is not allowed for this publication type';
        },
      },
    },
    validationOptions,
  );
}
