import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RpcException } from '@nestjs/microservices';
import { PARAM_ARGS_METADATA } from '@nestjs/microservices/constants';
import { EXCEPTION_FILTERS_METADATA } from '@nestjs/common/constants';
import type { ArgumentsHost } from '@nestjs/common';
import { lastValueFrom, type Observable } from 'rxjs';
import { RabbitController } from './rabbit.controller';

test('RabbitMQ payloads are validated by a pipe before entering the handler', async () => {
  const argumentsMetadata =
    Reflect.getMetadata(
      PARAM_ARGS_METADATA,
      RabbitController,
      'onUserRegistered',
    ) ?? {};
  const pipes = Object.values(argumentsMetadata).flatMap(
    (argument) =>
      (argument as { pipes: { transform(value: unknown): Promise<object> }[] })
        .pipes,
  );
  assert.ok(pipes.length > 0, 'No payload validation pipe was registered');
  await assert.rejects(
    () => pipes[0].transform({ userId: 'invalid', email: 'invalid', name: '' }),
    RpcException,
  );
  const payload = {
    userId: '11111111-1111-4111-8111-111111111111',
    email: 'reader@example.com',
    name: 'Reader',
  };
  assert.deepEqual({ ...(await pipes[0].transform(payload)) }, payload);
  await assert.rejects(
    () => pipes[0].transform({ ...payload, unexpected: true }),
    RpcException,
  );
});

test('invalid RabbitMQ events are discarded while infrastructure failures are requeued', async () => {
  const filters =
    Reflect.getMetadata(EXCEPTION_FILTERS_METADATA, RabbitController) ?? [];
  assert.ok(filters.length > 0, 'No RabbitMQ exception filter was registered');
  const filter = new filters[0]() as {
    catch(error: unknown, host: ArgumentsHost): Observable<never>;
  };
  const requeued: boolean[] = [];
  const message = { content: Buffer.from('{}') };
  const host = {
    switchToRpc: () => ({
      getContext: () => ({
        getMessage: () => message,
        getChannelRef: () => ({
          nack: (actual: unknown, multiple: boolean, requeue: boolean) => {
            assert.equal(actual, message);
            assert.equal(multiple, false);
            requeued.push(requeue);
          },
        }),
      }),
    }),
  } as unknown as ArgumentsHost;
  await lastValueFrom(filter.catch(new RpcException('Invalid event'), host), {
    defaultValue: undefined,
  });
  await lastValueFrom(filter.catch(new Error('Database unavailable'), host), {
    defaultValue: undefined,
  });
  assert.deepEqual(requeued, [false, true]);
});
