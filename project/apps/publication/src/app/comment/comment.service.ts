import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentEntity } from './comment.entity';
import { PublicationService } from '../publication/publication.service';
import {
  COMMENT_REPOSITORY,
  type CommentRepository,
} from './comment.repository';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';
import { QUERY_LIMITS } from '../common/query.constants';

@Injectable()
export class CommentService {
  public constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly repository: CommentRepository,
    private readonly publicationService: PublicationService,
  ) {}

  public async create(
    publicationId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentEntity> {
    await this.publicationService.getPublishedById(publicationId);
    return this.repository.save(
      CommentEntity.create(publicationId, authorId, dto.text),
    );
  }

  public async findByPublicationId(
    publicationId: string,
    query: CommentQueryDto,
  ): Promise<CommentEntity[]> {
    await this.publicationService.getPublishedById(publicationId);
    const page = query.page ?? QUERY_LIMITS.defaultPage;
    const offset = (page - 1) * QUERY_LIMITS.commentsPerPage;
    return this.repository.findByPublicationId(
      publicationId,
      offset,
      QUERY_LIMITS.commentsPerPage,
    );
  }

  public async delete(
    publicationId: string,
    id: string,
    authorId: string,
  ): Promise<void> {
    const entity = await this.repository.findById(id);

    if (!entity || entity.publicationId !== publicationId) {
      throw new NotFoundException('Comment not found');
    }

    if (entity.authorId !== authorId) {
      throw new ForbiddenException('Only the author can delete comment');
    }

    await this.repository.delete(id);
  }
}
