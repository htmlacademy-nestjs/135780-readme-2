import assert from 'node:assert/strict';
import { test } from 'node:test';
import { of, throwError } from 'rxjs';
import type { ClientProxy } from '@nestjs/microservices';
import {
  NotificationRabbitRouting,
  PublicationType,
} from '@project/shared-types';
import { PublicationNotificationPublisher } from './notification.publisher';
import { PublicationService } from '../publication/publication.service';
import type { PublicationRepository } from '../publication/publication.repository';
import type { PrismaService } from '../prisma/prisma.service';
import type { PublicationEntity } from '../publication/publication.entity';

test('a persisted publication keeps its outbox event until the broker recovers', async () => {
  let unavailable = true;
  const pendingEvents: {
    id: bigint;
    pattern: string;
    payload: unknown;
    createdAt: Date;
  }[] = [];
  const deliveredEvents: unknown[] = [];
  const repository = {
    save: async (
      publication: PublicationEntity,
      event?: { pattern: string; payload: unknown },
    ) => {
      if (event) {
        pendingEvents.push({ id: 1n, ...event, createdAt: new Date() });
      }
      return publication;
    },
  } as unknown as PublicationRepository;
  const prisma = {
    outboxEvent: {
      findMany: async () => [...pendingEvents],
      deleteMany: async () => {
        pendingEvents.splice(0, 1);
        return { count: 1 };
      },
    },
  } as unknown as PrismaService;
  const client = {
    emit: (pattern: string, payload: unknown) => {
      if (unavailable) {
        return throwError(() => new Error('Broker unavailable'));
      }
      deliveredEvents.push({ pattern, payload });
      return of(undefined);
    },
  } as unknown as ClientProxy;
  const publisher = new PublicationNotificationPublisher(client, prisma);
  const service = new PublicationService(repository, publisher);
  const publication = await service.create(
    { type: PublicationType.Link, linkUrl: 'https://example.com' },
    '11111111-1111-4111-8111-111111111111',
  );
  assert.equal(pendingEvents.length, 1);
  unavailable = false;
  await publisher.flush();
  await publisher.flush();
  assert.equal(pendingEvents.length, 0);
  assert.deepEqual(deliveredEvents, [
    {
      pattern: NotificationRabbitRouting.PublicationPublished,
      payload: {
        publicationId: publication.id,
        authorId: publication.authorId,
        type: 'link',
        publishedAt: publication.publishedAt.toISOString(),
      },
    },
  ]);
});
