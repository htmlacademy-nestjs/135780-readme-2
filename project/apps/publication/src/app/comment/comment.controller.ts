import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserId } from '../common/user-id.decorator';
import { CommentEntity } from './comment.entity';
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('comments')
@Controller('publications/:publicationId/comments')
export class CommentController {
  public constructor(private readonly service: CommentService) {}

  @Post()
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Add a comment' })
  @ApiCreatedResponse({ description: 'Comment created' })
  public create(
    @Param('publicationId', ParseUUIDPipe) publicationId: string,
    @UserId(ParseUUIDPipe) authorId: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentEntity> {
    return this.service.create(publicationId, authorId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get publication comments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiOkResponse({ description: 'Up to 50 comments' })
  public find(
    @Param('publicationId', ParseUUIDPipe) publicationId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
  ): Promise<CommentEntity[]> {
    return this.service.findByPublicationId(publicationId, page);
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
