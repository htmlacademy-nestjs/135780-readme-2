import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PublicationSort,
  PublicationStatus,
} from '@project/shared-types';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { PublicationQueryDto } from './dto/publication-query.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PublicationEntity } from './publication.entity';
import {
  PUBLICATION_REPOSITORY,
  type PublicationRepository,
} from './publication.repository';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const SEARCH_RESULT_LIMIT = 20;

@Injectable()
export class PublicationService {
  public constructor(
    @Inject(PUBLICATION_REPOSITORY)
    private readonly repository: PublicationRepository,
  ) {}

  public async create(
    dto: CreatePublicationDto,
    authorId: string,
  ): Promise<PublicationEntity> {
    return this.repository.save(new PublicationEntity(dto, authorId));
  }

  public async findPublished(
    query: PublicationQueryDto,
  ): Promise<PublicationEntity[]> {
    const publications = await this.repository.find();
    const filtered = publications.filter((publication) =>
      this.matchesQuery(publication, query),
    );

    this.sort(filtered, query.sort);

    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = (page - 1) * limit;
    return filtered.slice(offset, offset + limit);
  }

  public async findDrafts(authorId: string): Promise<PublicationEntity[]> {
    const publications = await this.repository.find();
    return publications.filter(
      (publication) =>
        publication.authorId === authorId &&
        publication.status === PublicationStatus.Draft,
    );
  }

  public async search(title: string): Promise<PublicationEntity[]> {
    const normalizedTitle = title.toLowerCase();
    const publications = await this.repository.find();

    return publications
      .filter(
        (publication) =>
          publication.status === PublicationStatus.Published &&
          publication.title?.toLowerCase().includes(normalizedTitle),
      )
      .slice(0, SEARCH_RESULT_LIMIT);
  }

  public async getById(id: string): Promise<PublicationEntity> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException('Publication not found');
    }

    return entity;
  }

  public async update(
    id: string,
    dto: UpdatePublicationDto,
    authorId: string,
  ): Promise<PublicationEntity> {
    const entity = await this.getById(id);
    this.ensureOwner(entity, authorId);
    entity.update(dto);
    return this.repository.save(entity);
  }

  public async delete(id: string, authorId: string): Promise<void> {
    const entity = await this.getById(id);
    this.ensureOwner(entity, authorId);
    await this.repository.delete(id);
  }

  public async repost(
    id: string,
    authorId: string,
  ): Promise<PublicationEntity> {
    const original = await this.getById(id);
    const publications = await this.repository.find();
    const existingRepost = publications.some(
      (publication) =>
        publication.authorId === authorId &&
        publication.originalPublicationId === original.id,
    );

    if (existingRepost) {
      throw new ConflictException('Publication has already been reposted');
    }

    return this.repository.save(
      PublicationEntity.createRepost(original, authorId),
    );
  }

  private matchesQuery(
    publication: PublicationEntity,
    query: PublicationQueryDto,
  ): boolean {
    return (
      publication.status === PublicationStatus.Published &&
      (!query.type || publication.type === query.type) &&
      (!query.authorId || publication.authorId === query.authorId) &&
      (!query.tag || publication.tags.includes(query.tag.toLowerCase()))
    );
  }

  private sort(
    publications: PublicationEntity[],
    sort: PublicationSort = PublicationSort.PublishedAt,
  ): void {
    publications.sort((first, second) => {
      if (sort === PublicationSort.Likes) {
        return second.likeCount - first.likeCount;
      }

      if (sort === PublicationSort.Comments) {
        return second.commentCount - first.commentCount;
      }

      return second.publishedAt.getTime() - first.publishedAt.getTime();
    });
  }

  private ensureOwner(entity: PublicationEntity, authorId: string): void {
    if (entity.authorId !== authorId) {
      throw new ForbiddenException('Only the author can change publication');
    }
  }
}
