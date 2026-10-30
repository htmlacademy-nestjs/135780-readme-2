import * as Joi from 'joi';
import { APPLICATION_PORTS } from '@project/shared-api';

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = Joi.object({
    PORT: Joi.number().port().default(APPLICATION_PORTS.file),
    UPLOAD_DIRECTORY: Joi.string().default('apps/file/uploads'),
  }).validate(config, { abortEarly: false, allowUnknown: true });
  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }
  return value;
}
