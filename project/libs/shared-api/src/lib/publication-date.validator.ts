import { ValidateBy, isISO8601, type ValidationOptions } from 'class-validator';

export function IsPublicationDate(
  options?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isPublicationDate',
      validator: {
        validate: (value: unknown) =>
          typeof value === 'string' &&
          isISO8601(value, { strict: true }) &&
          Number.isFinite(new Date(value).getTime()),
        defaultMessage: () => 'date must be a supported ISO 8601 date',
      },
    },
    options,
  );
}
