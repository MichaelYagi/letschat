import { useState, useEffect, useCallback, useRef } from 'react';
import { connectionsApi, usersApi, conversationsApi } from '../../services/api';
import {
  UserPlus,
  UserX,
  Check,
  Clock,
  Search,
  MessageCircle,
  Phone,
  Video,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CallUI } from '../calling/CallUI';
import { useCalling } from '../../hooks/useCalling';

interface Connection {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  createdAt: string;
  updatedAt: string;
  requesterProfile: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status: string;
  };
  addresseeProfile: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    status: string;
  };
}

interface ConnectionRequest {
  id: string;
  requesterProfile: {
    id: string;
    username: string;
    status: string;
  };
  status: 'pending';
  createdAt: string;
}

export function Connections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { callState, startCall, acceptCall, rejectCall, endCall } =
    useCalling();

  useEffect(() => {
    // Load connections and requests in parallel
    const loadData = async () => {
      try {
        await Promise.all([loadConnections(), loadRequests()]);
      } catch (error) {
        console.error('Error loading connection data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Add timeout fallback to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
      console.warn('Loading connections timed out after 5 seconds');
    }, 5000);

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      clearTimeout(timeoutId);
    };
  }, []);

  const loadConnections = async () => {
    try {
      const response = await connectionsApi.get();
      setConnections(response.data || []);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    try {
      const response = await connectionsApi.getPendingRequests();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Failed to load requests:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await usersApi.searchUsers(query);
      const allUsers = response.data || response;
      // Filter out current user from search results
      const filteredUsers = Array.isArray(allUsers)
        ? allUsers.filter(searchUser => searchUser.id !== user?.id)
        : [];
      setSearchResults(filteredUsers);
      setSearchQuery(query);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (query.trim().length >= 2) {
          searchUsers(query.trim());
        } else if (query.trim() === '') {
          setSearchResults([]);
        }
      }, 300); // 300ms delay
    },
    [user?.id]
  );

  const sendRequest = async (username: string) => {
    try {
      await connectionsApi.request(username);
      setSearchQuery('');
      setSearchResults([]);
      loadConnections();
      loadRequests();
    } catch (error) {
      console.error('Failed to send request:', error);
      if (error.response?.data?.error) {
        const errorMessage = error.response.data.error;
        if (errorMessage.includes('Connection request already exists')) {
          alert(
            'You already have a pending request or connection with this user.'
          );
        } else if (errorMessage.includes('User not found')) {
          alert('User not found. Please try searching again.');
        } else if (
          errorMessage.includes('Cannot send connection request to yourself')
        ) {
          alert('You cannot send a connection request to yourself.');
        } else {
          alert(`Error: ${errorMessage}`);
        }
      } else {
        alert('Failed to send connection request. Please try again.');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await connectionsApi.acceptRequest(requestId);
      loadConnections();
      loadRequests();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const rejectRequest = async (requestId: string) => {
    try {
      await connectionsApi.rejectRequest(requestId);
      loadConnections();
      loadRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const startConversation = async (userId: string) => {
    try {
      // Create a new conversation with this user
      const response = await conversationsApi.createConversation({
        participantIds: [userId],
        type: 'direct',
      });

      // Navigate to the newly created conversation
      const conversationId = response.id || response.data?.id;
      if (conversationId) {
        window.location.href = `/chat/${conversationId}`;
      } else {
        console.error('Failed to get conversation ID from response:', response);
        alert('Failed to start conversation. Please try again.');
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const startVoiceCall = (userId: string, username: string) => {
    startCall(userId, username, 'voice');
  };

  const startVideoCall = (userId: string, username: string) => {
    startCall(userId, username, 'video');
  };

  const getStatusIndicator = (status: string) => {
    const colorClass = status === 'online' ? 'bg-green-500' : 'bg-gray-400';
    return <div className={`w-2 h-2 rounded-full ${colorClass}`} />;
  };

  if (loading) {
    return (
      <div className='p-4'>
        <div className='text-center text-gray-500'>Loading connections...</div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full'>
      {/* Header */}
      <div className='p-4 border-b border-gray-200 bg-white'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Friends & Connections
        </h2>

        {/* Search Users */}
        <div className='relative'>
          <Search
            className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
            size={16}
          />
          <input
            type='text'
            placeholder='Search users to add...'
            value={searchQuery}
            onChange={e => {
              const value = e.target.value;
              setSearchQuery(value);
              debouncedSearch(value);
            }}
            onKeyPress={e => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                sendRequest(searchQuery.trim());
              }
            }}
            className='w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
          />
        </div>

        {/* Search Results */}
        {searchLoading && (
          <div className='mt-2 text-center text-sm text-gray-500'>
            Searching...
          </div>
        )}

        {!searchLoading && searchResults.length > 0 && (
          <div className='mt-3 space-y-1'>
            <p className='text-xs text-gray-500 mb-2'>
              Click to send friend request:
            </p>
            {searchResults.map(searchUser => (
              <div
                key={searchUser.id}
                onClick={() => sendRequest(searchUser.username)}
                className='p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium'>
                      {searchUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {searchUser.username}
                      </p>
                      <div className='flex items-center space-x-1'>
                        {getStatusIndicator(searchUser.status)}
                        <p className='text-xs text-gray-500'>
                          {searchUser.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  <UserPlus size={16} className='text-blue-600' />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connection Requests */}
      {requests.length > 0 && (
        <div className='p-4 border-b border-gray-200 bg-yellow-50'>
          <h3 className='text-sm font-medium text-gray-900 mb-3 flex items-center'>
            <Clock size={16} className='mr-2 text-yellow-600' />
            Pending Requests ({requests.length})
          </h3>
          <div className='space-y-2'>
            {requests.map(request => (
              <div
                key={request.id}
                className='p-3 bg-white border border-yellow-200 rounded-lg shadow-sm'
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-medium'>
                      {(request.requesterProfile?.username || 'Unknown')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>
                        {request.requesterProfile?.username || 'Unknown User'}
                      </p>
                      <div className='flex items-center space-x-1'>
                        {getStatusIndicator(
                          request.requesterProfile?.status || 'offline'
                        )}
                        <p className='text-xs text-gray-500'>
                          Wants to connect with you
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => acceptRequest(request.id)}
                      className='px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center'
                    >
                      <Check size={14} className='mr-1' />
                      Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(request.id)}
                      className='px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center'
                    >
                      <UserX size={14} className='mr-1' />
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connected Friends */}
      <div className='flex-1 overflow-y-auto p-4'>
        <h3 className='text-sm font-medium text-gray-900 mb-3 flex items-center'>
          <Users size={16} className='mr-2 text-green-600' />
          Your Friends ({connections.length})
        </h3>
        {connections.length === 0 ? (
          <div className='text-center text-gray-500 py-8'>
            <Users className='w-12 h-12 mx-auto mb-3 text-gray-400' />
            <p>No friends yet</p>
            <p className='text-sm'>Search for users above to get started!</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {connections.map(connection => {
              // Determine which user is the friend (not the current user)
              const friendUser =
                connection.user ||
                (connection.requesterId === user?.id
                  ? connection.addresseeProfile
                  : connection.requesterProfile);
              const friendId =
                friendUser?.id ||
                (connection.requesterId === user?.id
                  ? connection.addresseeId
                  : connection.requesterId);
              const friendUsername = friendUser?.username || 'Unknown User';
              const friendStatus = friendUser?.status || 'offline';

              return (
                <div
                  key={connection.id}
                  className='p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium'>
                        {friendUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className='text-sm font-medium text-gray-900'>
                          {friendUsername}
                        </p>
                        <div className='flex items-center space-x-1'>
                          {getStatusIndicator(friendStatus)}
                          <p className='text-xs text-gray-500'>
                            {friendStatus}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center space-x-1'>
                      <button
                        onClick={() => startConversation(friendId)}
                        className='p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors'
                        title='Send Message'
                      >
                        <MessageCircle size={16} />
                      </button>
                      <button
                        onClick={() => startVoiceCall(friendId, friendUsername)}
                        className='p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors'
                        title='Voice Call'
                      >
                        <Phone size={16} />
                      </button>
                      <button
                        onClick={() => startVideoCall(friendId, friendUsername)}
                        className='p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors'
                        title='Video Call'
                      >
                        <Video size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Call UI Overlay */}
      {(callState.isIncomingCall ||
        callState.isOutgoingCall ||
        callState.isInCall) && (
        <CallUI
          currentUserId={user?.id || ''}
          targetUserId={callState.remoteUserId || undefined}
          targetUsername={callState.remoteUsername || undefined}
          isVideoCall={callState.currentCallType === 'video'}
          isIncomingCall={callState.isIncomingCall}
          onEndCall={endCall}
        />
      )}
    </div>
  );
}
