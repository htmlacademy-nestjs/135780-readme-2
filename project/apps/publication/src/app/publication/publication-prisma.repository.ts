import { Injectable } from '@nestjs/common';
import { Prisma, Publication as PublicationModel } from '@prisma/client';
import {
  PublicationSort,
  PublicationStatus,
  PublicationType,
  type PublicationNotificationEvent,
} from '@project/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationEntity } from './publication.entity';
import {
  PublicationFilter,
  PublicationRepository,
} from './publication.repository';

@Injectable()
export class PublicationPrismaRepository implements PublicationRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public save(
    entity: PublicationEntity,
    event?: PublicationNotificationEvent,
  ): Promise<PublicationEntity> {
    return this.persist(entity, event, false);
  }

  public update(
    entity: PublicationEntity,
    event?: PublicationNotificationEvent,
  ): Promise<PublicationEntity> {
    return this.persist(entity, event, true);
  }

  private async persist(
    entity: PublicationEntity,
    event: PublicationNotificationEvent | undefined,
    updating: boolean,
  ): Promise<PublicationEntity> {
    const data = this.toPrismaData(entity);
    const publication = await this.prisma.$transaction(async (transaction) => {
      const saved = updating
        ? await transaction.publication.update({
            where: { id: entity.id },
            data: { ...data, likeCount: undefined, commentCount: undefined },
          })
        : await transaction.publication.create({ data });
      await this.recordEvent(transaction, event);
      return saved;
    });

    return this.toEntity(publication);
  }

  public countPublishedByAuthor(authorId: string): Promise<number> {
    return this.prisma.publication.count({
      where: { authorId, status: PublicationStatus.Published },
    });
  }

  public async findById(id: string): Promise<PublicationEntity | null> {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
    });

    return publication ? this.toEntity(publication) : null;
  }

  public async findPublished(
    filter: PublicationFilter,
  ): Promise<PublicationEntity[]> {
    const publications = await this.prisma.publication.findMany({
      where: {
        status: PublicationStatus.Published,
        type: filter.type,
        authorId: filter.authorIds ? { in: filter.authorIds } : filter.authorId,
        tags: filter.tag ? { has: filter.tag } : undefined,
      },
      orderBy: this.createOrderBy(filter.sort),
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
    });

    return publications.map((publication) => this.toEntity(publication));
  }

  public async findDrafts(authorId: string): Promise<PublicationEntity[]> {
    const publications = await this.prisma.publication.findMany({
      where: { authorId, status: PublicationStatus.Draft },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return publications.map((publication) => this.toEntity(publication));
  }

  public async search(
    title: string,
    limit: number,
  ): Promise<PublicationEntity[]> {
    const titleWords = title.split(/\s+/);
    const publications = await this.prisma.publication.findMany({
      where: {
        status: PublicationStatus.Published,
        OR: titleWords.map((word) => ({
          title: { contains: word, mode: 'insensitive' },
        })),
      },
      orderBy: [{ publishedAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    return publications.map((publication) => this.toEntity(publication));
  }

  public async findRepost(
    authorId: string,
    originalPublicationId: string,
  ): Promise<PublicationEntity | null> {
    const publication = await this.prisma.publication.findFirst({
      where: { authorId, originalPublicationId },
    });

    return publication ? this.toEntity(publication) : null;
  }

  public async delete(
    id: string,
    event?: PublicationNotificationEvent,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.publication.deleteMany({
        where: { id },
      });
      if (result.count > 0) {
        await this.recordEvent(transaction, event);
      }
      return result.count > 0;
    });
  }

  private async recordEvent(
    transaction: Prisma.TransactionClient,
    event?: PublicationNotificationEvent,
  ): Promise<void> {
    if (!event) {
      return;
    }
    await transaction.outboxEvent.create({
      data: {
        pattern: event.pattern,
        payload: JSON.parse(
          JSON.stringify(event.payload),
        ) as Prisma.InputJsonValue,
      },
    });
  }

  private createOrderBy(
    sort: PublicationFilter['sort'],
  ): Prisma.PublicationOrderByWithRelationInput[] {
    if (sort === PublicationSort.Likes) {
      return [{ likeCount: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }];
    }

    if (sort === PublicationSort.Comments) {
      return [
        { commentCount: 'desc' },
        { publishedAt: 'desc' },
        { id: 'desc' },
      ];
    }

    return [{ publishedAt: 'desc' }, { id: 'desc' }];
  }

  private toPrismaData(
    entity: PublicationEntity,
  ): Prisma.PublicationUncheckedCreateInput {
    return {
      id: entity.id,
      authorId: entity.authorId,
      type: entity.type,
      status: entity.status,
      createdAt: entity.createdAt,
      publishedAt: entity.publishedAt,
      tags: entity.tags,
      likeCount: entity.likeCount,
      commentCount: entity.commentCount,
      isRepost: entity.isRepost,
      originalPublicationId: entity.originalPublicationId,
      originalAuthorId: entity.originalAuthorId,
      title: entity.title,
      videoUrl: entity.videoUrl,
      announcement: entity.announcement,
      text: entity.text,
      quoteAuthor: entity.quoteAuthor,
      photoId: entity.photoId,
      linkUrl: entity.linkUrl,
      description: entity.description,
    };
  }

  private toEntity(publication: PublicationModel): PublicationEntity {
    return PublicationEntity.restore({
      id: publication.id,
      authorId: publication.authorId,
      type: publication.type as PublicationType,
      status: publication.status as PublicationStatus,
      createdAt: publication.createdAt,
      publishedAt: publication.publishedAt,
      tags: publication.tags,
      likeCount: publication.likeCount,
      commentCount: publication.commentCount,
      isRepost: publication.isRepost,
      originalPublicationId: publication.originalPublicationId ?? undefined,
      originalAuthorId: publication.originalAuthorId ?? undefined,
      title: publication.title ?? undefined,
      videoUrl: publication.videoUrl ?? undefined,
      announcement: publication.announcement ?? undefined,
      text: publication.text ?? undefined,
      quoteAuthor: publication.quoteAuthor ?? undefined,
      photoId: publication.photoId ?? undefined,
      linkUrl: publication.linkUrl ?? undefined,
      description: publication.description ?? undefined,
    });
  }
}
