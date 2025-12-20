import React from 'react';
import { Message } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = false,
}: MessageBubbleProps) {
  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className='max-w-xs lg:max-w-md px-3 py-2 rounded-lg bg-gray-100 text-gray-500 text-sm italic'>
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isOwn && showAvatar && (
        <div className='flex-shrink-0 mr-3'>
          <div className='w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium'>
            {message.sender.displayName?.[0] || message.sender.username[0]}
          </div>
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : ''}`}>
        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          {message.replyTo && (
            <div
              className={`text-xs mb-1 p-2 rounded ${
                isOwn ? 'bg-primary-700' : 'bg-gray-100'
              }`}
            >
              <div className='font-medium'>
                {message.replyTo.sender.username}
              </div>
              <div className='truncate'>{message.replyTo.content}</div>
            </div>
          )}

          <p className='whitespace-pre-wrap break-words'>{message.content}</p>

          {message.isEdited && (
            <span className='text-xs italic opacity-75 ml-1'>(edited)</span>
          )}
        </div>

        {(showTimestamp || (!isOwn && showAvatar)) && (
          <div
            className={`flex items-center mt-1 text-xs text-gray-500 ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}
          >
            {!isOwn && showAvatar && (
              <span className='font-medium mr-2'>
                {message.sender.displayName || message.sender.username}
              </span>
            )}
            <span>
              {formatDistanceToNow(new Date(message.timestamp), {
                addSuffix: true,
              })}
            </span>
          </div>
        )}
      </div>

      {isOwn && showAvatar && (
        <div className='flex-shrink-0 ml-3 order-3'>
          <div className='w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium'>
            {message.sender.displayName?.[0] || message.sender.username[0]}
          </div>
        </div>
      )}
    </div>
  );
}
