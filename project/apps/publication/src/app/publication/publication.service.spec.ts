import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PublicationStatus, PublicationType } from '@project/shared-types';
import { PublicationService } from './publication.service';
import { PublicationNotificationPublisher } from '../notification/notification.publisher';
import type { PublicationRepository } from './publication.repository';

test('creating a published post emits an event after persistence', async () => {
  const calls: string[] = [];
  const repository = {
    save: async (publication: unknown) => {
      calls.push('save');
      return publication;
    },
  } as PublicationRepository;
  const publisher = {
    publishPublicationPublished: async () => {
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
    publishPublicationPublished: async () => {
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
