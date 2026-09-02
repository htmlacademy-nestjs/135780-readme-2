import {
  Publication,
  PublicationStatus,
  PublicationType,
} from '@project/shared-types';
import { randomUUID } from 'node:crypto';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';

export class PublicationEntity implements Publication {
  public id: string;
  public authorId: string;
  public type: PublicationType;
  public status: PublicationStatus;
  public createdAt: Date;
  public publishedAt: Date;
  public tags: string[];
  public likeCount: number;
  public commentCount: number;
  public isRepost: boolean;
  public originalPublicationId?: string;
  public originalAuthorId?: string;
  public title?: string;
  public videoUrl?: string;
  public announcement?: string;
  public text?: string;
  public quoteAuthor?: string;
  public photoId?: string;
  public linkUrl?: string;
  public description?: string;

  public constructor(dto: CreatePublicationDto, authorId: string) {
    const currentDate = new Date();

    this.id = randomUUID();
    this.authorId = authorId;
    this.type = dto.type;
    this.status = dto.status ?? PublicationStatus.Published;
    this.createdAt = currentDate;
    this.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : currentDate;
    this.tags = dto.tags ?? [];
    this.likeCount = 0;
    this.commentCount = 0;
    this.isRepost = false;
    this.applyContent(dto);
  }

  public static createRepost(
    original: PublicationEntity,
    authorId: string,
  ): PublicationEntity {
    const entity = new PublicationEntity(
      {
        type: original.type,
        status: PublicationStatus.Published,
        tags: [...original.tags],
        title: original.title,
        videoUrl: original.videoUrl,
        announcement: original.announcement,
        text: original.text,
        quoteAuthor: original.quoteAuthor,
        photoId: original.photoId,
        linkUrl: original.linkUrl,
        description: original.description,
      },
      authorId,
    );

    entity.isRepost = true;
    entity.originalPublicationId = original.id;
    entity.originalAuthorId = original.authorId;
    return entity;
  }

  public update(dto: UpdatePublicationDto): void {
    this.status = dto.status ?? this.status;
    this.publishedAt = dto.publishedAt
      ? new Date(dto.publishedAt)
      : this.publishedAt;
    this.tags = dto.tags ?? this.tags;
    this.applyContent(dto);
  }

  private applyContent(dto: UpdatePublicationDto | CreatePublicationDto): void {
    this.title = dto.title ?? this.title;
    this.videoUrl = dto.videoUrl ?? this.videoUrl;
    this.announcement = dto.announcement ?? this.announcement;
    this.text = dto.text ?? this.text;
    this.quoteAuthor = dto.quoteAuthor ?? this.quoteAuthor;
    this.photoId = dto.photoId ?? this.photoId;
    this.linkUrl = dto.linkUrl ?? this.linkUrl;
    this.description = dto.description ?? this.description;
  }
}
