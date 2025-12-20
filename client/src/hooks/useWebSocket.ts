import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message } from '@/types/chat';
import { useAuth } from '@/contexts/AuthContext';

interface UseWebSocketReturn {
  socket: Socket | null;
  connected: boolean;
  messages: Message[];
  typingUsers: Set<string>;
  sendMessage: (
    conversationId: string,
    content: string,
    replyToId?: string
  ) => void;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendTyping: (conversationId: string, isTyping: boolean) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token) return;

    const newSocket = io('http://localhost:3000', {
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

    newSocket.on('message_received', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('message_updated', (message: Message) => {
      setMessages(prev => prev.map(m => (m.id === message.id ? message : m)));
    });

    newSocket.on('message_deleted', (data: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m.id !== data.messageId));
    });

    newSocket.on(
      'user_typing',
      (typingData: {
        conversationId: string;
        userId: string;
        username: string;
        isTyping: boolean;
      }) => {
        setTypingUsers(prev => {
          const newTyping = new Set(prev);
          if (typingData.isTyping && typingData.userId !== user?.id) {
            newTyping.add(typingData.userId);
          } else {
            newTyping.delete(typingData.userId);
          }
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
      const event = isTyping ? 'typing_start' : 'typing_stop';
      socket.emit(event, { conversationId });
    },
    [socket]
  );

  return {
    socket,
    connected,
    messages,
    typingUsers,
    sendMessage,
    joinConversation,
    leaveConversation,
    sendTyping,
  };
}
