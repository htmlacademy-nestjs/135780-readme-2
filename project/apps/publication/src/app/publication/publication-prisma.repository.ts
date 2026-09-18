import { Injectable } from '@nestjs/common';
import {
  Prisma,
  Publication as PublicationModel,
} from '@prisma/client';
import {
  PublicationStatus,
  PublicationType,
} from '@project/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { PublicationEntity } from './publication.entity';
import { PublicationRepository } from './publication.repository';

@Injectable()
export class PublicationPrismaRepository implements PublicationRepository {
  public constructor(private readonly prisma: PrismaService) {}

  public async save(entity: PublicationEntity): Promise<PublicationEntity> {
    const data = this.toPrismaData(entity);
    const publication = await this.prisma.publication.upsert({
      where: { id: entity.id },
      create: data,
      update: data,
    });

    return this.toEntity(publication);
  }

  public async findById(id: string): Promise<PublicationEntity | null> {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
    });

    return publication ? this.toEntity(publication) : null;
  }

  public async find(): Promise<PublicationEntity[]> {
    const publications = await this.prisma.publication.findMany({
      orderBy: { publishedAt: 'desc' },
    });

    return publications.map((publication) => this.toEntity(publication));
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.prisma.publication.deleteMany({
      where: { id },
    });

    return result.count > 0;
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
