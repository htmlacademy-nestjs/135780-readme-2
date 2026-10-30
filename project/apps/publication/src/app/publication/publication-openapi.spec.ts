import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PublicationController } from './publication.controller';
import { PublicationService } from './publication.service';

async function getDocument() {
  @Module({
    controllers: [PublicationController],
    providers: [{ provide: PublicationService, useValue: {} }],
  })
  class DocumentationModule {}
  const app = await NestFactory.create(DocumentationModule, { logger: false });
  try {
    return SwaggerModule.createDocument(app, new DocumentBuilder().build());
  } finally {
    await app.close();
  }
}

test('publication responses document the returned resource fields', async () => {
  const document = await getDocument();
  const response = document.paths['/publications'].get!.responses!['200'] as {
    content?: Record<
      string,
      { schema?: { type?: string; items?: { $ref?: string } } }
    >;
  };
  const schema = response.content?.['application/json']?.schema;
  assert.equal(schema?.type, 'array');
  const reference = schema?.items?.$ref;
  assert.ok(reference);
  const resource = document.components!.schemas![
    reference.split('/').pop()!
  ] as { properties: Record<string, unknown> };
  for (const field of [
    'id',
    'authorId',
    'type',
    'status',
    'publishedAt',
    'likeCount',
    'commentCount',
    'isRepost',
  ]) {
    assert.ok(resource.properties[field], 'Missing publication field ' + field);
  }
});

test('creation documents all five post kinds with their own required content', async () => {
  const document = await getDocument();
  const body = document.paths['/publications'].post!.requestBody as {
    content: Record<
      string,
      {
        schema: {
          oneOf?: {
            required?: string[];
            properties?: Record<string, { enum?: string[] }>;
          }[];
        };
      }
    >;
  };
  const variants = body?.content?.['application/json']?.schema?.oneOf;
  assert.equal(variants?.length, 5);
  const requiredByType = {
    video: ['title', 'videoUrl'],
    text: ['title', 'announcement', 'text'],
    quote: ['text', 'quoteAuthor'],
    photo: ['photoId'],
    link: ['linkUrl'],
  };
  for (const [type, required] of Object.entries(requiredByType)) {
    const variant:
      | {
          required?: string[];
          properties?: Record<string, { enum?: string[] }>;
        }
      | undefined = variants!.find(
      (item) => item.properties?.type.enum?.[0] === type,
    );
    assert.ok(variant, 'Missing ' + type + ' variant');
    assert.deepEqual(variant.required, ['type', ...required]);
  }
});
