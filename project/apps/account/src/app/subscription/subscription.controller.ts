import { HttpErrorRdo } from '@project/shared-api';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
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
import { SubscriptionRdo } from '@project/shared-api';
import type { Subscription } from '@project/shared-types';
import { UserId } from '../common/user-id.decorator';
import { SubscriptionService } from './subscription.service';

@ApiTags('subscriptions')
@ApiHeader({
  name: 'x-user-id',
  description: 'Authenticated user forwarded by API Gateway',
})
@ApiBadRequestResponse({
  type: HttpErrorRdo,
  description: 'Invalid identifiers or self-subscription',
})
@Controller('subscriptions')
export class SubscriptionController {
  public constructor(private readonly service: SubscriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user subscriptions' })
  @ApiOkResponse({ type: [SubscriptionRdo] })
  public find(@UserId(ParseUUIDPipe) userId: string): Promise<Subscription[]> {
    return this.service.findBySubscriberId(userId);
  }

  @Post(':authorId')
  @ApiOperation({
    summary:
      'Subscribe to an author; repeated requests return the same subscription',
  })
  @ApiCreatedResponse({ type: SubscriptionRdo })
  @ApiNotFoundResponse({ type: HttpErrorRdo, description: 'Author not found' })
  public subscribe(
    @UserId(ParseUUIDPipe) userId: string,
    @Param('authorId', ParseUUIDPipe) authorId: string,
  ): Promise<Subscription> {
    return this.service.subscribe(userId, authorId);
  }

  @Delete(':authorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unsubscribe from an author' })
  @ApiNoContentResponse({ description: 'Subscription removed' })
  public unsubscribe(
    @UserId(ParseUUIDPipe) userId: string,
    @Param('authorId', ParseUUIDPipe) authorId: string,
  ): Promise<void> {
    return this.service.unsubscribe(userId, authorId);
  }
}
