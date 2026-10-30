import * as Joi from 'joi';
import { APPLICATION_PORTS } from '@project/shared-api';

const environmentValidationSchema = Joi.object({
  PORT: Joi.number().port().default(APPLICATION_PORTS.publication),
  DATABASE_URL: Joi.string().required(),
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
