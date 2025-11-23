export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
  DELETED = 'DELETED',
}

export interface User {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  credentialUrl?: string; // Mock URL for the image
  jobTags: string[];
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string; // HTML or Text
  type: 'text' | 'image' | 'video';
  mediaUrl?: string;
  createdAt: number;
  isActive: boolean;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  location?: string;
  createdAt: number;
  likes: number;
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