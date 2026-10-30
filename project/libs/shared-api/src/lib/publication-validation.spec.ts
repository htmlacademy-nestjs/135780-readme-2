import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePublicationDto } from './create-publication.dto.js';
import { UpdatePublicationDto } from './update-publication.dto.js';
import { PublicationQueryDto } from './publication-query.dto.js';
import { CommentQueryDto } from './comment-query.dto.js';
import { CreateUserDto } from './create-user.dto.js';

test('all five publication formats accept their valid content', async () => {
  for (const data of [
    {
      type: 'video',
      title: 'A video publication title',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    },
    {
      type: 'text',
      title: 'A text publication title',
      announcement: 'a'.repeat(50),
      text: 't'.repeat(100),
    },
    {
      type: 'quote',
      text: 'A quote long enough to publish',
      quoteAuthor: 'Author',
    },
    { type: 'photo', photoId: '11111111-1111-4111-8111-111111111111' },
    { type: 'link', linkUrl: 'https://example.com' },
  ]) {
    assert.equal(
      (await validate(plainToInstance(CreatePublicationDto, data))).length,
      0,
      data.type,
    );
  }
});

test('non-string tags return validation errors without throwing', async () => {
  for (const tags of [['valid', 42], [null], [true], [undefined]]) {
    const dto = plainToInstance(CreatePublicationDto, {
      type: 'link',
      linkUrl: 'https://example.com',
      tags,
    });
    assert.ok((await validate(dto)).length > 0);
  }
});

test('more than eight supplied tags are rejected even if they are duplicates', async () => {
  const dto = plainToInstance(CreatePublicationDto, {
    type: 'link',
    linkUrl: 'https://example.com',
    tags: Array(9).fill('same'),
  });
  assert.ok((await validate(dto)).length > 0);
});

test('partial updates validate fields without relying on a supplied publication type', async () => {
  for (const body of [
    { title: 'short' },
    { title: null },
    { tags: null },
    { videoUrl: 'bad' },
    { publishedAt: null },
  ]) {
    const dto = plainToInstance(UpdatePublicationDto, body);
    assert.ok((await validate(dto)).length > 0, JSON.stringify(body));
  }
});

test('content from another publication format is rejected', async () => {
  const dto = plainToInstance(CreatePublicationDto, {
    type: 'link',
    linkUrl: 'https://example.com',
    title: 'An irrelevant article title',
  });
  assert.ok((await validate(dto)).length > 0);
});

test('impossible dates and overflowing page offsets produce validation errors', async () => {
  assert.ok(
    (
      await validate(
        plainToInstance(UpdatePublicationDto, {
          publishedAt: '2026-02-31T00:00:00.000Z',
        }),
      )
    ).length > 0,
  );
  for (const type of [PublicationQueryDto, CommentQueryDto]) {
    assert.ok(
      (await validate(plainToInstance(type, { page: '1000000000000' })))
        .length > 0,
    );
  }
});

test('a whitespace-only user name is rejected before reaching mongoose', async () => {
  const dto = plainToInstance(CreateUserDto, {
    name: '   ',
    email: 'reader@example.com',
    password: 'secret12',
  });
  assert.ok((await validate(dto)).length > 0);
});

test('invalid type values cannot access inherited object properties or throw during validation', async () => {
  for (const type of [
    '__proto__',
    'constructor',
    'toString',
    { toString: null, valueOf: null },
  ]) {
    const dto = plainToInstance(CreatePublicationDto, {
      type,
      linkUrl: 'https://example.com',
    });
    assert.ok((await validate(dto)).length > 0);
  }
});

test('publication dates accepted by validation can be converted to valid Date values', async () => {
  for (const publishedAt of ['20261030', '2026-W44-5', '2026-303']) {
    const errors = await validate(
      plainToInstance(UpdatePublicationDto, { publishedAt }),
    );
    assert.ok(
      errors.length > 0,
      `Unsupported date ${publishedAt} was accepted`,
    );
  }
});
