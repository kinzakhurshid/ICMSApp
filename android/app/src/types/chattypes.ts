export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  profilePic?: string;
  lastSeen?: Date;
}

export interface Message {
  _id: string;
  messageId?: string;
  content: string;
  sender: User;
  chat: string;
  readBy: string[];
  deletedFor: string[];
  reactions: Reaction[];
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  attachments: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Chat {
  _id: string;
  name?: string;
  isGroup: boolean;
  groupChat?: boolean;
  members: User[];
  admin?: User;
  lastMessage?: Message;
  pinnedMessages?: Message[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  unreadCount?: number;
}

export interface ChatWithUnread extends Chat {
  unreadCount: number;
  lastUpdated: number;
}

export interface NewMessageAlertData {
  chatId: string;
  notification?: any;
  message?: Message;
  sender?: any;
  timestamp?: Date | string;
}export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  profilePic?: string;
  lastSeen?: Date;
}

export interface Message {
  _id: string;
  messageId?: string;
  content: string;
  sender: User;
  chat: string;
  readBy: string[];
  deletedFor: string[];
  reactions: Reaction[];
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  attachments: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Chat {
  _id: string;
  name?: string;
  isGroup: boolean;
  groupChat?: boolean;
  members: User[];
  admin?: User;
  lastMessage?: Message;
  pinnedMessages?: Message[];
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  unreadCount?: number;
}

export interface ChatWithUnread extends Chat {
  unreadCount: number;
  lastUpdated: number;
}

export interface NewMessageAlertData {
  chatId: string;
  notification?: any;
  message?: Message;
  sender?: any;
  timestamp?: Date | string;
}