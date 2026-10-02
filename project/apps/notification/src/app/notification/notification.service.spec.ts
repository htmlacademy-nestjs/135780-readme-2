import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NotificationService } from './notification.service';
import type { SubscriberRepository } from '../subscriber/subscriber.repository';
import type { NotificationPublicationRepository } from '../notification-publication/notification-publication.repository';
import type { MailService } from '../mail/mail.service';

const publication = {
  publicationId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  authorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  type: 'text',
  title: 'New article',
  publishedAt: new Date('2026-10-01T00:00:00.000Z'),
};

test('an empty publication queue sends no email', async () => {
  let sent = 0;
  const service = new NotificationService(
    { findAll: async () => [{ email: 'reader@example.com' }] } as unknown as SubscriberRepository,
    { findPending: async () => [], markNotified: async () => undefined } as unknown as NotificationPublicationRepository,
    { sendDigest: async () => { sent += 1; } } as unknown as MailService,
  );

  const result = await service.sendPending();

  assert.deepEqual(result, { recipientCount: 0, publicationCount: 0 });
  assert.equal(sent, 0);
});

test('successful digest sends each recipient and marks publications', async () => {
  const sentTo: string[] = [];
  let marked: string[] = [];
  const service = new NotificationService(
    { findAll: async () => [{ email: 'one@example.com' }, { email: 'two@example.com' }] } as unknown as SubscriberRepository,
    {
      findPending: async () => [publication],
      markNotified: async (ids: string[]) => { marked = ids; },
    } as unknown as NotificationPublicationRepository,
    { sendDigest: async (email: string) => { sentTo.push(email); } } as unknown as MailService,
  );

  const result = await service.sendPending();

  assert.deepEqual(sentTo, ['one@example.com', 'two@example.com']);
  assert.deepEqual(marked, [publication.publicationId]);
  assert.deepEqual(result, { recipientCount: 2, publicationCount: 1 });
});

test('SMTP failure leaves publications pending', async () => {
  let marked = false;
  const service = new NotificationService(
    { findAll: async () => [{ email: 'reader@example.com' }] } as unknown as SubscriberRepository,
    {
      findPending: async () => [publication],
      markNotified: async () => { marked = true; },
    } as unknown as NotificationPublicationRepository,
    { sendDigest: async () => { throw new Error('SMTP unavailable'); } } as unknown as MailService,
  );

  await assert.rejects(() => service.sendPending(), /SMTP unavailable/);
  assert.equal(marked, false);
});
