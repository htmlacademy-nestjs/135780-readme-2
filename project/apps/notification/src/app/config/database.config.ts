import { ConfigService } from '@nestjs/config';

export function createMongoConnectionString(config: ConfigService): string {
  const username = encodeURIComponent(config.getOrThrow<string>('MONGO_USER'));
  const password = encodeURIComponent(config.getOrThrow<string>('MONGO_PASSWORD'));
  const host = config.getOrThrow<string>('MONGO_HOST');
  const port = config.getOrThrow<number>('MONGO_PORT');
  const database = config.getOrThrow<string>('MONGO_DB');
  const authSource = config.getOrThrow<string>('MONGO_AUTH_SOURCE');
  return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=${encodeURIComponent(authSource)}`;
}
