import { useState } from 'react';
import { Message } from '../types/chat';

interface MessageReactionsProps {
  message: Message;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  currentUserId: string;
}

const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡'];

export function MessageReactions({
  message,
  onAddReaction,
  onRemoveReaction,
  currentUserId,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (emoji: string) => {
    const existingReaction = message.reactions?.find(r => r.emoji === emoji);

    if (existingReaction && existingReaction.currentUserReacted) {
      onRemoveReaction(message.id, emoji);
    } else {
      onAddReaction(message.id, emoji);
    }
    setShowEmojiPicker(false);
  };

  const handleReactionClick = (emoji: string) => {
    const existingReaction = message.reactions?.find(r => r.emoji === emoji);

    if (existingReaction && existingReaction.currentUserReacted) {
      onRemoveReaction(message.id, emoji);
    } else {
      onAddReaction(message.id, emoji);
    }
  };

  if (!message.reactions || message.reactions.length === 0) {
    return (
      <div className='flex items-center mt-2'>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className='text-gray-400 hover:text-gray-600 text-sm transition-colors'
          title='Add reaction'
        >
          😊
        </button>

        {showEmojiPicker && (
          <div className='absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 mt-1'>
            <div className='grid grid-cols-6 gap-1'>
              {COMMON_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiClick(emoji)}
                  className='text-lg hover:bg-gray-100 rounded p-1 transition-colors'
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='flex items-center mt-2 space-x-2'>
      {message.reactions.map(reaction => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction.emoji)}
          className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-all duration-200 hover-scale reaction-appear ${
            reaction.currentUserReacted
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
          }`}
          title={`${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted with ${reaction.emoji}`}
        >
          <span>{reaction.emoji}</span>
          <span className='font-medium'>{reaction.count}</span>
        </button>
      ))}

      <button
        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        className='text-gray-400 hover:text-gray-600 text-sm transition-colors'
        title='Add reaction'
      >
        😊
      </button>

      {showEmojiPicker && (
        <div className='absolute z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 mt-1'>
          <div className='grid grid-cols-6 gap-1'>
            {COMMON_EMOJIS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className='text-lg hover:bg-gray-100 rounded p-1 transition-colors'
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
