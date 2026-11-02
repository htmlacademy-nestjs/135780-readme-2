import { NotContains, type ValidationOptions } from 'class-validator';

const NULL_CHARACTER = '\u0000';

export function IsTextWithoutNullCharacters(
  options?: ValidationOptions,
): PropertyDecorator {
  return NotContains(NULL_CHARACTER, {
    message: '$property must not contain null characters',
    ...options,
  });
}
