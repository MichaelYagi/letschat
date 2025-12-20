import React, { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuth } from '@/contexts/AuthContext';
import { Phone, Video, Info } from 'lucide-react';

interface ChatPageProps {
  conversationId: string;
  conversationName?: string;
}

export function ChatPage({ conversationId, conversationName }: ChatPageProps) {
  const { user } = useAuth();
  const {
    messages,
    connected,
    sendMessage,
    joinConversation,
    sendTyping,
    typingUsers,
  } = useWebSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  useEffect(() => {
    if (connected && conversationId) {
      joinConversation(conversationId);
      setIsLoading(false);
    }
  }, [connected, conversationId, joinConversation]);

  const handleSendMessage = (content: string) => {
    sendMessage(conversationId, content);
  };

  const handleTyping = (isTyping: boolean) => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (isTyping) {
      const timeout = setTimeout(() => {
        sendTyping(conversationId, false);
      }, 1000);
      setTypingTimeout(timeout);
      sendTyping(conversationId, true);
    } else {
      sendTyping(conversationId, false);
    }
  };

  const getTypingIndicator = () => {
    if (typingUsers.size === 0) return '';

    const users = Array.from(typingUsers);
    if (users.length === 1) {
      return 'Someone is typing...';
    } else if (users.length === 2) {
      return 'Two people are typing...';
    } else {
      return 'Several people are typing...';
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
                  `Conversation ${conversationId.slice(0, 8)}`}
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
        messages={messages.filter(m => m.conversationId === conversationId)}
        currentUser={user!}
        loading={isLoading}
      />

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className='px-4 py-2 bg-gray-50 text-sm text-gray-500 italic'>
          {getTypingIndicator()}
        </div>
      )}

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
        disabled={!connected}
      />
    </div>
  );
}
