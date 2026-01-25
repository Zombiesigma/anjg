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
  status?: 'online' | 'offline';
  lastSeen?: Timestamp;
  notificationPreferences?: {
    onNewFollower?: boolean;
    onBookComment?: boolean;
    onBookFavorite?: boolean;
    onStoryComment?: boolean;
  };
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
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  createdAt: Timestamp;
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
  username: string;
  userAvatarUrl: string;
  likeCount: number;
  replyCount: number;
  createdAt: Timestamp;
};

export type BookCommentLike = {
  id: string; // The userId
  userId: string;
  likedAt: Timestamp;
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
  username: string;
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

export type TextMessage = {
  id: string;
  type: 'text';
  text: string;
  senderId: string;
  createdAt: Timestamp;
};

export type BookShareMessage = {
  id: string;
  type: 'book_share';
  senderId: string;
  createdAt: Timestamp;
  book: {
    id: string;
    title: string;
    coverUrl: string;
    authorName: string;
  };
};

export type ChatMessage = (TextMessage | BookShareMessage) & {
  id: string;
  senderId: string;
  createdAt: Timestamp;
};


export type Notification = {
  id: string;
  type: 'comment' | 'follow' | 'favorite' | 'author_request' | 'story_comment' | 'broadcast';
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
  role: 'user' | 'model';
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

export type Story = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  createdAt: Timestamp;
  likes: number;
  commentCount: number;
  viewCount: number;
};

export type StoryComment = {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string;
  text: string;
  createdAt: Timestamp;
};

export type StoryLike = {
  id: string; // The userId
  userId: string;
  likedAt: Timestamp;
};

export type StoryView = {
  id: string; // The userId
  userId: string;
  userName: string;
  userAvatarUrl: string;
  viewedAt: Timestamp;
};
