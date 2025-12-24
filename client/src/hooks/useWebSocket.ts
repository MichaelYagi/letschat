import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '../types/chat';
import { Notification, NotificationCount } from '../types/notifications';
import { useAuth } from '../contexts/AuthContext';

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  messages: Message[];
  typingUsers: Set<string>;
  notifications: Notification[];
  notificationCounts: NotificationCount;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string
  ) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
  sendCallMessage: (message: any) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCounts, setNotificationCounts] =
    useState<NotificationCount>({
      total: 0,
      messages: 0,
      connection_requests: 0,
      mentions: 0,
      system: 0,
    });
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token) return;

    const newSocket = io('/', {
      auth: {
        token,
      },
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    });

    newSocket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('message_updated', (message: Message) => {
      setMessages(prev => prev.map(m => (m.id === message.id ? message : m)));
    });

    newSocket.on('message_deleted', (data: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    });

    newSocket.on('message_reaction', (reactionData: any) => {
      setMessages(prev =>
        prev.map(m => {
          if (m.id === reactionData.messageId) {
            return {
              ...m,
              reactions: reactionData.reactions || [],
            };
          }
          return m;
        })
      );
    });

    newSocket.on('message_read', (readData: any) => {
      setMessages(prev =>
        prev.map(m => {
          if (m.id === readData.messageId) {
            return {
              ...m,
              isRead: true,
            };
          }
          return m;
        })
      );
    });

    newSocket.on('conversation_read', (conversationReadData: any) => {
      setMessages(prev =>
        prev.map(m => {
          if (
            m.conversationId === conversationReadData.conversationId &&
            m.senderId !== user?.id
          ) {
            return {
              ...m,
              isRead: true,
            };
          }
          return m;
        })
      );
    });

    newSocket.on('delivery_status_updated', (deliveryData: any) => {
      setMessages(prev =>
        prev.map(m => {
          if (m.id === deliveryData.messageId) {
            return {
              ...m,
              deliveryStatus: deliveryData.status,
            };
          }
          return m;
        })
      );
    });

    newSocket.on(
      'typing',
      (
        typingEvents: Array<{
          conversationId: string;
          userId: string;
          isTyping: boolean;
        }>
      ) => {
        setTypingUsers(() => {
          const newTyping = new Set<string>();
          typingEvents.forEach(event => {
            if (event.isTyping && event.userId !== user?.id) {
              newTyping.add(event.userId);
            }
          });
          return newTyping;
        });
      }
    );

    newSocket.on(
      'user_status_changed',
      (statusData: { userId: string; status: string; lastSeen: string }) => {
        console.log('User status changed:', statusData);
      }
    );

    newSocket.on('new_notification', (data: { notification: Notification }) => {
      setNotifications(prev => [data.notification, ...prev.slice(0, 19)]);
      setNotificationCounts(prev => ({
        ...prev,
        total: prev.total + 1,
        [data.notification.type.replace('_', '_') as keyof NotificationCount]:
          prev[
            data.notification.type.replace('_', '_') as keyof NotificationCount
          ] + 1,
      }));
    });

    newSocket.on('notification_count_update', (counts: NotificationCount) => {
      setNotificationCounts(counts);
    });

    newSocket.on(
      'notification_marked_read',
      (data: { notificationId: string }) => {
        setNotifications(prev =>
          prev.map(n =>
            n.id === data.notificationId
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
      }
    );

    newSocket.on('all_notifications_marked_read', (data: { count: number }) => {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      );
      setNotificationCounts({
        total: 0,
        messages: 0,
        connection_requests: 0,
        mentions: 0,
        system: 0,
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, user?.id]);

  const sendMessage = useCallback(
    (conversationId: string, content: string, replyToId?: string) => {
      if (!socket) return;

      socket.emit('send_message', {
        conversationId,
        content,
        replyToId,
      });
    },
    [socket]
  );

  const joinConversation = useCallback(
    (conversationId: string) => {
      if (!socket) return;
      socket.emit('join_conversation', { conversationId });
    },
    [socket]
  );

  const leaveConversation = useCallback(
    (conversationId: string) => {
      if (!socket) return;
      socket.emit('leave_conversation', { conversationId });
    },
    [socket]
  );

  const sendTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!socket) return;
      socket.emit('typing', { conversationId, isTyping });
    },
    [socket]
  );

  const sendCallMessage = (message: any) => {
    if (socket && connected) {
      socket.emit('call-signal', message);
    }
  };

  const markNotificationRead = useCallback(
    (notificationId: string) => {
      if (!socket) return;
      socket.emit('mark_notification_read', { notificationId });
    },
    [socket]
  );

  const markAllNotificationsRead = useCallback(() => {
    if (!socket) return;
    socket.emit('mark_all_notifications_read');
  }, [socket]);

  return {
    socket,
    connected,
    messages,
    typingUsers,
    notifications,
    notificationCounts,
    sendMessage,
    joinConversation,
    leaveConversation,
    sendTyping,
    sendCallMessage,
    markNotificationRead,
    markAllNotificationsRead,
  };
}
