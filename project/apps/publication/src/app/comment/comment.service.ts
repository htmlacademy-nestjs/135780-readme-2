import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommentEntity } from './comment.entity';
import {
  COMMENT_REPOSITORY,
  type CommentRepository,
} from './comment.repository';
import { CreateCommentDto } from './dto/create-comment.dto';

const DEFAULT_COMMENT_LIMIT = 50;

@Injectable()
export class CommentService {
  public constructor(
    @Inject(COMMENT_REPOSITORY)
    private readonly repository: CommentRepository,
  ) {}

  public async create(
    publicationId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<CommentEntity> {
    return this.repository.save(
      new CommentEntity(publicationId, authorId, dto.text),
    );
  }

  public async findByPublicationId(
    publicationId: string,
    page = 1,
  ): Promise<CommentEntity[]> {
    const comments = await this.repository.findByPublicationId(publicationId);
    const offset = (page - 1) * DEFAULT_COMMENT_LIMIT;
    return comments.slice(offset, offset + DEFAULT_COMMENT_LIMIT);
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
