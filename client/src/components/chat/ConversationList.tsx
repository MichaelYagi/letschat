import { useState, useEffect } from 'react';
import { conversationsApi, usersApi } from '../../services/api';
import {
  MessageCircle,
  Users,
  Search,
  X,
  Plus,
  Phone,
  Video,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useCalling } from '../../hooks/useCalling';

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
  const { startCall } = useCalling();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // User search state for direct messages
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);

  // Group creation state
  const [showGroupCreation, setShowGroupCreation] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState<any[]>([]);
  const [groupSearchLoading, setGroupSearchLoading] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await conversationsApi.getConversations();
      console.log('📥 Conversations response:', response);

      const conversations =
        response.data || response.conversations || response || [];
      console.log('📝 Parsed conversations:', conversations);
      setConversations(Array.isArray(conversations) ? conversations : []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate search functions for user search and group search
  const searchUsersForDM = async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }

    setUserSearchLoading(true);
    try {
      console.log('🔍 Searching for users (DM):', query);
      const response = await usersApi.searchUsers(query.trim());
      console.log('📥 Search response:', response);

      let users = [];
      if (response && response.data) {
        users = response.data;
      } else if (Array.isArray(response)) {
        users = response;
      }

      console.log('👥 Parsed users:', users);
      setUserSearchResults(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('❌ Failed to search users:', error);
      setUserSearchResults([]);
    } finally {
      setUserSearchLoading(false);
    }
  };

  const searchUsersForGroup = async (query: string) => {
    if (!query.trim()) {
      setGroupSearchResults([]);
      return;
    }

    setGroupSearchLoading(true);
    try {
      console.log('🔍 Searching for users (Group):', query);
      const response = await usersApi.searchUsers(query.trim());
      console.log('📥 Search response:', response);

      let users = [];
      if (response && response.data) {
        users = response.data;
      } else if (Array.isArray(response)) {
        users = response;
      }

      console.log('👥 Parsed users:', users);
      setGroupSearchResults(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('❌ Failed to search users:', error);
      setGroupSearchResults([]);
    } finally {
      setGroupSearchLoading(false);
    }
  };

  const startConversation = async (otherUserId: string) => {
    try {
      console.log('🚀 Starting direct conversation with user:', otherUserId);
      const response = await conversationsApi.createConversation({
        type: 'direct',
        participantIds: [otherUserId],
      });

      console.log('📥 Create conversation response:', response);

      const newConversation =
        response.data || response.conversation || response;
      console.log('✅ New conversation:', newConversation);

      setConversations(prev => [newConversation, ...prev]);
      setShowUserSearch(false);
      setUserSearchQuery('');
      setUserSearchResults([]);

      if (onConversationSelect) {
        onConversationSelect(newConversation.id);
      }
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
    }
  };

  const createGroupChat = async () => {
    console.log('🚀 Creating group chat with:', {
      name: groupName.trim(),
      selectedUsers,
      userCount: selectedUsers.length,
    });

    if (!groupName.trim() || selectedUsers.length === 0) {
      console.log('❌ Validation failed - group name or users missing');
      return;
    }

    try {
      console.log('📤 Sending API request...');
      const response = await conversationsApi.createConversation({
        type: 'group',
        name: groupName.trim(),
        participantIds: selectedUsers,
      });

      console.log('📥 Create group response:', response);

      const newConversation =
        response.data || response.conversation || response;
      console.log('✅ New group conversation:', newConversation);

      setConversations(prev => [newConversation, ...prev]);
      setShowGroupCreation(false);
      setGroupName('');
      setSelectedUsers([]);
      setGroupSearchQuery('');
      setGroupSearchResults([]);

      if (onConversationSelect) {
        onConversationSelect(newConversation.id);
      }
    } catch (error) {
      console.error('❌ Failed to create group chat:', error);
    }
  };

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
          <div className='flex items-center space-x-2'>
            <button
              onClick={() => setShowGroupCreation(!showGroupCreation)}
              className='p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors'
              title='Create Group'
            >
              <Plus size={20} />
            </button>
            <button
              onClick={() => setShowUserSearch(!showUserSearch)}
              className='p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors'
              title='Search Users'
            >
              {showUserSearch ? <X size={20} /> : <Search size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* User Search for Direct Messages */}
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
              value={userSearchQuery}
              onChange={e => setUserSearchQuery(e.target.value)}
              onKeyUp={e => {
                if (e.key === 'Enter') {
                  searchUsersForDM(userSearchQuery);
                }
              }}
              className='w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
            />
          </div>

          {userSearchLoading && (
            <div className='mt-2 text-center text-sm text-gray-500'>
              Searching...
            </div>
          )}

          {!userSearchLoading && userSearchResults.length > 0 && (
            <div className='mt-3 space-y-1'>
              <p className='text-xs text-gray-500 mb-2'>
                Click to start a conversation:
              </p>
              {userSearchResults.map(searchUser => (
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

          {!userSearchLoading &&
            userSearchQuery &&
            userSearchResults.length === 0 && (
              <div className='mt-3 text-center text-sm text-gray-500'>
                No users found matching "{userSearchQuery}"
              </div>
            )}
        </div>
      )}

      {/* Group Creation */}
      {showGroupCreation && (
        <div className='p-4 border-b border-gray-200 bg-gray-50'>
          <div className='space-y-3'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Group Name
              </label>
              <input
                type='text'
                placeholder='Enter group name...'
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Search and add users
              </label>
              <div className='relative'>
                <Search
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                  size={16}
                />
                <input
                  type='text'
                  placeholder='Search users to add...'
                  value={groupSearchQuery}
                  onChange={e => setGroupSearchQuery(e.target.value)}
                  onKeyUp={e => {
                    if (e.key === 'Enter') {
                      searchUsersForGroup(groupSearchQuery);
                    }
                  }}
                  className='w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm'
                />
              </div>
            </div>

            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div className='space-y-2'>
                <p className='text-xs text-gray-500'>Selected users:</p>
                <div className='flex flex-wrap gap-2'>
                  {selectedUsers.map(userId => {
                    const user = groupSearchResults.find(u => u.id === userId);
                    return user ? (
                      <span
                        key={userId}
                        className='inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs'
                      >
                        {user.username}
                        <button
                          type='button'
                          onClick={() => {
                            setSelectedUsers(prev =>
                              prev.filter(id => id !== userId)
                            );
                          }}
                          className='ml-2 text-green-600 hover:text-green-800'
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Search Results for Group */}
            {groupSearchLoading && (
              <div className='mt-2 text-center text-sm text-gray-500'>
                Searching...
              </div>
            )}

            {!groupSearchLoading && groupSearchResults.length > 0 && (
              <div className='space-y-1 max-h-32 overflow-y-auto'>
                {groupSearchResults.map(searchUser => (
                  <div
                    key={searchUser.id}
                    onClick={() => {
                      if (
                        !selectedUsers.includes(searchUser.id) &&
                        searchUser.id !== user?.id
                      ) {
                        setSelectedUsers(prev => [...prev, searchUser.id]);
                      }
                    }}
                    className={`p-2 bg-white border border-gray-200 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(searchUser.id) ||
                      searchUser.id === user?.id
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className='flex items-center space-x-2'>
                      <div className='w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium'>
                        {searchUser.username.charAt(0).toUpperCase()}
                      </div>
                      <span className='text-sm text-gray-900'>
                        {searchUser.username}
                      </span>
                      {selectedUsers.includes(searchUser.id) && (
                        <span className='text-xs text-green-600'>Added</span>
                      )}
                      {searchUser.id === user?.id && (
                        <span className='text-xs text-gray-500'>You</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className='flex space-x-2'>
              <button
                onClick={createGroupChat}
                disabled={!groupName.trim() || selectedUsers.length === 0}
                className='flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm'
              >
                Create Group
              </button>
              <button
                onClick={() => {
                  setShowGroupCreation(false);
                  setGroupName('');
                  setSelectedUsers([]);
                  setGroupSearchQuery('');
                  setGroupSearchResults([]);
                }}
                className='px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm'
              >
                Cancel
              </button>
            </div>
          </div>
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
                    ) : conversation.participant ? (
                      <div className='w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium'>
                        {conversation.participant.username?.toUpperCase() ||
                          conversation.participant?.username?.toUpperCase()}
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
                        {/* Calling buttons for direct messages */}
                        {conversation.type === 'direct' &&
                          conversation.participant && (
                            <div className='flex space-x-1'>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  const username =
                                    typeof conversation.participant === 'string'
                                      ? conversation.participant
                                      : conversation.participant?.username ||
                                        'Unknown';
                                  startCall(conversation.id, username, 'voice');
                                }}
                                className='p-1 text-green-600 hover:bg-green-50 rounded-full transition-colors'
                                title='Voice Call'
                              >
                                <Phone size={16} />
                              </button>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  const username =
                                    typeof conversation.participant === 'string'
                                      ? conversation.participant
                                      : conversation.participant?.username ||
                                        'Unknown';
                                  startCall(conversation.id, username, 'video');
                                }}
                                className='p-1 text-purple-600 hover:bg-purple-50 rounded-full transition-colors'
                                title='Video Call'
                              >
                                <Video size={16} />
                              </button>
                            </div>
                          )}
                        {conversation.unreadCount > 0 && (
                          <span className='bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-medium'>
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
