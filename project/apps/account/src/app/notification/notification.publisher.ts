import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  NotificationRabbitRouting,
  type UserRegisteredEvent,
} from '@project/shared-types';
import { lastValueFrom } from 'rxjs';

export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';

@Injectable()
export class AccountNotificationPublisher {
  public constructor(
    @Inject(NOTIFICATION_CLIENT) private readonly client: ClientProxy,
  ) {}

  public async publishUserRegistered(
    event: UserRegisteredEvent,
  ): Promise<void> {
    await lastValueFrom(
      this.client.emit(NotificationRabbitRouting.UserRegistered, event),
    );
  }
}
