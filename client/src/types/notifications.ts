export interface Notification {
  id: string;
  user_id: string;
  type: 'message' | 'connection_request' | 'mention' | 'system';
  title: string;
  message: string;
  data?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationCount {
  total: number;
  messages: number;
  connection_requests: number;
  mentions: number;
  system: number;
}

export interface NotificationData {
  connectionId?: string;
  requesterName?: string;
  type?: string;
  conversationId?: string;
  senderName?: string;
  mentionerName?: string;
  [key: string]: any;
}

export interface NotificationEvent {
  type: 'notification';
  notification: Notification;
}

export interface NotificationCountUpdateEvent {
  type: 'notification_count_update';
  counts: NotificationCount;
}
