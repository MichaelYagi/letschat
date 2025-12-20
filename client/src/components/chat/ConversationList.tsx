import React, { useState, useEffect } from 'react';
import { conversationsApi } from '@/services/api';
import { Message, Phone, Users, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  participant?: {
    username: string;
    displayName: string;
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
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

export function ConversationList({
  selectedConversationId,
  onConversationSelect,
  onNewConversation,
}: ConversationListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatLastMessage = (lastMessage: any) => {
    if (!lastMessage) return 'No messages';

    const senderName = lastMessage.senderId === user?.id ? 'You' : 'They';
    const content =
      lastMessage.content.length > 30
        ? lastMessage.content.substring(0, 30) + '...'
        : lastMessage.content;

    return `${senderName}: ${content}`;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return conversation.name || 'Unnamed Group';
    } else if (conversation.participant) {
      return (
        conversation.participant.displayName ||
        conversation.participant.username
      );
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
            onClick={onNewConversation}
            className='p-2 text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full'
            title='New conversation'
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className='flex-1 overflow-y-auto'>
        {conversations.length === 0 ? (
          <div className='p-4 text-center text-gray-500'>
            <Message className='w-8 h-8 mx-auto mb-2 text-gray-400' />
            <p>No conversations yet</p>
            <p className='text-sm'>Start a new conversation!</p>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {conversations.map(conversation => (
              <div
                key={conversation.id}
                onClick={() => onConversationSelect(conversation.id)}
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
                      <div className='w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium'>
                        {conversation.participant.displayName[0]?.toUpperCase() ||
                          conversation.participant.username[0]?.toUpperCase()}
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
                      <h3 className='font-medium text-gray-900 truncate'>
                        {getConversationName(conversation)}
                      </h3>
                      <div className='flex items-center space-x-2'>
                        {conversation.type === 'direct' &&
                          conversation.participant &&
                          getStatusIndicator(conversation.participant.status)}
                        {conversation.unreadCount > 0 && (
                          <span className='bg-primary-600 text-white text-xs px-2 py-1 rounded-full'>
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className='text-sm text-gray-500 truncate'>
                      {formatLastMessage(conversation.lastMessage)}
                    </p>
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
