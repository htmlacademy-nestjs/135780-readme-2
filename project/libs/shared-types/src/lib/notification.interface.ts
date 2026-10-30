import { PublicationType } from './publication.interface.js';

export const NotificationRabbitRouting = {
  UserRegistered: 'user.registered',
  PublicationPublished: 'publication.published',
  PublicationChanged: 'publication.changed',
  PublicationWithdrawn: 'publication.withdrawn',
} as const;

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  name: string;
}

export interface PublicationPublishedEvent {
  publicationId: string;
  authorId: string;
  type: PublicationType;
  title?: string;
  publishedAt: string;
}

export interface PublicationWithdrawnEvent {
  publicationId: string;
}

export interface PublicationNotificationEvent {
  pattern:
    | typeof NotificationRabbitRouting.PublicationPublished
    | typeof NotificationRabbitRouting.PublicationChanged
    | typeof NotificationRabbitRouting.PublicationWithdrawn;
  payload: PublicationPublishedEvent | PublicationWithdrawnEvent;
}
