import { useRef, useEffect } from 'react';
import { Message } from '../types/chat';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  currentUser: { id: string };
  loading?: boolean;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onReadReceipt?: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentUser,
  loading = false,
  onAddReaction,
  onRemoveReaction,
  onReadReceipt,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        lastMessageRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading && messages.length === 0) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className='flex-1 flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='text-4xl mb-4'>💬</div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No messages yet
          </h3>
          <p className='text-gray-600'>
            Start the conversation with a friendly message!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 overflow-y-auto bg-gray-50 p-4'>
      <div className='space-y-4 max-w-4xl mx-auto'>
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUser.id;
          const showAvatar =
            index === 0 || messages[index - 1]?.senderId !== message.senderId;

          // Group messages from same sender within 5 minutes
          const prevMessage = messages[index - 1];
          const showTimestamp =
            !prevMessage ||
            prevMessage.senderId !== message.senderId ||
            new Date(message.timestamp).getTime() -
              new Date(prevMessage.timestamp).getTime() >
              5 * 60 * 1000;

          return (
            <div
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
            >
              <MessageBubble
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                showTimestamp={showTimestamp}
                onAddReaction={onAddReaction}
                onRemoveReaction={onRemoveReaction}
                currentUserId={currentUser.id}
                onReadReceipt={onReadReceipt}
              />
            </div>
          );
        })}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
}
