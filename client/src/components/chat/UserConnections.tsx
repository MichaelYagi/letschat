import React, { useState, useEffect } from 'react';
import { connectionsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Check, X, Clock, Users } from 'lucide-react';

interface Connection {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
  };
  status: 'pending' | 'accepted' | 'rejected';
  type: 'sent' | 'received';
  createdAt: string;
}

interface ConnectionsResponse {
  connections: Connection[];
  pendingRequests: Connection[];
}

export function UserConnections() {
  const { user } = useAuth();
  const [connectionsData, setConnectionsData] =
    useState<ConnectionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'connections' | 'requests'>(
    'connections'
  );

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const response = await connectionsApi.get();
      setConnectionsData(response);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await connectionsApi.acceptRequest(requestId);
      loadConnections(); // Reload to update UI
    } catch (error: any) {
      console.error(
        'Failed to accept request:',
        error.response?.data?.error?.message || error
      );
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await connectionsApi.rejectRequest(requestId);
      loadConnections(); // Reload to update UI
    } catch (error: any) {
      console.error(
        'Failed to reject request:',
        error.response?.data?.error?.message || error
      );
    }
  };

  const handleSendRequest = async (username: string) => {
    try {
      await connectionsApi.request(username);
      loadConnections(); // Reload to update UI
    } catch (error: any) {
      console.error(
        'Failed to send request:',
        error.response?.data?.error?.message || error
      );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
        <h2 className='text-lg font-semibold text-gray-900 flex items-center'>
          <Users className='mr-2' size={20} />
          Connections
        </h2>
      </div>

      {/* Tabs */}
      <div className='flex border-b border-gray-200 bg-white'>
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'connections'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          My Connections ({connectionsData?.connections.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'requests'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Requests ({connectionsData?.pendingRequests.length || 0})
        </button>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-y-auto p-4'>
        {activeTab === 'connections' && (
          <div className='space-y-3'>
            {connectionsData?.connections.length === 0 ? (
              <div className='text-center text-gray-500 py-8'>
                <Users className='w-16 h-16 mx-auto mb-4 text-gray-300' />
                <p>No connections yet</p>
                <p className='text-sm'>
                  Connect with people to start chatting!
                </p>
              </div>
            ) : (
              connectionsData?.connections.map(connection => (
                <div
                  key={connection.id}
                  className='flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200'
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium'>
                      {connection.user.displayName[0]?.toUpperCase() ||
                        connection.user.username[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className='font-medium text-gray-900'>
                        {connection.user.displayName}
                      </h3>
                      <p className='text-sm text-gray-500'>
                        @{connection.user.username}
                      </p>
                    </div>
                  </div>
                  <div className='text-xs text-gray-400'>
                    Connected {formatDate(connection.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className='space-y-3'>
            {connectionsData?.pendingRequests.length === 0 ? (
              <div className='text-center text-gray-500 py-8'>
                <Clock className='w-16 h-16 mx-auto mb-4 text-gray-300' />
                <p>No pending requests</p>
              </div>
            ) : (
              connectionsData?.pendingRequests.map(request => (
                <div
                  key={request.id}
                  className='bg-white rounded-lg border border-gray-200 p-4'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-white font-medium'>
                        {request.user.displayName[0]?.toUpperCase() ||
                          request.user.username[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className='font-medium text-gray-900'>
                          {request.user.displayName}
                        </h3>
                        <p className='text-sm text-gray-500'>
                          @{request.user.username}
                        </p>
                      </div>
                    </div>
                    <div className='text-xs text-gray-400'>
                      {formatDate(request.createdAt)}
                    </div>
                  </div>

                  {request.type === 'received' && (
                    <div className='flex justify-end space-x-2 mt-3'>
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        className='flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700'
                      >
                        <Check size={16} className='mr-1' />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className='flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700'
                      >
                        <X size={16} className='mr-1' />
                        Reject
                      </button>
                    </div>
                  )}

                  {request.type === 'sent' && (
                    <div className='mt-3'>
                      <div className='text-sm text-yellow-600 flex items-center'>
                        <Clock size={14} className='mr-1' />
                        Request sent - waiting for response
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
