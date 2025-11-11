export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  profilePic?: string;
  lastSeen?: Date;
  orgRole?: string;
  id?: string;
}

export interface ChatMember {
  id: string;
  name: string;
  email: string;
  profilePic: string;
  avatar?: string;
  addedBy?: User;
  addedAt: Date;
  role: "member" | "admin";
  orgRole: string;
  lastSeen?: Date;
}

export interface Message {
  _id: string;
  messageId?: string;
  content: string;
  sender: User;
  chat: string;
  readBy: Array<{
    user: User;
    readAt: string;
  }>;
  deletedFor: string[];
  reactions: Array<{
    user: User;
    emoji: string;
  }>;
  mentions?: Array<{
    _id: string;
    name: string;
  }>;
  replyTo?: string;
  replyToMessage?: Message;
  pinned?: boolean;
  isPinned?: boolean;
  pinnedAt?: string;
  pinnedBy?: User;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'attachment';
  attachments: Array<{
    url: string;
    public_id: string;
    fileType: string;
    fileName?: string;
    fileSize?: number;
  }>;
  createdAt: Date | string;
  updatedAt: Date | string;
  id?: string;
}

export interface Chat {
  _id: string;
  name?: string;
  isGroup: boolean;
  groupChat?: boolean;
  members: ChatMember[];
  admin?: User;
  lastMessage?: Message;
  pinnedMessages?: string[];
  pinnedMessagesList?: Message[];
  avatar?: string;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  unreadCount?: number;
  id?: string;
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

export interface MessageSearchFilters {
  query: string;
  sender?: string;
  dateFrom?: string;
  dateTo?: string;
  messageType?: string;
}

export interface MessageSearchResult {
  messages: Message[];
  totalCount: number;
  page: number;
  totalPages: number;
}

export interface UserSearchResult {
  users: User[];
  totalCount: number;
}

export interface MentionSuggestion {
  _id: string;
  name: string;
  avatar?: string;
}

export interface ChatState {
  messages: Message[];
  groupedMessages: { [key: string]: Message[] };
  dateGroups: string[];
  pinnedMessages: Message[];
  onlineUsers: string[];
  typingUsers: string[];
  searchResults: MessageSearchResult | null;
  isSearching: boolean;
  isLoadingMessages: boolean;
  isLoadingPinned: boolean;
}

export interface Reaction {
  emoji: string;
  userId: string;
  user?: User;
}