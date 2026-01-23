import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  uid: string;
  name: string;
  username: string;
  avatarUrl: string;
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
  content?: string;
};

export type Comment = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  createdAt: Timestamp;
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
