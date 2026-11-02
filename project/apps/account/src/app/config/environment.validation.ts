import * as Joi from 'joi';
import {
  APPLICATION_PORTS,
  CONNECTION_LIMITS,
  USER_LIMITS,
  AUTH_SETTINGS,
  MONGO_DEFAULTS,
} from '@project/shared-api';

export const JWT_CONFIGURATION = {
  accessSecret: 'JWT_ACCESS_SECRET',
  accessExpiresIn: 'JWT_ACCESS_EXPIRES_IN',
  refreshSecret: 'JWT_REFRESH_SECRET',
  refreshExpiresIn: 'JWT_REFRESH_EXPIRES_IN',
} as const;

const environmentValidationSchema = Joi.object({
  PORT: Joi.number().port().default(APPLICATION_PORTS.account),
  MONGO_HOST: Joi.string().hostname().required(),
  MONGO_PORT: Joi.number().port().default(MONGO_DEFAULTS.accountPort),
  MONGO_DB: Joi.string().required(),
  MONGO_USER: Joi.string().required(),
  MONGO_PASSWORD: Joi.string()
    .min(CONNECTION_LIMITS.passwordMinimumLength)
    .required(),
  MONGO_AUTH_SOURCE: Joi.string().default(MONGO_DEFAULTS.authSource),
  [JWT_CONFIGURATION.accessSecret]: Joi.string()
    .min(USER_LIMITS.jwtSecretMinimumLength)
    .required(),
  [JWT_CONFIGURATION.accessExpiresIn]: Joi.string().default(
    AUTH_SETTINGS.accessExpiresIn,
  ),
  [JWT_CONFIGURATION.refreshSecret]: Joi.string()
    .min(USER_LIMITS.jwtSecretMinimumLength)
    .invalid(Joi.ref(JWT_CONFIGURATION.accessSecret))
    .required(),
  [JWT_CONFIGURATION.refreshExpiresIn]: Joi.string().default(
    AUTH_SETTINGS.refreshExpiresIn,
  ),
  RABBITMQ_URL: Joi.string()
    .uri({ scheme: ['amqp', 'amqps'] })
    .required(),
  RABBITMQ_QUEUE: Joi.string().required(),
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
