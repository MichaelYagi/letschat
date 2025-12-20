export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: 'text' | 'image' | 'file' | 'system';
  encryptedContent?: string;
  signature?: string;
  replyToId?: string;
  threadId?: string;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  contentType?: 'text' | 'image' | 'file' | 'system';
  encryptedContent?: string;
  signature?: string;
  replyToId?: string;
  threadId?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  thumbnailPath?: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatarUrl?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateConversationRequest {
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatarUrl?: string;
  participantIds: string[];
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  lastReadAt: Date;
}

export interface AddParticipantRequest {
  conversationId: string;
  userIds: string[];
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'user_status' | 'conversation_update' | 'error';
  data: any;
  timestamp: Date;
  from?: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface UserStatusEvent {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
}

export interface ConversationUpdateEvent {
  conversationId: string;
  update: {
    name?: string;
    description?: string;
    avatarUrl?: string;
    participants?: ConversationParticipant[];
  };
}

export interface MessageEvent {
  message: Message;
  attachments?: MessageAttachment[];
}
