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
  isRead?: boolean;
  deliveryStatus?: 'sent' | 'delivered' | 'read' | 'failed';
  reactions?: Array<{
    emoji: string;
    count: number;
    currentUserReacted: boolean;
  }>;
  fileData?: {
    id: string;
    filename: string;
    mimeType: string;
    fileSize: number;
    downloadUrl: string;
    thumbnailUrl?: string | null;
  };
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

export interface MessageReactionRequest {
  messageId: string;
  emoji: string;
  conversationId: string;
}

export interface MessageReactionEvent {
  messageId: string;
  emoji: string;
  userId: string;
  action: 'add' | 'remove';
  reactions?: Array<{
    emoji: string;
    count: number;
    currentUserReacted: boolean;
  }>;
}

export interface MessageReadEvent {
  messageId: string;
  userId: string;
  timestamp: string;
}

export interface ConversationReadEvent {
  conversationId: string;
  userId: string;
  timestamp: string;
}

export interface DeliveryStatusEvent {
  messageId: string;
  userId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}
