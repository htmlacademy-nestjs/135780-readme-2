import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UserService } from './user.service';
import { AccountNotificationPublisher } from '../notification/notification.publisher';
import type { UserRepository } from './user.repository';
import { UserEntity } from './user.entity';
import type { SubscriptionRepository } from '../subscription/subscription.repository';
import { UnauthorizedException } from '@nestjs/common';

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
    flush: async () => {
      calls.push('publish');
    },
  };
  const service = new UserService(
    repository,
    publisher as unknown as AccountNotificationPublisher,
    {} as SubscriptionRepository,
  );

  await service.register({
    email: 'reader@example.com',
    name: 'Test Reader',
    password: 'secret12',
  });

  assert.deepEqual(calls, ['save', 'publish']);
});

test('changing a password verifies the old password and persists only a hash', async () => {
  const user = await UserEntity.create(
    { email: 'password@example.com', name: 'Reader' },
    'secret12',
  );
  let storedHash = user.getPasswordHash();
  const repository = {
    findById: async () => user,
    save: async (entity: UserEntity) => {
      storedHash = entity.getPasswordHash();
      return entity;
    },
  } as unknown as UserRepository;
  const service = new UserService(
    repository,
    {} as AccountNotificationPublisher,
    {} as SubscriptionRepository,
  );
  await service.changePassword(user.id, {
    currentPassword: 'secret12',
    newPassword: 'changed12',
  });
  assert.notEqual(storedHash, 'changed12');
  assert.equal(await user.comparePassword('changed12'), true);
  assert.equal(await user.comparePassword('secret12'), false);
});

test('an incorrect current password leaves the stored password unchanged', async () => {
  const user = await UserEntity.create(
    { email: 'password@example.com', name: 'Reader' },
    'secret12',
  );
  const originalHash = user.getPasswordHash();
  const repository = {
    findById: async () => user,
  } as unknown as UserRepository;
  const service = new UserService(
    repository,
    {} as AccountNotificationPublisher,
    {} as SubscriptionRepository,
  );
  await assert.rejects(
    service.changePassword(user.id, {
      currentPassword: 'wrong123',
      newPassword: 'changed12',
    }),
    UnauthorizedException,
  );
  assert.equal(user.getPasswordHash(), originalHash);
});
