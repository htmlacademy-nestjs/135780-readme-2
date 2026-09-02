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
import { CreatePublicationDto } from './dto/create-publication.dto';
import { PublicationQueryDto } from './dto/publication-query.dto';
import { UpdatePublicationDto } from './dto/update-publication.dto';
import { PublicationEntity } from './publication.entity';
import { PublicationService } from './publication.service';

@ApiTags('publications')
@Controller('publications')
export class PublicationController {
  public constructor(private readonly service: PublicationService) {}

  @Post()
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Create a publication' })
  @ApiCreatedResponse({ description: 'Publication created' })
  public create(
    @Body() dto: CreatePublicationDto,
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<PublicationEntity> {
    return this.service.create(dto, authorId);
  }

  @Get()
  @ApiOperation({ summary: 'Get published publications' })
  @ApiOkResponse({ description: 'Paginated publication list' })
  public find(
    @Query() query: PublicationQueryDto,
  ): Promise<PublicationEntity[]> {
    return this.service.findPublished(query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search publications by title' })
  @ApiQuery({ name: 'title', required: true })
  @ApiOkResponse({ description: 'Up to 20 matching publications' })
  public search(@Query('title') title: string): Promise<PublicationEntity[]> {
    return this.service.search(title);
  }

  @Get('drafts')
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Get current user drafts' })
  @ApiOkResponse({ description: 'Draft publication list' })
  public findDrafts(
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<PublicationEntity[]> {
    return this.service.findDrafts(authorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get publication details' })
  @ApiOkResponse({ description: 'Detailed publication' })
  @ApiNotFoundResponse({ description: 'Publication not found' })
  public getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicationEntity> {
    return this.service.getById(id);
  }

  @Patch(':id')
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Update an own publication' })
  @ApiOkResponse({ description: 'Publication updated' })
  @ApiNotFoundResponse({ description: 'Publication not found' })
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
  @ApiNotFoundResponse({ description: 'Publication not found' })
  public delete(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<void> {
    return this.service.delete(id, authorId);
  }

  @Post(':id/repost')
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Repost a publication' })
  @ApiCreatedResponse({ description: 'Repost created' })
  @ApiConflictResponse({ description: 'Publication already reposted' })
  public repost(
    @Param('id', ParseUUIDPipe) id: string,
    @UserId(ParseUUIDPipe) authorId: string,
  ): Promise<PublicationEntity> {
    return this.service.repost(id, authorId);
  }
}
