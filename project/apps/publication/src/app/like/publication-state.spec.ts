import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PublicationStatus } from '@project/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { LikeEntity } from './like.entity';
import { LikePrismaRepository } from './like-prisma.repository';
import { CommentEntity } from '../comment/comment.entity';
import { CommentPrismaRepository } from '../comment/comment-prisma.repository';

const PUBLICATION_FIXTURE = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: '22222222-2222-4222-8222-222222222222',
} as const;

for (const resource of ['like', 'comment'] as const) {
  test(`a ${resource} write atomically requires a published publication`, async () => {
    let publicationWhere: Record<string, unknown> | undefined;
    const transaction = {
      publication: {
        update: async ({ where }: { where: Record<string, unknown> }) => {
          publicationWhere = where;
          return {};
        },
      },
      [resource]: { create: async ({ data }: { data: object }) => data },
    };
    const prisma = {
      $transaction: async (operation: (value: object) => Promise<unknown>) =>
        operation(transaction),
    } as unknown as PrismaService;

    if (resource === 'like') {
      await new LikePrismaRepository(prisma).save(
        LikeEntity.create(PUBLICATION_FIXTURE.id, PUBLICATION_FIXTURE.userId),
      );
    } else {
      await new CommentPrismaRepository(prisma).save(
        CommentEntity.create(
          PUBLICATION_FIXTURE.id,
          PUBLICATION_FIXTURE.userId,
          'A valid comment',
        ),
      );
    }
    assert.deepEqual(publicationWhere, {
      id: PUBLICATION_FIXTURE.id,
      status: PublicationStatus.Published,
    });
  });
}
