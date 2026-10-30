import assert from 'node:assert/strict';
import { test } from 'node:test';
import mongoose, { type Model } from 'mongoose';
import { SubscriptionRepository } from './subscription.repository';
import type { SubscriptionModel } from './subscription.model';
import type { UserModel } from '../user/user.model';

test('subscribing does not invoke a deprecated mongoose option', async () => {
  const model = mongoose.model(
    'SubscriptionWarningRegression',
    new mongoose.Schema(
      {
        _id: String,
        subscriberId: String,
        authorId: String,
        createdAt: Date,
      },
      { bufferCommands: false },
    ),
  );
  model.collection.findOneAndUpdate = (async () => ({
    _id: '33333333-3333-4333-8333-333333333333',
    subscriberId: '11111111-1111-4111-8111-111111111111',
    authorId: '22222222-2222-4222-8222-222222222222',
    createdAt: new Date(),
  })) as unknown as typeof model.collection.findOneAndUpdate;
  const warnings: string[] = [];
  const collectWarning = (warning: Error) => {
    if (warning.message.includes('deprecated')) {
      warnings.push(warning.message);
    }
  };
  process.on('warning', collectWarning);
  try {
    const repository = new SubscriptionRepository(
      model as unknown as Model<SubscriptionModel>,
      {} as Model<UserModel>,
    );
    const subscription = await repository.subscribe(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    );
    await new Promise<void>((resolve) => setImmediate(resolve));
    assert.equal(subscription.authorId, '22222222-2222-4222-8222-222222222222');
    assert.deepEqual(warnings, []);
  } finally {
    process.off('warning', collectWarning);
    mongoose.deleteModel('SubscriptionWarningRegression');
  }
});
