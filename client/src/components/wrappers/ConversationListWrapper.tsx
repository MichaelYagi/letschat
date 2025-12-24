import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConversationList } from '../chat/ConversationList';

export function ConversationListWrapper() {
  const navigate = useNavigate();

  const handleConversationSelect = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  return <ConversationList onConversationSelect={handleConversationSelect} />;
}
