export type User = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  bio: string;
  role: 'penulis' | 'pembaca';
  followers: number;
  following: number;
};

export type Book = {
  id: string;
  title: string;
  author: User;
  genre: string;
  synopsis: string;
  coverUrl: string;
  viewCount: number;
  downloadCount: number;
  content?: string;
};

export type Comment = {
  id: string;
  user: User;
  text: string;
  timestamp: string;
  replies: Comment[];
};

export type Message = {
  id: string;
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
