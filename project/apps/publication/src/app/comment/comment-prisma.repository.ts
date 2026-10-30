import { Injectable } from '@nestjs/common';
import { Comment as CommentModel } from '@prisma/client';
import { PublicationStatus } from '@project/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { CommentEntity } from './comment.entity';
import { CommentRepository } from './comment.repository';

@Injectable()
export class CommentPrismaRepository implements CommentRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async save(entity: CommentEntity): Promise<CommentEntity> {
    const comment = await this.prisma.$transaction(async (transaction) => {
      await transaction.publication.update({
        where: {
          id: entity.publicationId,
          status: PublicationStatus.Published,
        },
        data: { commentCount: { increment: 1 } },
      });
      const savedComment = await transaction.comment.create({
        data: {
          id: entity.id,
          publicationId: entity.publicationId,
          authorId: entity.authorId,
          text: entity.text,
          createdAt: entity.createdAt,
        },
      });

      return savedComment;
    });

    return this.toEntity(comment);
  }

  public async findById(id: string): Promise<CommentEntity | null> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    return comment ? this.toEntity(comment) : null;
  }

  public async findByPublicationId(
    publicationId: string,
    offset: number,
    limit: number,
  ): Promise<CommentEntity[]> {
    const comments = await this.prisma.comment.findMany({
      where: { publicationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: offset,
      take: limit,
    });

    return comments.map((comment) => this.toEntity(comment));
  }

  public async delete(id: string): Promise<boolean> {
    await this.prisma.$transaction(async (transaction) => {
      const comment = await transaction.comment.delete({ where: { id } });
      await transaction.publication.update({
        where: { id: comment.publicationId },
        data: { commentCount: { decrement: 1 } },
      });
    });

    return true;
  }

  private toEntity(comment: CommentModel): CommentEntity {
    return CommentEntity.restore(comment);
  }
}
