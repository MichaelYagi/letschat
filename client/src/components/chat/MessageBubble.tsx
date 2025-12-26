import { useState } from 'react';
import { Message } from '../types/chat';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Download,
  File as FileIcon,
  Image,
  Check,
  CheckCheck,
  MoreHorizontal,
} from 'lucide-react';
import { MessageReactions } from './MessageReactions';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  isRead?: boolean;
  onEdit?: (messageId: string, content: string) => void;
  onDelete?: (messageId: string) => void;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onRemoveReaction?: (messageId: string, emoji: string) => void;
  onReadReceipt?: (messageId: string) => void;
  currentUserId?: string;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = false,
  isRead = false,
  onEdit,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  onReadReceipt,
  currentUserId,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
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
    <div
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 message-appear`}
    >
      {!isOwn && showAvatar && (
        <div className='flex-shrink-0 mr-3'>
          <div className='w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium hover-lift'>
            {message.sender?.displayName?.[0] ||
              message.sender?.username?.[0] ||
              '?'}
          </div>
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : ''}`}>
        <div
          className={`px-4 py-2 rounded-lg transition-all duration-200 hover-scale ${
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
                {message.replyTo?.sender?.username || 'Unknown'}
              </div>
              <div className='truncate'>{message.replyTo.content}</div>
            </div>
          )}

          {message.contentType === 'file' && message.fileData ? (
            <div className='bg-gray-50 rounded-lg p-3'>
              <div className='flex items-center space-x-3'>
                {message.fileData.mimeType?.startsWith('image/') ? (
                  <div className='flex-shrink-0'>
                    {message.fileData.thumbnailUrl ? (
                      <img
                        src={message.fileData.thumbnailUrl}
                        alt={message.fileData.filename}
                        className='w-12 h-12 rounded object-cover'
                      />
                    ) : (
                      <Image size={48} className='text-gray-400' />
                    )}
                  </div>
                ) : (
                  <div className='flex-shrink-0'>
                    <FileIcon size={48} className='text-gray-400' />
                  </div>
                )}

                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-gray-900 truncate'>
                    {message.fileData.filename}
                  </p>
                  <p className='text-sm text-gray-500'>
                    {message.fileData.fileSize &&
                      typeof message.fileData.fileSize === 'number' &&
                      (message.fileData.fileSize / 1024 / 1024).toFixed(2) +
                        ' MB'}
                  </p>
                </div>

                <a
                  href={message.fileData.downloadUrl}
                  download={message.fileData.filename}
                  className='flex-shrink-0 p-2 text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full'
                  title='Download file'
                >
                  <Download size={16} />
                </a>
              </div>
            </div>
          ) : (
            <p className='whitespace-pre-wrap break-words'>{message.content}</p>
          )}

          {message.isEdited && (
            <span className='text-xs italic opacity-75 ml-1'>(edited)</span>
          )}
        </div>

        {/* Message footer with status */}
        <div
          className={`flex items-center mt-1 text-xs ${
            isOwn ? 'justify-end' : 'justify-start'
          }`}
        >
          {!isOwn && showAvatar && (
            <span className='font-medium text-gray-600 mr-2'>
              {message.sender?.displayName ||
                message.sender?.username ||
                'Unknown'}
            </span>
          )}

          <div
            className={`flex items-center space-x-1 ${
              isOwn ? 'text-gray-500' : 'text-gray-400'
            }`}
          >
            {showTimestamp && (
              <span title={format(new Date(message.timestamp), 'PPpp')}>
                {formatDistanceToNow(new Date(message.timestamp), {
                  addSuffix: true,
                })}
              </span>
            )}

            {isOwn && (
              <div
                className='flex items-center ml-1 cursor-pointer'
                onClick={() => onReadReceipt?.(message.id)}
              >
                {message.deliveryStatus === 'read' || isRead ? (
                  <CheckCheck size={14} className='text-blue-500' />
                ) : message.deliveryStatus === 'delivered' ? (
                  <CheckCheck size={14} className='text-gray-500' />
                ) : (
                  <Check size={14} className='text-gray-400' />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message Reactions */}
        <div className='mt-2'>
          <MessageReactions
            message={message}
            onAddReaction={onAddReaction || (() => {})}
            onRemoveReaction={onRemoveReaction || (() => {})}
            currentUserId={currentUserId || ''}
          />
        </div>

        {/* Message Actions Menu */}
        {isOwn && (
          <div className='mt-1 flex justify-end'>
            <button
              onClick={() => setShowActions(!showActions)}
              className='text-gray-400 hover:text-gray-600 p-1 rounded'
              title='More actions'
            >
              <MoreHorizontal size={16} />
            </button>

            {showActions && (
              <div className='absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10'>
                {onEdit && (
                  <button
                    onClick={() => {
                      onEdit(message.id, message.content);
                      setShowActions(false);
                    }}
                    className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      onDelete(message.id);
                      setShowActions(false);
                    }}
                    className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50'
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {isOwn && showAvatar && (
        <div className='flex-shrink-0 ml-3 order-3'>
          <div className='w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-medium'>
            {message.sender?.displayName?.[0] ||
              message.sender?.username?.[0] ||
              '?'}
          </div>
        </div>
      )}
    </div>
  );
}
