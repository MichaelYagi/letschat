import React, { useState } from 'react';
import { conversationsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, Users, UserPlus } from 'lucide-react';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: () => void;
}

export function NewConversationModal({
  isOpen,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) {
  const { user } = useAuth();
  const [type, setType] = useState<'direct' | 'group'>('direct');
  const [username, setUsername] = useState('');
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (type === 'direct') {
        await conversationsApi.createConversation({
          type: 'direct',
          participantUsername: username.trim(),
        });
      } else {
        await conversationsApi.createConversation({
          type: 'group',
          name: groupName.trim(),
          description: description.trim(),
          participantUsernames: participants
            .split(',')
            .map(u => u.trim())
            .filter(u => u),
        });
      }

      onConversationCreated();
      onClose();
      resetForm();
    } catch (error: any) {
      setError(
        error.response?.data?.error?.message || 'Failed to create conversation'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setType('direct');
    setUsername('');
    setGroupName('');
    setDescription('');
    setParticipants('');
    setError('');
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl w-full max-w-md mx-4'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200'>
          <h2 className='text-lg font-semibold text-gray-900'>
            New Conversation
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 focus:outline-none'
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='p-4 space-y-4'>
          {error && (
            <div className='bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm'>
              {error}
            </div>
          )}

          {/* Type Selection */}
          <div className='flex space-x-4'>
            <label className='flex items-center cursor-pointer'>
              <input
                type='radio'
                value='direct'
                checked={type === 'direct'}
                onChange={e => setType(e.target.value as 'direct' | 'group')}
                className='mr-2'
              />
              <UserPlus size={16} className='mr-1' />
              Direct Message
            </label>
            <label className='flex items-center cursor-pointer'>
              <input
                type='radio'
                value='group'
                checked={type === 'group'}
                onChange={e => setType(e.target.value as 'direct' | 'group')}
                className='mr-2'
              />
              <Users size={16} className='mr-1' />
              Group Chat
            </label>
          </div>

          {/* Direct Message Fields */}
          {type === 'direct' && (
            <div>
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Username
              </label>
              <input
                type='text'
                id='username'
                value={username}
                onChange={e => setUsername(e.target.value)}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                placeholder='Enter username to message'
                required
              />
            </div>
          )}

          {/* Group Chat Fields */}
          {type === 'group' && (
            <>
              <div>
                <label
                  htmlFor='groupName'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Group Name
                </label>
                <input
                  type='text'
                  id='groupName'
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                  placeholder='Enter group name'
                  required
                />
              </div>

              <div>
                <label
                  htmlFor='description'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Description (optional)
                </label>
                <textarea
                  id='description'
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                  placeholder='Enter group description'
                  rows={3}
                />
              </div>

              <div>
                <label
                  htmlFor='participants'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Participants (comma-separated)
                </label>
                <input
                  type='text'
                  id='participants'
                  value={participants}
                  onChange={e => setParticipants(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500'
                  placeholder='username1, username2, username3'
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className='flex justify-end space-x-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={
                loading ||
                (type === 'direct' && !username.trim()) ||
                (type === 'group' && !groupName.trim())
              }
              className='px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
