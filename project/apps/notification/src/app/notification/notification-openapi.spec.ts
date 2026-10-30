import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

test('notification HTTP API documents both delivery counters', async () => {
  @Module({
    controllers: [NotificationController],
    providers: [{ provide: NotificationService, useValue: {} }],
  })
  class DocumentationModule {}
  const app = await NestFactory.create(DocumentationModule, { logger: false });
  try {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().build(),
    );
    const response = document.paths['/notifications/send'].post!.responses![
      '200'
    ] as {
      content?: Record<string, { schema?: { $ref?: string } }>;
    };
    const reference = response.content?.['application/json']?.schema?.$ref;
    assert.ok(reference, 'Delivery response has no schema');
    const schema = document.components!.schemas![
      reference.split('/').pop()!
    ] as { properties: Record<string, unknown> };
    assert.ok(schema.properties.recipientCount);
    assert.ok(schema.properties.publicationCount);
  } finally {
    await app.close();
  }
});
