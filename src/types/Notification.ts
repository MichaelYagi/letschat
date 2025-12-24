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

export interface CreateNotificationRequest {
  userId: string;
  type: 'message' | 'connection_request' | 'mention' | 'system';
  title: string;
  message: string;
  data?: any;
}

export interface NotificationWithProfile extends Notification {
  user?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface NotificationCount {
  total: number;
  messages: number;
  connection_requests: number;
  mentions: number;
  system: number;
}

export interface NotificationEvent {
  type: 'notification';
  notification: Notification;
}

export interface NotificationReadEvent {
  type: 'notification_read';
  notificationId: string;
}
