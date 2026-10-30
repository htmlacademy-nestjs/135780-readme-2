import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationRabbitRouting } from '@project/shared-types';
import { OutboxRelay, OUTBOX_SETTINGS } from '@project/shared-api';
import { lastValueFrom, timeout } from 'rxjs';
import { USER_REPOSITORY, type UserRepository } from '../user/user.repository';

export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';

@Injectable()
export class AccountNotificationPublisher extends OutboxRelay {
  public constructor(
    @Inject(NOTIFICATION_CLIENT) client: ClientProxy,
    @Inject(USER_REPOSITORY) repository: UserRepository,
  ) {
    super(async () => {
      const pending = await repository.findPendingNotifications(
        OUTBOX_SETTINGS.batchSize,
      );
      for (const event of pending) {
        await lastValueFrom(
          client
            .emit(NotificationRabbitRouting.UserRegistered, event)
            .pipe(timeout(OUTBOX_SETTINGS.deliveryTimeout)),
        );
        await repository.markNotificationPublished(event.userId);
      }
    });
  }
}
