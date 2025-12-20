export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  content: string;
  contentType: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  isOwn: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  replyTo?: {
    id: string;
    content: string;
    sender: {
      username: string;
    };
  };
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: Array<{
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen?: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: string;
  };
  unreadCount?: number;
  isActive?: boolean;
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  replyToId?: string;
}
