import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useNotifications } from '../../hooks/useNotifications';
import { useSoundNotifications } from '../../hooks/useSoundNotifications';
import { useAuth } from '../../contexts/AuthContext';
import { Phone, Video, Info } from 'lucide-react';
import api from '../../services/api';

interface ChatPageProps {
  conversationName?: string;
  onClose?: () => void;
}

export function ChatPage({ conversationName }: ChatPageProps) {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const {
    messages,
    connected,
    sendMessage,
    joinConversation,
    sendTyping,
    typingUsers,
  } = useWebSocket();

  const { addNotification } = useNotifications();
  const { playNotificationSound } = useSoundNotifications();

  // Convert typingUsers Set to array of user objects
  const typingUsersArray = Array.from(typingUsers).map(userId => ({
    id: userId,
    username: `User${userId.slice(0, 4)}`, // In real app, get from user list
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    if (connected && conversationId) {
      joinConversation(conversationId);
      setIsLoading(false);
      markConversationAsRead();
    }
  }, [connected, conversationId]);

  // Show notification for new messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.senderId !== user?.id &&
      !document.hasFocus()
    ) {
      addNotification({
        id: Date.now(),
        type: 'message',
        title: `New message from ${conversationName}`,
        content: lastMessage.content,
        timestamp: new Date(),
      });
      playNotificationSound();
    }
  }, [messages, user?.id, conversationName]);

  const handleSendMessage = (content: string) => {
    if (conversationId) {
      sendMessage(conversationId, content);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (isTyping && conversationId) {
      const timeout = setTimeout(() => {
        sendTyping(conversationId, false);
      }, 1000);
      setTypingTimeout(timeout);
      sendTyping(conversationId, true);
    } else if (conversationId) {
      sendTyping(conversationId, false);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await api.post('/messages/reactions', {
        messageId,
        emoji,
        conversationId,
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async (messageId: string, emoji: string) => {
    try {
      await api.delete('/messages/reactions', {
        data: { messageId, emoji, conversationId },
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await api.post('/messages/read-receipts', {
        messageId,
        conversationId,
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markConversationAsRead = async () => {
    try {
      await api.post('/messages/mark-read', {
        conversationId,
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  return (
    <div className='flex flex-col h-full'>
      {/* Chat Header */}
      <div className='border-b border-gray-200 bg-white px-4 py-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <div className='w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium mr-3'>
              {conversationName?.[0] || '#'}
            </div>
            <div>
              <h2 className='text-lg font-semibold text-gray-900'>
                {conversationName ||
                  (conversationId &&
                    `Conversation ${conversationId.slice(0, 8)}`) ||
                  'Chat'}
              </h2>
              <p className='text-sm text-gray-500'>
                {connected ? 'Connected' : 'Connecting...'}
              </p>
            </div>
          </div>

          <div className='flex items-center space-x-2'>
            <button className='p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full'>
              <Phone size={20} />
            </button>
            <button className='p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full'>
              <Video size={20} />
            </button>
            <button className='p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full'>
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <MessageList
        messages={messages.filter(
          m => conversationId && m.conversationId === conversationId
        )}
        currentUser={user!}
        loading={isLoading}
        onAddReaction={handleAddReaction}
        onRemoveReaction={handleRemoveReaction}
        onReadReceipt={markAsRead}
      />

      {/* Enhanced Typing Indicator */}
      {conversationId && <TypingIndicator users={typingUsersArray} />}

      {/* Message Input */}
      {conversationId && (
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!connected}
        />
      )}
    </div>
  );
}
