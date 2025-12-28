import React, { useState } from 'react';
import { conversationsApi, usersApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
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
  const [participants, setParticipants] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTypeChange = (newType: 'direct' | 'group') => {
    console.log('🔄 Switching to:', newType);
    setType(newType);
    setError('');
  };

  const handleGroupNameChange = (value: string) => {
    console.log('📝 Group name:', value);
    setGroupName(value);
  };

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);
    console.log('🔍 Search query:', value);

    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await usersApi.searchUsers(value, 10);
      console.log('📥 Search response:', response);

      const users = response.data || response || [];
      setSearchResults(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('❌ Search error:', error);
      setError('Failed to search users');
    }
  };

  const addParticipant = (selectedUser: any) => {
    if (!participants.find(p => p === selectedUser.username)) {
      const newParticipants = [...participants, selectedUser.username];
      console.log('➕ Adding participant:', selectedUser.username);
      setParticipants(newParticipants);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeParticipant = (username: string) => {
    console.log('➖ Removing participant:', username);
    setParticipants(participants.filter(p => p !== username));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log('🚀 Submitting form:', { type, groupName, participants });

    try {
      if (type === 'direct') {
        await conversationsApi.createConversation({
          type: 'direct',
          participantUsername: username.trim(),
        });
      } else {
        // Get user IDs for participants
        const userIds = await Promise.all(
          participants.map(async username => {
            try {
              const response = await usersApi.searchUsers(username, 1);
              const users = response.data || response || [];
              const foundUser = Array.isArray(users) ? users[0] : null;
              console.log(`✅ Found ID for ${username}:`, foundUser?.id);
              return foundUser?.id;
            } catch (error) {
              console.error(`❌ Error finding ID for ${username}:`, error);
              return null;
            }
          })
        );

        const validIds = userIds.filter(
          (id): id is string => id !== null && id !== undefined
        );

        if (validIds.length === 0) {
          throw new Error('No valid participants found');
        }

        await conversationsApi.createConversation({
          type: 'group',
          name: groupName.trim(),
          description: description.trim(),
          participantIds: validIds,
        });
      }

      onConversationCreated();
      onClose();
      // Reset form
      setType('direct');
      setUsername('');
      setGroupName('');
      setDescription('');
      setParticipants([]);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      setError(
        error.response?.data?.error?.message ||
          error.message ||
          'Failed to create conversation'
      );
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled =
    loading ||
    (type === 'direct' && !username.trim()) ||
    (type === 'group' && (!groupName.trim() || participants.length === 0));

  console.log('🔍 Form state:', {
    type,
    groupName: groupName.trim(),
    participantsCount: participants.length,
    isSubmitDisabled,
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '512px',
          margin: '16px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
            New Conversation
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {/* Type Selection */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <input
                type='radio'
                value='direct'
                checked={type === 'direct'}
                onChange={e =>
                  handleTypeChange(e.target.value as 'direct' | 'group')
                }
                style={{ marginRight: '8px' }}
              />
              <UserPlus size={16} style={{ marginRight: '4px' }} />
              Direct Message
            </label>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <input
                type='radio'
                value='group'
                checked={type === 'group'}
                onChange={e =>
                  handleTypeChange(e.target.value as 'direct' | 'group')
                }
                style={{ marginRight: '8px' }}
              />
              <Users size={16} style={{ marginRight: '4px' }} />
              Group Chat
            </label>
          </div>

          {/* Direct Message Fields */}
          {type === 'direct' && (
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: '4px',
                }}
              >
                Username
              </label>
              <input
                type='text'
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
                placeholder='Enter username'
                required
              />
            </div>
          )}

          {/* Group Chat Fields */}
          {type === 'group' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '4px',
                  }}
                >
                  Group Name *
                </label>
                <input
                  type='text'
                  value={groupName}
                  onChange={e => handleGroupNameChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                  placeholder='Enter group name'
                  required
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '4px',
                  }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    minHeight: '75px',
                  }}
                  placeholder='Enter group description (optional)'
                  rows={3}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#374151',
                    marginBottom: '4px',
                  }}
                >
                  Add Participants *
                </label>

                {/* Search Input */}
                <input
                  type='text'
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    marginBottom: '12px',
                  }}
                  placeholder='Search for users...'
                />

                {/* Selected Participants */}
                {participants.length > 0 && (
                  <div
                    style={{
                      backgroundColor: '#f3f4f6',
                      padding: '8px',
                      borderRadius: '6px',
                      marginBottom: '12px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '8px',
                      }}
                    >
                      Selected Participants ({participants.length}):
                    </div>
                    <div
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}
                    >
                      {participants.map(participant => (
                        <span
                          key={participant}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            padding: '4px 12px',
                            borderRadius: '9999px',
                            fontSize: '14px',
                          }}
                        >
                          {participant}
                          <button
                            type='button'
                            onClick={() => removeParticipant(participant)}
                            style={{
                              marginLeft: '8px',
                              background: 'none',
                              border: 'none',
                              color: '#1e40af',
                              cursor: 'pointer',
                              padding: '0',
                            }}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      maxHeight: '160px',
                      overflowY: 'auto',
                    }}
                  >
                    {searchResults.map(user => (
                      <div
                        key={user.id}
                        onClick={() => addParticipant(user)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#111827',
                            }}
                          >
                            {user.username}
                          </div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {user.displayName || user.status || 'Available'}
                          </div>
                        </div>
                        <UserPlus size={14} style={{ color: '#3b82f6' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div
            style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #fde68a',
              padding: '12px',
              borderRadius: '6px',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            <div>
              <strong>Debug Info:</strong>
            </div>
            <div>Type: {type}</div>
            <div>Group Name: "{groupName}"</div>
            <div>Group Name Valid: {groupName.trim().length > 0}</div>
            <div>Participants: {participants.length}</div>
            <div>Submit Disabled: {isSubmitDisabled.toString()}</div>
            <div>Loading: {loading.toString()}</div>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <button
              type='button'
              onClick={onClose}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={isSubmitDisabled}
              style={{
                padding: '8px 16px',
                backgroundColor: isSubmitDisabled ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                opacity: isSubmitDisabled ? 0.5 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
