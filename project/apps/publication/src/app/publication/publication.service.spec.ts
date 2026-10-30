import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PublicationStatus, PublicationType } from '@project/shared-types';
import { PublicationService } from './publication.service';
import { PublicationNotificationPublisher } from '../notification/notification.publisher';
import type { PublicationRepository } from './publication.repository';
import { PublicationEntity } from './publication.entity';
import { BadRequestException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import type { PublicationFilter } from './publication.repository';

test('creating a published post emits an event after persistence', async () => {
  const calls: string[] = [];
  const repository = {
    save: async (publication: unknown) => {
      calls.push('save');
      return publication;
    },
  } as PublicationRepository;
  const publisher = {
    flush: async () => {
      calls.push('publish');
    },
  };
  const service = new PublicationService(
    repository,
    publisher as unknown as PublicationNotificationPublisher,
  );

  await service.create(
    { type: PublicationType.Link, linkUrl: 'https://example.com' },
    '11111111-1111-4111-8111-111111111111',
  );

  assert.deepEqual(calls, ['save', 'publish']);
});

test('creating a draft does not emit an event', async () => {
  const calls: string[] = [];
  const repository = {
    save: async (publication: unknown) => {
      calls.push('save');
      return publication;
    },
  } as PublicationRepository;
  const publisher = {
    flush: async () => {
      calls.push('publish');
    },
  };
  const service = new PublicationService(
    repository,
    publisher as unknown as PublicationNotificationPublisher,
  );

  await service.create(
    {
      type: PublicationType.Link,
      status: PublicationStatus.Draft,
      linkUrl: 'https://example.com',
    },
    '11111111-1111-4111-8111-111111111111',
  );

  assert.deepEqual(calls, ['save']);
});

test('updates validate merged content before persisting a publication', async () => {
  const authorId = '11111111-1111-4111-8111-111111111111';
  const entity = new PublicationEntity(
    {
      type: PublicationType.Quote,
      text: 'A sufficiently long quote',
      quoteAuthor: 'Author',
    },
    authorId,
  );
  const repository = {
    findById: async () => entity,
    save: async () => {
      throw new Error('Invalid content was persisted');
    },
  } as unknown as PublicationRepository;
  const service = new PublicationService(
    repository,
    {} as PublicationNotificationPublisher,
  );
  await assert.rejects(
    service.update(entity.id, { text: 'short' }, authorId),
    BadRequestException,
  );
});

test('an instantiated partial DTO preserves omitted required fields', async () => {
  const authorId = '11111111-1111-4111-8111-111111111111';
  const entity = new PublicationEntity(
    {
      type: PublicationType.Video,
      title: 'An original video title',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
    },
    authorId,
  );
  const repository = {
    findById: async () => entity,
    update: async () => entity,
  } as unknown as PublicationRepository;
  const publisher = {
    flush: async () => undefined,
  } as unknown as PublicationNotificationPublisher;
  const service = new PublicationService(repository, publisher);
  const dto = plainToInstance(UpdatePublicationDto, {
    title: 'An updated video title',
  });
  const updated = await service.update(entity.id, dto, authorId);
  assert.equal(updated.videoUrl, 'https://youtu.be/dQw4w9WgXcQ');
});

test('withdrawing a publication cancels its pending notification', async () => {
  const authorId = '11111111-1111-4111-8111-111111111111';
  const entity = new PublicationEntity(
    { type: PublicationType.Link, linkUrl: 'https://example.com' },
    authorId,
  );
  const withdrawn: string[] = [];
  const repository = {
    findById: async () => entity,
    update: async (
      _entity: unknown,
      event: { payload: { publicationId: string } },
    ) => {
      withdrawn.push(event.payload.publicationId);
      return entity;
    },
  } as unknown as PublicationRepository;
  const publisher = {
    flush: async () => undefined,
  } as unknown as PublicationNotificationPublisher;
  const service = new PublicationService(repository, publisher);
  await service.update(
    entity.id,
    { status: PublicationStatus.Draft },
    authorId,
  );
  assert.deepEqual(withdrawn, [entity.id]);
});

test('an empty following list restricts the feed to the current author', async () => {
  let filter: PublicationFilter | undefined;
  const repository = {
    findPublished: async (value: PublicationFilter) => {
      filter = value;
      return [];
    },
  } as unknown as PublicationRepository;
  const service = new PublicationService(
    repository,
    {} as PublicationNotificationPublisher,
  );
  await service.findFeed({ authorIds: [] }, 'current');
  assert.deepEqual(filter?.authorIds, ['current']);
});

test('a feed author filter cannot include an unfollowed author', async () => {
  let filter: PublicationFilter | undefined;
  const repository = {
    findPublished: async (value: PublicationFilter) => {
      filter = value;
      return [];
    },
  } as unknown as PublicationRepository;
  const service = new PublicationService(
    repository,
    {} as PublicationNotificationPublisher,
  );
  await service.findFeed(
    { authorIds: ['followed'], authorId: 'unfollowed' },
    'current',
  );
  assert.deepEqual(filter?.authorIds, []);
});
