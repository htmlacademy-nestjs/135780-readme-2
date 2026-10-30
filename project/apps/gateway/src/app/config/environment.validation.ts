import * as Joi from 'joi';
import {
  APPLICATION_PORTS,
  USER_LIMITS,
  HTTP_SETTINGS,
} from '@project/shared-api';

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = Joi.object({
    PORT: Joi.number().port().default(APPLICATION_PORTS.gateway),
    ACCOUNT_URL: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
    PUBLICATION_URL: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
    FILE_URL: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
    NOTIFICATION_URL: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .required(),
    JWT_ACCESS_SECRET: Joi.string()
      .min(USER_LIMITS.jwtSecretMinimumLength)
      .required(),
    HTTP_TIMEOUT: Joi.number().integer().min(1).default(HTTP_SETTINGS.timeout),
    CORS_ORIGIN: Joi.string()
      .uri({ scheme: ['http', 'https'] })
      .optional(),
  }).validate(config, { abortEarly: false, allowUnknown: true });
  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }
  return value;
}
