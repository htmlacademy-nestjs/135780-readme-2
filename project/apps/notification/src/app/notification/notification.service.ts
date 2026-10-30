import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificationPublicationRepository } from '../notification-publication/notification-publication.repository';
import { SubscriberRepository } from '../subscriber/subscriber.repository';
import type { SubscriberModel } from '../subscriber/subscriber.model';
import type { NotificationPublicationModel } from '../notification-publication/notification-publication.model';

export interface SendNotificationResult {
  recipientCount: number;
  publicationCount: number;
}

@Injectable()
export class NotificationService {
  private sending = false;

  public constructor(
    private readonly subscribers: SubscriberRepository,
    private readonly publications: NotificationPublicationRepository,
    private readonly mail: MailService,
  ) {}

  public async sendPending(): Promise<SendNotificationResult> {
    if (this.sending) {
      throw new ConflictException('Notification delivery is already running');
    }
    this.sending = true;

    try {
      const pending = await this.publications.findPending();
      if (pending.length === 0) {
        return { recipientCount: 0, publicationCount: 0 };
      }

      const recipients = await this.subscribers.findAll();
      if (recipients.length === 0) {
        return { recipientCount: 0, publicationCount: 0 };
      }

      let recipientCount = 0;
      let failedRecipientCount = 0;
      for (const recipient of recipients) {
        try {
          if (await this.sendToRecipient(recipient, pending)) {
            recipientCount += 1;
          }
        } catch {
          failedRecipientCount += 1;
        }
      }
      if (failedRecipientCount > 0) {
        throw new ServiceUnavailableException(
          'Some emails could not be delivered; retry the request',
        );
      }

      await this.publications.markNotified(
        pending.map((item) => item.publicationId),
      );

      return {
        recipientCount,
        publicationCount: pending.length,
      };
    } finally {
      this.sending = false;
    }
  }

  private async sendToRecipient(
    recipient: SubscriberModel,
    pending: NotificationPublicationModel[],
  ): Promise<boolean> {
    const unsent = pending.filter(
      (publication) => !publication.notifiedUserIds?.includes(recipient.userId),
    );
    if (unsent.length === 0) {
      return false;
    }
    await this.mail.sendDigest(recipient.email, unsent);
    await this.publications.markRecipientNotified(
      unsent.map((publication) => publication.publicationId),
      recipient.userId,
    );
    return true;
  }
}
