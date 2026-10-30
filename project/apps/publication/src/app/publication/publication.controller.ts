import { HttpErrorRdo } from '@project/shared-api';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserId } from '../common/user-id.decorator';
import {
  ApiCreatePublicationBody,
  FeedQueryDto,
  PublicationRdo,
} from '@project/shared-api';
import { CreatePublicationDto } from './dto/create-publication.dto';
import { PublicationQueryDto } from './dto/publication-query.dto';
import { SearchPublicationQueryDto } from './dto/search-publication-query.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PublicationEntity } from './publication.entity';
import { PublicationService } from './publication.service';

@ApiTags('publications')
@ApiBadRequestResponse({
  type: HttpErrorRdo,
  description: 'Request validation failed',
})
@Controller('publications')
export class PublicationController {
  public constructor(private readonly service: PublicationService) {}

  @Post()
  @ApiCreatePublicationBody()
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Create a publication' })
  @ApiCreatedResponse({
    type: PublicationRdo,
    description: 'Publication created',
  })
  public create(
    @Body() dto: CreatePublicationDto,
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<PublicationEntity> {
    return this.service.create(dto, authorId);
  }

  @Get()
  @ApiOperation({ summary: 'Get published publications' })
  @ApiOkResponse({
    type: [PublicationRdo],
    description: 'Paginated publication list',
  })
  public find(
    @Query() query: PublicationQueryDto,
  ): Promise<PublicationEntity[]> {
    return this.service.findPublished(query);
  }

  @Post('feed')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({
    name: 'x-user-id',
    description: 'Authenticated user forwarded by API Gateway',
  })
  @ApiOperation({
    summary:
      'Query the current user feed using author identifiers resolved by account',
  })
  @ApiOkResponse({
    type: [PublicationRdo],
    description:
      'Paginated published posts from followed authors and the current user',
  })
  public findFeed(
    @Body() query: FeedQueryDto,
    @UserId(ParseUUIDPipe) userId: string,
  ): Promise<PublicationEntity[]> {
    return this.service.findFeed(query, userId);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search publications by title' })
  @ApiOkResponse({
    type: [PublicationRdo],
    description: 'Up to 20 matching publications',
  })
  public search(
    @Query() query: SearchPublicationQueryDto,
  ): Promise<PublicationEntity[]> {
    return this.service.search(query.title);
  }

  @Get('drafts')
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Get current user drafts' })
  @ApiOkResponse({
    type: [PublicationRdo],
    description: 'Draft publication list',
  })
  public findDrafts(
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<PublicationEntity[]> {
    return this.service.findDrafts(authorId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get the number of published posts by an author' })
  @ApiQuery({ name: 'authorId', required: true, type: String, format: 'uuid' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      required: ['publicationCount'],
      properties: { publicationCount: { type: 'integer', minimum: 0 } },
    },
  })
  public count(
    @Query('authorId', ParseUUIDPipe) authorId: string,
  ): Promise<{ publicationCount: number }> {
    return this.service.countPublishedByAuthor(authorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get publication details' })
  @ApiOkResponse({ type: PublicationRdo, description: 'Detailed publication' })
  @ApiNotFoundResponse({
    type: HttpErrorRdo,
    description: 'Publication not found',
  })
  public getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicationEntity> {
    return this.service.getById(id);
  }

  @Patch(':id')
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Update an own publication' })
  @ApiOkResponse({ type: PublicationRdo, description: 'Publication updated' })
  @ApiNotFoundResponse({
    type: HttpErrorRdo,
    description: 'Publication not found',
  })
  public update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePublicationDto,
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<PublicationEntity> {
    return this.service.update(id, dto, authorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Delete an own publication' })
  @ApiNoContentResponse({ description: 'Publication deleted' })
  @ApiNotFoundResponse({
    type: HttpErrorRdo,
    description: 'Publication not found',
  })
  public delete(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<void> {
    return this.service.delete(id, authorId);
  }

  @Post(':id/repost')
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Repost a publication' })
  @ApiCreatedResponse({ type: PublicationRdo, description: 'Repost created' })
  @ApiConflictResponse({
    type: HttpErrorRdo,
    description: 'Publication already reposted',
  })
  public repost(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<PublicationEntity> {
    return this.service.repost(id, authorId);
  }
}
