import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string;
  uid: string;
  username: string;
  bio: string;
  role: 'penulis' | 'pembaca' | 'admin';
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
  favoriteCount: number;
  chapterCount: number;
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

export interface ChatParticipant {
  uid: string;
  displayName: string;
  photoURL: string;
}

export type Chat = {
  id: string;
  participants: ChatParticipant[];
  participantUids: string[];
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
  unreadCounts?: { [key: string]: number };
};

export type ChatMessage = {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp;
};

export type Notification = {
  id: string;
  type: 'comment' | 'follow' | 'favorite';
  text: string;
  link: string;
  actor: {
    uid: string;
    displayName: string;
    photoURL: string;
  };
  read: boolean;
  createdAt: Timestamp;
};

export type AiChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type Favorite = {
    id: string; // This will be the bookId
    userId: string;
    addedAt: Timestamp;
};

export type Follow = {
    id: string; // This will be the user id of the person being followed/the follower
    userId: string;
    followedAt: Timestamp;
};
