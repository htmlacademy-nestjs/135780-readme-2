import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UserService } from './user.service';
import { AccountNotificationPublisher } from '../notification/notification.publisher';
import type { UserRepository } from './user.repository';

test('registration publishes a user event after saving', async () => {
  const calls: string[] = [];
  const repository = {
    findByEmail: async () => null,
    save: async (user: unknown) => {
      calls.push('save');
      return user;
    },
  } as unknown as UserRepository;
  const publisher = {
    publishUserRegistered: async (user: unknown) => {
      calls.push('publish');
      return user;
    },
  };
  const service = new UserService(
    repository,
    publisher as unknown as AccountNotificationPublisher,
  );

  await service.register({
    email: 'reader@example.com',
    name: 'Test Reader',
    password: 'secret12',
  });

  assert.deepEqual(calls, ['save', 'publish']);
});
