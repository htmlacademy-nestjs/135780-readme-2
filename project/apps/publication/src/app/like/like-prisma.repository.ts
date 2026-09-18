import { Injectable } from '@nestjs/common';
import { Like as LikeModel } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LikeEntity } from './like.entity';
import { LikeRepository } from './like.repository';

@Injectable()
export class LikePrismaRepository implements LikeRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async save(entity: LikeEntity): Promise<LikeEntity> {
    const like = await this.prisma.$transaction(async (transaction) => {
      const savedLike = await transaction.like.create({
        data: {
          id: entity.id,
          publicationId: entity.publicationId,
          userId: entity.userId,
          createdAt: entity.createdAt,
        },
      });

      await transaction.publication.update({
        where: { id: entity.publicationId },
        data: { likeCount: { increment: 1 } },
      });

      return savedLike;
    });

    return this.toEntity(like);
  }

  public async findById(id: string): Promise<LikeEntity | null> {
    const like = await this.prisma.like.findUnique({ where: { id } });
    return like ? this.toEntity(like) : null;
  }

  public async findByPublicationIdAndUserId(
    publicationId: string,
    userId: string,
  ): Promise<LikeEntity | null> {
    const like = await this.prisma.like.findUnique({
      where: {
        publicationId_userId: { publicationId, userId },
      },
    });

    return like ? this.toEntity(like) : null;
  }

  public async delete(id: string): Promise<boolean> {
    await this.prisma.$transaction(async (transaction) => {
      const like = await transaction.like.delete({ where: { id } });
      await transaction.publication.update({
        where: { id: like.publicationId },
        data: { likeCount: { decrement: 1 } },
      });
    });

    return true;
  }

  private toEntity(like: LikeModel): LikeEntity {
    return LikeEntity.restore(like);
  }
}
