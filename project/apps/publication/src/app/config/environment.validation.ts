import * as Joi from 'joi';

const DEFAULT_APP_PORT = 3001;

const environmentValidationSchema = Joi.object({
  PORT: Joi.number().port().default(DEFAULT_APP_PORT),
  DATABASE_URL: Joi.string().required(),
});

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = environmentValidationSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }

  return value;
}
