export interface User {
  id: string;
  email: string;
  name: string;
  avatarId?: string;
  createdAt: Date;
}

export interface UserDetail extends User {
  publicationCount: number;
  subscriberCount: number;
}
