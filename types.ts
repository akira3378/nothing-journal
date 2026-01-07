
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
  avatarUrl?: string;
  jobTags: string[];
  createdAt: number;
  country?: string;
  city?: string;
}

export interface SiteConfig {
  logoUrl?: string; // Added dynamic logo support
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user?: User;
  content: string;
  createdAt: number;
  parentId?: string; // New: For nested replies
  replies?: Comment[]; // New: For UI nesting
}

export interface Post {
  id: string;
  userId: string;
  title?: string;
  content: string;
  imageUrls?: string[]; // Updated to support multiple images
  location?: string;
  entryDate?: number;
  isPublished?: boolean;
  createdAt: number;
  likes: number;
  isLikedByCurrentUser?: boolean;
  commentsCount?: number;
}

export enum NotificationType {
  COMMENT = 'COMMENT',
  SYSTEM = 'SYSTEM'
}

export interface Notification {
  id: string;
  userId: string; // Receiver
  triggerUserId?: string; // Sender (e.g. commenter)
  triggerUser?: Partial<User>; // Updated to allow Partial User
  type: NotificationType;
  content: string;
  relatedPostId?: string;
  relatedCommentId?: string;
  isRead: boolean;
  createdAt: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  token: string | null;
}

// Mocking Backend Response shapes
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
