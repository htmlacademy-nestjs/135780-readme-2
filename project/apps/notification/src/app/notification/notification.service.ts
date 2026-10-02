import { ConflictException, Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NotificationPublicationRepository } from '../notification-publication/notification-publication.repository';
import { SubscriberRepository } from '../subscriber/subscriber.repository';

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

      for (const recipient of recipients) {
        await this.mail.sendDigest(recipient.email, pending);
      }

      await this.publications.markNotified(
        pending.map((item) => item.publicationId),
      );

      return {
        recipientCount: recipients.length,
        publicationCount: pending.length,
      };
    } finally {
      this.sending = false;
    }
  }
}
