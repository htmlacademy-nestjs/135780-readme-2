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
import { CreateCommentDto } from './create-comment.dto.js';
import { SearchPublicationQueryDto } from './search-publication-query.dto.js';

const UNICODE_SYMBOL = String.fromCodePoint(0x1f600);

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
      text: 'Line\n'.repeat(20),
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

test('quote length limits count Unicode code points', async () => {
  for (const { count, accepted } of [
    { count: 10, accepted: false },
    { count: 19, accepted: false },
    { count: 20, accepted: true },
    { count: 151, accepted: true },
    { count: 300, accepted: true },
    { count: 301, accepted: false },
  ]) {
    const errors = await validate(
      plainToInstance(CreatePublicationDto, {
        type: 'quote',
        text: UNICODE_SYMBOL.repeat(count),
        quoteAuthor: 'Author',
      }),
    );
    assert.equal(
      errors.length === 0,
      accepted,
      'Quote with ' + count + ' Unicode characters',
    );
  }
});

test('text length limits count Unicode code points', async () => {
  for (const { count, accepted } of [
    { count: 99, accepted: false },
    { count: 100, accepted: true },
    { count: 600, accepted: true },
    { count: 1024, accepted: true },
    { count: 1025, accepted: false },
  ]) {
    const errors = await validate(
      plainToInstance(CreatePublicationDto, {
        type: 'text',
        title: 'A publication title long enough',
        announcement: 'a'.repeat(50),
        text: UNICODE_SYMBOL.repeat(count),
      }),
    );
    assert.equal(
      errors.length === 0,
      accepted,
      'Text with ' + count + ' Unicode characters',
    );
  }
});

test('search rejects null characters before reaching PostgreSQL', async () => {
  for (const title of ['\u0000', 'readme\u0000publication', 'readme\u0000']) {
    const errors = await validate(
      plainToInstance(SearchPublicationQueryDto, { title }),
    );
    assert.ok(errors.some((error) => error.property === 'title'));
  }
});

test('publication creation and updates reject null characters in stored text fields', async () => {
  const cases: { field: string; data: Record<string, unknown> }[] = [
    {
      field: 'linkUrl',
      data: {
        type: 'link',
        linkUrl: 'https://example.com/a\u0000b',
      },
    },
    {
      field: 'videoUrl',
      data: {
        type: 'video',
        title: 'A video publication title',
        videoUrl: 'https://youtu.be/dQw4w9WgXcQ?x=\u0000',
      },
    },
    {
      field: 'title',
      data: {
        type: 'video',
        title: 'A video publication title\u0000',
        videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      },
    },
    {
      field: 'announcement',
      data: {
        type: 'text',
        title: 'A text publication title',
        announcement: 'a'.repeat(50) + '\u0000',
        text: 't'.repeat(100),
      },
    },
    {
      field: 'text',
      data: {
        type: 'text',
        title: 'A text publication title',
        announcement: 'a'.repeat(50),
        text: 't'.repeat(100) + '\u0000',
      },
    },
    {
      field: 'quoteAuthor',
      data: {
        type: 'quote',
        text: 'A quotation which is sufficiently long',
        quoteAuthor: 'A\u0000uthor',
      },
    },
    {
      field: 'description',
      data: {
        type: 'link',
        linkUrl: 'https://example.com',
        description: 'Link\u0000description',
      },
    },
  ];
  for (const { field, data } of cases) {
    const creationErrors = await validate(
      plainToInstance(CreatePublicationDto, data),
    );
    assert.ok(
      creationErrors.some((error) => error.property === field),
      'Creation accepted ' + field,
    );
    const updateErrors = await validate(
      plainToInstance(UpdatePublicationDto, { [field]: data[field] }),
    );
    assert.ok(
      updateErrors.some((error) => error.property === field),
      'Update accepted ' + field,
    );
  }
});

test('comments reject null characters before reaching PostgreSQL', async () => {
  const errors = await validate(
    plainToInstance(CreateCommentDto, { text: 'Useful\u0000comment' }),
  );
  assert.ok(errors.some((error) => error.property === 'text'));
});
