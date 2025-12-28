import React, { useState } from 'react';
import { X, Users } from 'lucide-react';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: () => void;
}

export function NewConversationModalDebug({
  isOpen,
  onClose,
  onConversationCreated,
}: NewConversationModalProps) {
  const [type, setType] = useState<'direct' | 'group'>('direct');
  const [groupName, setGroupName] = useState('Test Group');
  const [participants, setParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Submitting form...');
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log('✅ Group created successfully!');
      setLoading(false);
      onConversationCreated();
      onClose();
    }, 1000);
  };

  const addParticipant = () => {
    const testUser = `user${participants.length + 1}`;
    console.log('➕ Adding participant:', testUser);
    setParticipants([...participants, testUser]);
  };

  const removeParticipant = (username: string) => {
    console.log('➖ Removing participant:', username);
    setParticipants(participants.filter(p => p !== username));
  };

  const isButtonDisabled = loading || (type === 'group' && (!groupName.trim() || participants.length === 0));
  
  console.log('🔍 Current state:', {
    type,
    groupName: groupName.trim(),
    participantsCount: participants.length,
    loading,
    isButtonDisabled
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            New Conversation (Debug)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Type Selection */}
        <div className="flex space-x-4 mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="direct"
              checked={type === 'direct'}
              onChange={e => setType(e.target.value as 'direct' | 'group')}
              className="mr-2"
            />
            Direct Message
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="group"
              checked={type === 'group'}
              onChange={e => setType(e.target.value as 'direct' | 'group')}
              className="mr-2"
            />
            <Users size={16} className="mr-1" />
            Group Chat
          </label>
        </div>

        {/* Group Chat Fields */}
        {type === 'group' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter group name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participants (Debug - Click Add to add test users)
              </label>
              
              {/* Debug participant display */}
              <div className="bg-gray-50 p-3 rounded-md mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Current Participants ({participants.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {participants.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No participants added</p>
                  ) : (
                    participants.map(participant => (
                      <span
                        key={participant}
                        className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        {participant}
                        <button
                          type="button"
                          onClick={() => removeParticipant(participant)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Debug add button */}
              <button
                type="button"
                onClick={addParticipant}
                className="w-full px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 mb-3"
              >
                Add Test Participant
              </button>
            </div>
          </div>
        )}

        {/* Debug info */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
          <p className="text-sm font-medium text-yellow-800">Debug Info:</p>
          <div className="text-xs text-yellow-700 mt-1">
            <div>Type: {type}</div>
            <div>Group Name: "{groupName}"</div>
            <div>Group Name Trimmed: "{groupName.trim()}"</div>
            <div>Participants Count: {participants.length}</div>
            <div>Button Disabled: {isButtonDisabled.toString()}</div>
            <div>Loading: {loading.toString()}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            type="button"  {/* Changed to button to avoid form submit issues */}
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={`px-4 py-2 rounded-md ${
              isButtonDisabled 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}