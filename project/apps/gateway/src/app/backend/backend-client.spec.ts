import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { BackendClient, BackendService } from './backend-client';
import { PresentationService } from '../presentation/presentation.service';

test('gateway joins publications with safe author and image information and shares author lookups', async () => {
  const authorId = '00000000-0000-4000-8000-000000000001';
  let authorReads = 0;
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url?.startsWith('/users/')) {
      authorReads++;
      res.end(
        JSON.stringify({
          id: authorId,
          email: 'reader@example.com',
          name: 'Reader',
          createdAt: new Date().toISOString(),
          subscriberCount: 0,
          passwordHash: 'must-not-leak',
        }),
      );
    } else if (req.url?.startsWith('/publications/count')) {
      res.end(JSON.stringify({ publicationCount: 2 }));
    } else {
      res.end(
        JSON.stringify({
          id: 'photo',
          originalName: 'photo.png',
          mimeType: 'image/png',
          size: 100,
          path: '/api/files/photo/content',
          createdAt: new Date().toISOString(),
        }),
      );
    }
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
    const client = new BackendClient(
      new ConfigService({
        ACCOUNT_URL: url,
        PUBLICATION_URL: url,
        FILE_URL: url,
        NOTIFICATION_URL: url,
        HTTP_TIMEOUT: 1000,
      }),
    );
    const service = new PresentationService(client);
    const posts = [
      { id: 'post1', authorId, photoId: 'photo' },
      { id: 'post2', authorId },
    ] as Parameters<PresentationService['getPublications']>[0];
    const result = await service.getPublications(posts);
    assert.equal(result[0].author.name, 'Reader');
    assert.equal(result[0].author.publicationCount, 2);
    assert.equal('passwordHash' in result[0].author, false);
    assert.equal(result[0].photo?.path, '/api/files/photo/content');
    assert.equal(authorReads, 1);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

for (const statusCode of [400, 503]) {
  test(`gateway preserves upstream ${statusCode} errors`, async () => {
    const server = createServer((_req, res) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ message: 'Request cannot be processed', statusCode }),
      );
    });
    await new Promise<void>((resolve) =>
      server.listen(0, '127.0.0.1', resolve),
    );
    try {
      const url = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
      const client = new BackendClient(
        new ConfigService({
          ACCOUNT_URL: url,
          PUBLICATION_URL: url,
          FILE_URL: url,
          NOTIFICATION_URL: url,
          HTTP_TIMEOUT: 1000,
        }),
      );
      await assert.rejects(
        client.request(BackendService.Account, 'GET', '/users/test'),
        (error: unknown) => {
          assert.ok(error instanceof HttpException);
          assert.equal(error.getStatus(), statusCode);
          assert.deepEqual(error.getResponse(), {
            message: 'Request cannot be processed',
            statusCode,
          });
          return true;
        },
      );
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
}
