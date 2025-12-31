import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCalling } from '../../hooks/useCalling';
import { CallUI } from '../calling/CallUI';

export function GlobalCallManager() {
  const { user } = useAuth();
  const { callState, acceptCall, rejectCall, endCall } = useCalling();

  // Only render the call UI when there's an active call (incoming, outgoing, or in-call)
  const shouldShowCallUI =
    callState.isIncomingCall || callState.isOutgoingCall || callState.isInCall;

  if (!shouldShowCallUI || !user) {
    return null;
  }

  const handleEndCall = () => {
    if (callState.isIncomingCall || callState.isOutgoingCall) {
      rejectCall();
    } else {
      endCall();
    }
  };

  // For incoming calls, we need to handle the accept call action
  const handleAcceptCall = async () => {
    await acceptCall();
  };

  return (
    <CallUI
      currentUserId={user.id}
      targetUserId={callState.remoteUserId || undefined}
      targetUsername={callState.remoteUsername || undefined}
      isVideoCall={callState.currentCallType === 'video'}
      isIncomingCall={callState.isIncomingCall}
      onEndCall={handleEndCall}
      onAcceptCall={handleAcceptCall}
    />
  );
}
