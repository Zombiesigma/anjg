import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  uid: string;
  username: string;
  bio: string;
  role: 'penulis' | 'pembaca';
  followers: number;
  following: number;
  photoURL: string;
  displayName: string;
  email: string;
};

export type Book = {
  id: string;
  title: string;
  genre: string;
  synopsis: string;
  coverUrl: string;
  viewCount: number;
  downloadCount: number;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  status: 'draft' | 'published';
};

export type Chapter = {
    id: string;
    title: string;
    content: string;
    order: number;
    createdAt: Timestamp;
};

export type Comment = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  createdAt: Timestamp;
};

export type AuthorRequest = {
  id: string;
  userId: string;
  name: string;
  email: string;
  portfolio?: string;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
};

export type Message = {
  id:string;
  sender: User;
  text: string;
  timestamp: string;
};

export type ChatThread = {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
};

export type Notification = {
  id: string;
  type: 'comment' | 'follow' | 'new_book' | 'message';
  user: User;
  text: string;
  timestamp: string;
  read: boolean;
};

export type AiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};
