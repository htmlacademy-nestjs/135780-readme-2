import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OutboxRelay, OUTBOX_SETTINGS } from '@project/shared-api';
import { lastValueFrom, timeout } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export const NOTIFICATION_CLIENT = 'NOTIFICATION_CLIENT';

@Injectable()
export class PublicationNotificationPublisher extends OutboxRelay {
  public constructor(
    @Inject(NOTIFICATION_CLIENT) client: ClientProxy,
    prisma: PrismaService,
  ) {
    super(async () => {
      const pending = await prisma.outboxEvent.findMany({
        orderBy: { id: 'asc' },
        take: OUTBOX_SETTINGS.batchSize,
      });
      for (const event of pending) {
        await lastValueFrom(
          client
            .emit(event.pattern, event.payload)
            .pipe(timeout(OUTBOX_SETTINGS.deliveryTimeout)),
        );
        await prisma.outboxEvent.deleteMany({ where: { id: event.id } });
      }
    });
  }
}
