import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import ConversationList from './conversations/ConversationList';
import ChatWindow from './chat/ChatWindow';
import './Chat.css';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  senderName?: string;
}

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participantIds: string[];
  participants?: Array<{
    id: string;
    username: string;
    displayName: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

const Chat: React.FC = () => {
  const { user, token } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, [token]);

  // Load conversation messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation && token) {
      loadConversationMessages(selectedConversation.id);

      // Join WebSocket room for this conversation
      if (socket && isConnected) {
        socket.emit('join_room', {
          conversationId: selectedConversation.id,
          userId: user?.id,
        });
      }
    }
  }, [selectedConversation, token, socket, isConnected, user?.id]);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (messageData: Message) => {
      if (
        selectedConversation &&
        messageData.conversationId === selectedConversation.id
      ) {
        setMessages(prev => [...prev, messageData]);
      }

      // Update last message in conversation list
      setConversations(prev =>
        prev.map(conv =>
          conv.id === messageData.conversationId
            ? {
                ...conv,
                lastMessage: {
                  content: messageData.content,
                  timestamp: messageData.timestamp,
                },
              }
            : conv
        )
      );
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/conversations', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setConversations(data.data);
      } else {
        setError(data.error || 'Failed to load conversations');
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load conversations'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessages(data.data);
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  };

  const sendMessage = async (content: string) => {
    if (!selectedConversation || !token) return;

    try {
      const response = await fetch('/api/messages/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content,
          contentType: 'text',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        // Message will be added via WebSocket event
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const createConversation = async (
    participantIds: string[],
    name?: string
  ) => {
    if (!token) return;

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: participantIds.length === 1 ? 'direct' : 'group',
          name,
          participantIds,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setConversations(prev => [data.data, ...prev]);
        setSelectedConversation(data.data);
      } else {
        setError(data.error || 'Failed to create conversation');
      }
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to create conversation'
      );
    }
  };

  return (
    <div className='chat-container'>
      <div className='chat-sidebar'>
        <ConversationList
          conversations={conversations}
          selectedConversation={selectedConversation}
          onSelectConversation={setSelectedConversation}
          onCreateConversation={createConversation}
          loading={loading}
          error={error}
        />
      </div>
      <div className='chat-main'>
        <ChatWindow
          conversation={selectedConversation}
          messages={messages}
          onSendMessage={sendMessage}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};

export default Chat;
