import { PublicationType } from './publication.interface.js';

export const NotificationRabbitRouting = {
  UserRegistered: 'user.registered',
  PublicationPublished: 'publication.published',
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
