import assert from 'node:assert/strict';
import { test } from 'node:test';
import { of, throwError } from 'rxjs';
import type { ClientProxy } from '@nestjs/microservices';
import { AccountNotificationPublisher } from './notification.publisher';
import { UserService } from '../user/user.service';
import type { UserEntity } from '../user/user.entity';
import type { UserRepository } from '../user/user.repository';
import type { SubscriptionRepository } from '../subscription/subscription.repository';
import type { UserRegisteredEvent } from '@project/shared-types';

test('registration succeeds during a broker outage and its durable event is retried', async () => {
  let stored: UserEntity | undefined;
  let pending = true;
  let unavailable = true;
  const delivered: UserRegisteredEvent[] = [];
  const repository = {
    findByEmail: async () => stored ?? null,
    save: async (user: UserEntity) => {
      stored = user;
      return user;
    },
    findPendingNotifications: async () =>
      stored && pending
        ? [{ userId: stored.id, email: stored.email, name: stored.name }]
        : [],
    markNotificationPublished: async () => {
      pending = false;
    },
  } as unknown as UserRepository;
  const client = {
    emit: (_pattern: string, event: UserRegisteredEvent) => {
      if (unavailable) {
        return throwError(() => new Error('Broker unavailable'));
      }
      delivered.push(event);
      return of(undefined);
    },
  } as unknown as ClientProxy;
  const publisher = new AccountNotificationPublisher(client, repository);
  const service = new UserService(
    repository,
    publisher,
    {} as SubscriptionRepository,
  );
  const user = await service.register({
    email: 'outbox@example.com',
    name: 'Outbox Reader',
    password: 'secret12',
  });
  assert.equal(user.email, 'outbox@example.com');
  assert.equal(pending, true);
  assert.equal(delivered.length, 0);
  unavailable = false;
  await publisher.flush();
  await publisher.flush();
  assert.equal(pending, false);
  assert.deepEqual(delivered, [
    { userId: user.id, email: 'outbox@example.com', name: 'Outbox Reader' },
  ]);
});
