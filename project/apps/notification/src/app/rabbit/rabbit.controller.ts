import { Controller, UseFilters } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationRabbitRouting } from '@project/shared-types';
import { NotificationEventService } from '../notification/notification-event.service';
import {
  PublicationPublishedMessage,
  PublicationWithdrawnMessage,
  UserRegisteredMessage,
} from './notification-message.dto';
import { NotificationMessagePipe } from './notification-message.pipe';
import { NotificationEventFilter } from './notification-event.filter';

@Controller()
@UseFilters(NotificationEventFilter)
export class RabbitController {
  public constructor(private readonly events: NotificationEventService) {}

  @EventPattern(NotificationRabbitRouting.UserRegistered)
  public async onUserRegistered(
    @Payload(new NotificationMessagePipe(UserRegisteredMessage))
    payload: UserRegisteredMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.events.registerUser(payload);
    this.acknowledge(context);
  }
  @EventPattern(NotificationRabbitRouting.PublicationPublished)
  public async onPublicationPublished(
    @Payload(new NotificationMessagePipe(PublicationPublishedMessage))
    payload: PublicationPublishedMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.events.publish(payload);
    this.acknowledge(context);
  }
  @EventPattern(NotificationRabbitRouting.PublicationChanged)
  public async onPublicationChanged(
    @Payload(new NotificationMessagePipe(PublicationPublishedMessage))
    payload: PublicationPublishedMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.events.refresh(payload);
    this.acknowledge(context);
  }
  @EventPattern(NotificationRabbitRouting.PublicationWithdrawn)
  public async onPublicationWithdrawn(
    @Payload(new NotificationMessagePipe(PublicationWithdrawnMessage))
    payload: PublicationWithdrawnMessage,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    await this.events.withdraw(payload.publicationId);
    this.acknowledge(context);
  }
  private acknowledge(context: RmqContext): void {
    context.getChannelRef().ack(context.getMessage());
  }
}
