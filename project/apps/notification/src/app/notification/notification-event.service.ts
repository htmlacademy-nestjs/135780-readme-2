import { Injectable } from '@nestjs/common';
import type {
  PublicationPublishedEvent,
  UserRegisteredEvent,
} from '@project/shared-types';
import { SubscriberRepository } from '../subscriber/subscriber.repository';
import { NotificationPublicationRepository } from '../notification-publication/notification-publication.repository';

@Injectable()
export class NotificationEventService {
  public constructor(
    private readonly subscribers: SubscriberRepository,
    private readonly publications: NotificationPublicationRepository,
  ) {}
  public registerUser(event: UserRegisteredEvent): Promise<void> {
    return this.subscribers.save(event);
  }
  public publish(event: PublicationPublishedEvent): Promise<void> {
    return this.publications.save(event);
  }
  public refresh(event: PublicationPublishedEvent): Promise<void> {
    return this.publications.refresh(event);
  }
  public withdraw(publicationId: string): Promise<void> {
    return this.publications.withdraw(publicationId);
  }
}
