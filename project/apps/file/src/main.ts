import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

const GLOBAL_PREFIX = 'api';
const DEFAULT_PORT = 3000;
const SWAGGER_PATH = 'swagger';
const API_TITLE = 'Readme File Service';
const API_DESCRIPTION = 'Avatar and publication image uploads';
const API_VERSION = '1.0';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(API_TITLE)
    .setDescription(API_DESCRIPTION)
    .setVersion(API_VERSION)
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(SWAGGER_PATH, app, swaggerDocument);

  const port = process.env.PORT || DEFAULT_PORT;
  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${GLOBAL_PREFIX}`);
  Logger.log(`OpenAPI: http://localhost:${port}/${SWAGGER_PATH}`);
}

bootstrap();
