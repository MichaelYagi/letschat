import { useState, useEffect } from 'react';
import { conversationsApi, usersApi } from '../../services/api';
import { MessageCircle, Users, Search, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  participant?: {
    username: string;

    status: string;
  } | null;
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface ConversationListProps {
  selectedConversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
}

export function ConversationList({
  selectedConversationId,
  onConversationSelect,
}: ConversationListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await conversationsApi.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await usersApi.searchUsers(query.trim());
      setSearchResults(response.users || []);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const startConversation = async (otherUserId: string) => {
    try {
      const response = await conversationsApi.createConversation({
        type: 'direct',
        participantIds: [otherUserId],
      });

      const newConversation = response.conversation;
      setConversations(prev => [newConversation, ...prev]);
      setShowUserSearch(false);
      setSearchQuery('');
      setSearchResults([]);

      if (onConversationSelect) {
        onConversationSelect(newConversation.id);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const formatLastMessage = (lastMessage: any) => {
    if (!lastMessage) return 'No messages';

    const senderName =
      lastMessage.senderId === user?.id
        ? 'You'
        : lastMessage.sender?.username || 'They';

    let content = '';
    if (lastMessage.contentType === 'file') {
      content = `📎 ${lastMessage.fileData?.filename || 'Shared a file'}`;
    } else {
      content =
        lastMessage.content.length > 35
          ? lastMessage.content.substring(0, 35) + '...'
          : lastMessage.content;
    }

    return `${senderName}: ${content}`;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Unnamed Group';
    } else if (conversation.participant) {
      return conversation.participant.username;
    }
    return 'Unknown';
  };

  const getStatusIndicator = (status: string) => {
    const colorClass = status === 'online' ? 'bg-green-500' : 'bg-gray-400';
    return <div className={`w-2 h-2 rounded-full ${colorClass}`} />;
  };

  if (loading) {
    return (
      <div className='p-4'>
        <div className='text-center text-gray-500'>
          Loading conversations...
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b border-gray-200 bg-white'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>Conversations</h2>
          <button
            onClick={() => setShowUserSearch(!showUserSearch)}
            className='p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors'
          >
            {showUserSearch ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>
      </div>

      {/* User Search */}
      {showUserSearch && (
        <div className='p-4 border-b border-gray-200 bg-gray-50'>
          <div className='relative'>
            <Search
              className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
              size={16}
            />
            <input
              type='text'
              placeholder='Search users...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            />
          </div>

          {searchLoading && (
            <div className='mt-2 text-center text-sm text-gray-500'>
              Searching...
            </div>
          )}

          {!searchLoading && searchResults.length > 0 && (
            <div className='mt-3 space-y-1'>
              <p className='text-xs text-gray-500 mb-2'>
                Click to start a conversation:
              </p>
              {searchResults.map(searchUser => (
                <div
                  key={searchUser.id}
                  onClick={() => startConversation(searchUser.id)}
                  className='p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors'
                >
                  <div className='flex items-center space-x-2'>
                    <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium'>
                      {searchUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {searchUser.username}
                      </p>
                      <p className='text-xs text-gray-500'>
                        @{searchUser.username}
                      </p>
                    </div>
                    <div className='text-xs text-green-600'>Start chat</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchLoading && searchQuery && searchResults.length === 0 && (
            <div className='mt-3 text-center text-sm text-gray-500'>
              No users found matching "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Conversation List */}
      <div className='flex-1 overflow-y-auto'>
        {conversations.length === 0 ? (
          <div className='p-4 text-center text-gray-500'>
            <MessageCircle className='w-8 h-8 mx-auto mb-2 text-gray-400' />
            <p>No conversations yet</p>
            <p className='text-sm'>Start a new conversation!</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => onConversationSelect?.(conversation.id)}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedConversationId === conversation.id
                    ? 'bg-primary-50 border-l-4 border-primary-600'
                    : ''
                }`}
              >
                <div className='flex items-center space-x-3'>
                  {/* Avatar */}
                  <div className='flex-shrink-0'>
                    {conversation.type === 'group' ? (
                      <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center'>
                        <Users size={20} className='text-gray-600' />
                      </div>
                    ) : conversation.participant &&
                      Array.isArray(conversation.participant) &&
                      conversation.participant.length > 0 ? (
                      <div className='w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium'>
                        {conversation.participant[0]?.username?.toUpperCase() ||
                          conversation.participant[0]?.username?.toUpperCase()}
                      </div>
                    ) : (
                      <div className='w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center'>
                        <span className='text-gray-600'>?</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <h3 className='font-medium text-gray-900 truncate'>
                          {getConversationName(conversation)}
                        </h3>
                        {conversation.type === 'direct' &&
                          conversation.participant && (
                            <div className='flex items-center'>
                              {getStatusIndicator(
                                conversation.participant.status
                              )}
                              <span className='ml-1 text-xs text-gray-500'>
                                {conversation.participant.status === 'online'
                                  ? ''
                                  : conversation.participant.status ===
                                      'offline'
                                    ? 'offline'
                                    : 'away'}
                              </span>
                            </div>
                          )}
                      </div>
                      <div className='flex items-center space-x-2'>
                        {conversation.unreadCount > 0 && (
                          <span className='bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium'>
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {conversation.lastMessage && (
                      <div className='mt-1 space-y-1'>
                        <div className='text-sm text-gray-600 truncate'>
                          {formatLastMessage(conversation.lastMessage)}
                        </div>
                        <div className='text-xs text-gray-400'>
                          {formatDistanceToNow(
                            new Date(conversation.lastMessage.createdAt),
                            { addSuffix: true }
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
