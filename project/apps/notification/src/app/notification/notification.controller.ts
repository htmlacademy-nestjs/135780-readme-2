import { HttpErrorRdo } from '@project/shared-api';
import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiServiceUnavailableResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  NotificationService,
  type SendNotificationResult,
} from './notification.service';
import { NotificationResultRdo } from '@project/shared-api';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  public constructor(private readonly service: NotificationService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send digest of new publications to registered users',
  })
  @ApiOkResponse({
    type: NotificationResultRdo,
    description: 'Recipient and publication counts',
  })
  @ApiConflictResponse({
    type: HttpErrorRdo,
    description: 'Delivery is already running',
  })
  @ApiServiceUnavailableResponse({
    type: HttpErrorRdo,
    description: 'Email delivery failed; pending recipients can be retried',
  })
  public send(): Promise<SendNotificationResult> {
    return this.service.sendPending();
  }
}
