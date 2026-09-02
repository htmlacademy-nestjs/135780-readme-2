import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserId } from '../common/user-id.decorator';
import { LikeEntity } from './like.entity';
import { LikeService } from './like.service';

@ApiTags('likes')
@Controller('publications/:publicationId/likes')
export class LikeController {
  public constructor(private readonly service: LikeService) {}

  @Post()
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Like a publication' })
  @ApiCreatedResponse({ description: 'Like created' })
  @ApiConflictResponse({ description: 'Publication is already liked' })
  public add(
    @Param('publicationId', ParseUUIDPipe) publicationId: string,
    @UserId(ParseUUIDPipe) userId: string,
  ): Promise<LikeEntity> {
    return this.service.add(publicationId, userId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiHeader({ name: 'x-user-id', description: 'Forwarded by API Gateway' })
  @ApiOperation({ summary: 'Remove an own like' })
  @ApiNoContentResponse({ description: 'Like removed' })
  public remove(
    @Param('publicationId', ParseUUIDPipe) publicationId: string,
    @UserId(ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.service.remove(publicationId, userId);
  }
}
