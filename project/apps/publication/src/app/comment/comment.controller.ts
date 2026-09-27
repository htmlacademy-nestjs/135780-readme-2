import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserId } from '../common/user-id.decorator';
import { CommentEntity } from './comment.entity';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentQueryDto } from './dto/comment-query.dto';

@ApiTags('comments')
@ApiBadRequestResponse({ description: 'Request validation failed' })
@Controller('publications/:publicationId/comments')
export class CommentController {
  public constructor(private readonly service: CommentService) {}

  @Post()
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Add a comment' })
  @ApiCreatedResponse({ description: 'Comment created' })
  @ApiNotFoundResponse({ description: 'Published publication not found' })
  public create(
    @Param('publicationId', ParseUUIDPipe) publicationId: string,
    @UserId(ParseUUIDPipe) authorId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentEntity> {
    return this.service.create(publicationId, authorId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get publication comments' })
  @ApiOkResponse({ description: 'Up to 50 comments' })
  @ApiNotFoundResponse({ description: 'Published publication not found' })
  public find(
    @Param('publicationId', ParseUUIDPipe) publicationId: string,
    @Query() query: CommentQueryDto,
  ): Promise<CommentEntity[]> {
    return this.service.findByPublicationId(publicationId, query);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Delete an own comment' })
  @ApiNoContentResponse({ description: 'Comment deleted' })
  public delete(
    @Param('publicationId', ParseUUIDPipe) publicationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<void> {
    return this.service.delete(publicationId, id, authorId);
  }
}
