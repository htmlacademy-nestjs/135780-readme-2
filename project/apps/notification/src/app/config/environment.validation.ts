import * as Joi from 'joi';

const environmentSchema = Joi.object({
  PORT: Joi.number().port().default(3003),
  RABBITMQ_URL: Joi.string().uri({ scheme: ['amqp', 'amqps'] }).required(),
  RABBITMQ_QUEUE: Joi.string().required(),
  MONGO_HOST: Joi.string().hostname().required(),
  MONGO_PORT: Joi.number().port().default(27018),
  MONGO_DB: Joi.string().required(),
  MONGO_USER: Joi.string().required(),
  MONGO_PASSWORD: Joi.string().min(8).required(),
  MONGO_AUTH_SOURCE: Joi.string().default('admin'),
  SMTP_HOST: Joi.string().hostname().required(),
  SMTP_PORT: Joi.number().port().required(),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_USER: Joi.string().allow('').optional(),
  SMTP_PASSWORD: Joi.string().allow('').optional(),
  SMTP_FROM: Joi.string().email({ tlds: { allow: false } }).required(),
}).and('SMTP_USER', 'SMTP_PASSWORD');

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const { error, value } = environmentSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
  });
  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }
  return value;
}
