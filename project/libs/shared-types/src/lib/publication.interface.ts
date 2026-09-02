export enum PublicationType {
  Video = 'video',
  Text = 'text',
  Quote = 'quote',
  Photo = 'photo',
  Link = 'link',
}

export enum PublicationStatus {
  Published = 'published',
  Draft = 'draft',
}

export enum PublicationSort {
  PublishedAt = 'publishedAt',
  Likes = 'likes',
  Comments = 'comments',
}

export interface Publication {
  id: string;
  authorId: string;
  type: PublicationType;
  status: PublicationStatus;
  createdAt: Date;
  publishedAt: Date;
  tags: string[];
  likeCount: number;
  commentCount: number;
  isRepost: boolean;
  originalPublicationId?: string;
  originalAuthorId?: string;
  title?: string;
  videoUrl?: string;
  announcement?: string;
  text?: string;
  quoteAuthor?: string;
  photoId?: string;
  linkUrl?: string;
  description?: string;
}
