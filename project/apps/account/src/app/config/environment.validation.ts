import * as Joi from 'joi';

const DEFAULT_APP_PORT = 3000;
const DEFAULT_MONGO_PORT = 27017;
const DEFAULT_AUTH_SOURCE = 'admin';
const MIN_SECRET_LENGTH = 8;
const MIN_JWT_SECRET_LENGTH = 32;

export const JWT_CONFIGURATION = {
  accessSecret: 'JWT_ACCESS_SECRET',
  accessExpiresIn: 'JWT_ACCESS_EXPIRES_IN',
  refreshSecret: 'JWT_REFRESH_SECRET',
  refreshExpiresIn: 'JWT_REFRESH_EXPIRES_IN',
} as const;

const environmentValidationSchema = Joi.object({
  PORT: Joi.number().port().default(DEFAULT_APP_PORT),
  MONGO_HOST: Joi.string().hostname().required(),
  MONGO_PORT: Joi.number().port().default(DEFAULT_MONGO_PORT),
  MONGO_DB: Joi.string().required(),
  MONGO_USER: Joi.string().required(),
  MONGO_PASSWORD: Joi.string().min(MIN_SECRET_LENGTH).required(),
  MONGO_AUTH_SOURCE: Joi.string().default(DEFAULT_AUTH_SOURCE),
  [JWT_CONFIGURATION.accessSecret]: Joi.string()
    .min(MIN_JWT_SECRET_LENGTH)
    .required(),
  [JWT_CONFIGURATION.accessExpiresIn]: Joi.string().default('15m'),
  [JWT_CONFIGURATION.refreshSecret]: Joi.string()
    .min(MIN_JWT_SECRET_LENGTH)
    .invalid(Joi.ref(JWT_CONFIGURATION.accessSecret))
    .required(),
  [JWT_CONFIGURATION.refreshExpiresIn]: Joi.string().default('7d'),
  RABBITMQ_URL: Joi.string().uri({ scheme: ['amqp', 'amqps'] }).required(),
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
