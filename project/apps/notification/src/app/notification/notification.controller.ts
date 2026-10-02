import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiConflictResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationService, type SendNotificationResult } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  public constructor(private readonly service: NotificationService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send digest of new publications to registered users' })
  @ApiOkResponse({ description: 'Recipient and publication counts' })
  @ApiConflictResponse({ description: 'Delivery is already running' })
  public send(): Promise<SendNotificationResult> {
    return this.service.sendPending();
  }
}
