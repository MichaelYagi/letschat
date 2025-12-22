interface TypingIndicatorProps {
  users: Array<{
    id: string;
    username: string;
    displayName?: string;
  }>;
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      const user = users[0];
      return `${user.displayName || user.username} is typing`;
    } else if (users.length === 2) {
      return `${users[0].displayName || users[0].username} and ${users[1].displayName || users[1].username} are typing`;
    } else {
      return `${users.length} people are typing`;
    }
  };

  return (
    <div className='flex items-center space-x-2 px-4 py-2 bg-gray-50 border-t border-gray-200'>
      <div className='flex space-x-1'>
        <div className='w-2 h-2 bg-gray-400 rounded-full typing-indicator-bounce'></div>
        <div className='w-2 h-2 bg-gray-400 rounded-full typing-indicator-bounce'></div>
        <div className='w-2 h-2 bg-gray-400 rounded-full typing-indicator-bounce'></div>
      </div>
      <span className='text-sm text-gray-500 italic'>{getTypingText()}</span>
    </div>
  );
}
