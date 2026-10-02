import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  NotificationRabbitRouting,
  type PublicationPublishedEvent,
} from '@project/shared-types';
import { lastValueFrom } from 'rxjs';

export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';

@Injectable()
export class PublicationNotificationPublisher {
  public constructor(
    @Inject(NOTIFICATION_CLIENT) private readonly client: ClientProxy,
  ) {}

  public async publishPublicationPublished(
    event: PublicationPublishedEvent,
  ): Promise<void> {
    await lastValueFrom(
      this.client.emit(NotificationRabbitRouting.PublicationPublished, event),
    );
  }
}
