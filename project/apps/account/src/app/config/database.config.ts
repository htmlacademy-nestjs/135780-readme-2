import { ConfigService } from '@nestjs/config';

export function createMongoConnectionString(
  configService: ConfigService,
): string {
  const user = encodeURIComponent(
    configService.getOrThrow<string>('MONGO_USER'),
  );
  const password = encodeURIComponent(
    configService.getOrThrow<string>('MONGO_PASSWORD'),
  );
  const host = configService.getOrThrow<string>('MONGO_HOST');
  const port = configService.getOrThrow<number>('MONGO_PORT');
  const database = encodeURIComponent(
    configService.getOrThrow<string>('MONGO_DB'),
  );
  const authSource = encodeURIComponent(
    configService.getOrThrow<string>('MONGO_AUTH_SOURCE'),
  );

  return `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=${authSource}`;
}
