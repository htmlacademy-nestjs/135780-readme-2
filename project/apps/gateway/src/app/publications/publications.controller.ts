import { PublicationsGatewayService } from './publications.service';
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
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreatePublicationDto,
  ApiCreatePublicationBody,
  PublicationQueryDto,
  SearchPublicationQueryDto,
  UpdatePublicationDto,
} from '@project/shared-api';
import { Access, RouteAccess } from '../auth/route-access.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiBackendResponses } from '../backend/api-backend-responses.decorator';
import { type PublicationView } from '../presentation/presentation.service';
import { PublicationResponseDto } from '../presentation/response.dto';

@ApiTags('publications')
@ApiBackendResponses()
@Controller('publications')
export class PublicationsController {
  public constructor(private readonly service: PublicationsGatewayService) {}

  @Post()
  @ApiCreatePublicationBody()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a publication' })
  @ApiCreatedResponse({ type: PublicationResponseDto })
  public async create(
    @Body() dto: CreatePublicationDto,
    @CurrentUser() userId: string,
  ): Promise<PublicationView> {
    return this.service.create(dto, userId);
  }

  @Get()
  @Access(RouteAccess.Public)
  @ApiOperation({
    summary:
      'Get a filtered and paginated list of publications with authors and images',
  })
  @ApiOkResponse({ type: [PublicationResponseDto] })
  public async list(
    @Query() query: PublicationQueryDto,
  ): Promise<PublicationView[]> {
    return this.service.find(query);
  }

  @Get('feed')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get paginated publications from followed authors and the current user',
  })
  @ApiOkResponse({ type: [PublicationResponseDto] })
  public findFeed(
    @Query() query: PublicationQueryDto,
    @CurrentUser() userId: string,
  ): Promise<PublicationView[]> {
    return this.service.findFeed(query, userId);
  }

  @Get('search')
  @Access(RouteAccess.Public)
  @ApiOperation({ summary: 'Search published posts by title' })
  @ApiOkResponse({ type: [PublicationResponseDto] })
  public async search(
    @Query() query: SearchPublicationQueryDto,
  ): Promise<PublicationView[]> {
    return this.service.search(query);
  }

  @Get('drafts')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user drafts' })
  @ApiOkResponse({ type: [PublicationResponseDto] })
  public async drafts(
    @CurrentUser() userId: string,
  ): Promise<PublicationView[]> {
    return this.service.findDrafts(userId);
  }

  @Get(':id')
  @Access(RouteAccess.Public)
  @ApiOperation({ summary: 'Get a published post or an own draft' })
  @ApiOkResponse({ type: PublicationResponseDto })
  public async get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId?: string,
  ): Promise<PublicationView> {
    return this.service.getById(id, userId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit an own publication' })
  @ApiOkResponse({ type: PublicationResponseDto })
  public async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePublicationDto,
    @CurrentUser() userId: string,
  ): Promise<PublicationView> {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an own publication' })
  @ApiNoContentResponse({ description: 'Publication deleted' })
  public async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ): Promise<void> {
    return this.service.delete(id, userId);
  }

  @Post(':id/repost')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Repost a publication' })
  @ApiCreatedResponse({ type: PublicationResponseDto })
  public async repost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() userId: string,
  ): Promise<PublicationView> {
    return this.service.repost(id, userId);
  }
}
