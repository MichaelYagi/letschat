import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { webrtcService, CallEvent } from '../services/webrtc';
import { useWebSocket } from './useWebSocket';

interface CallState {
  isInCall: boolean;
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  currentCallId: string | null;
  currentCallType: 'voice' | 'video' | null;
  remoteUserId: string | null;
  remoteUsername: string | null;
}

interface UseCallingReturn {
  callState: CallState;
  startCall: (
    userId: string,
    username: string,
    type: 'voice' | 'video'
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleAudio: () => boolean;
  toggleVideo: () => boolean;
  isAudioMuted: boolean;
  isVideoOff: boolean;
}

export function useCalling(): UseCallingReturn {
  const { user } = useAuth();
  const { connected, sendCallMessage } = useWebSocket();

  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isIncomingCall: false,
    isOutgoingCall: false,
    currentCallId: null,
    currentCallType: null,
    remoteUserId: null,
    remoteUsername: null,
  });

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const pendingOfferRef = useRef<any>(null);

  useEffect(() => {
    // WebRTC event listeners
    const handleCallStarted = (event: CallEvent) => {
      setCallState(prev => ({
        ...prev,
        isInCall: true,
        isIncomingCall: false,
        isOutgoingCall: false,
      }));
    };

    const handleCallEnded = () => {
      setCallState({
        isInCall: false,
        isIncomingCall: false,
        isOutgoingCall: false,
        currentCallId: null,
        currentCallType: null,
        remoteUserId: null,
        remoteUsername: null,
      });
    };

    const handleMuteChanged = (event: CallEvent) => {
      setIsAudioMuted(!event.data.enabled);
    };

    const handleVideoChanged = (event: CallEvent) => {
      setIsVideoOff(!event.data.enabled);
    };

    webrtcService.on('call-started', handleCallStarted);
    webrtcService.on('call-ended', handleCallEnded);
    webrtcService.on('mute-changed', handleMuteChanged);
    webrtcService.on('video-changed', handleVideoChanged);

    return () => {
      webrtcService.off('call-started', handleCallStarted);
      webrtcService.off('call-ended', handleCallEnded);
      webrtcService.off('mute-changed', handleMuteChanged);
      webrtcService.off('video-changed', handleVideoChanged);
    };
  }, []);

  const startCall = async (
    userId: string,
    username: string,
    type: 'voice' | 'video'
  ) => {
    if (!connected || !user) {
      console.error('Not connected to signaling server');
      return;
    }

    try {
      // Initialize local stream
      await webrtcService.initializeLocalStream(true, type === 'video');

      // Create WebRTC offer
      const offer = await webrtcService.createOffer(userId);

      // Send call offer via WebSocket signaling
      sendCallMessage({
        type: 'call-offer',
        targetUserId: userId,
        fromUserId: user.id,
        fromUsername: user.username,
        offer,
        callType: type,
      });

      setCallState({
        isInCall: false,
        isIncomingCall: false,
        isOutgoingCall: true,
        currentCallId: `${user.id}-${userId}-${Date.now()}`,
        currentCallType: type,
        remoteUserId: userId,
        remoteUsername: username,
      });
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const acceptCall = async () => {
    if (!callState.remoteUserId || !pendingOfferRef.current) {
      console.error('No pending call to accept');
      return;
    }

    try {
      // Initialize local stream
      await webrtcService.initializeLocalStream(
        true,
        callState.currentCallType === 'video'
      );

      // Create WebRTC answer
      const answer = await webrtcService.createAnswer(
        callState.remoteUserId,
        pendingOfferRef.current
      );

      // Send answer via WebSocket signaling
      sendCallMessage({
        type: 'call-answer',
        targetUserId: callState.remoteUserId,
        fromUserId: user?.id,
        answer,
      });

      pendingOfferRef.current = null;
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const rejectCall = () => {
    if (callState.remoteUserId && user) {
      sendCallMessage({
        type: 'call-rejected',
        targetUserId: callState.remoteUserId,
        fromUserId: user.id,
      });
    }

    setCallState({
      isInCall: false,
      isIncomingCall: false,
      isOutgoingCall: false,
      currentCallId: null,
      currentCallType: null,
      remoteUserId: null,
      remoteUsername: null,
    });
  };

  const endCall = () => {
    webrtcService.leaveGroupCall();
  };

  const toggleAudio = () => {
    const muted = webrtcService.toggleAudio();
    setIsAudioMuted(!muted);
    return !muted;
  };

  const toggleVideo = () => {
    const videoOff = webrtcService.toggleVideo();
    setIsVideoOff(!videoOff);
    return !videoOff;
  };

  // Handle incoming call signals
  const handleIncomingCallSignal = (message: any) => {
    if (!user) return;

    switch (message.type) {
      case 'call-offer':
        if (message.targetUserId === user.id) {
          pendingOfferRef.current = message.offer;
          setCallState({
            isInCall: false,
            isIncomingCall: true,
            isOutgoingCall: false,
            currentCallId: `${message.fromUserId}-${user.id}-${Date.now()}`,
            currentCallType: message.callType || 'voice',
            remoteUserId: message.fromUserId,
            remoteUsername: message.fromUsername,
          });
        }
        break;

      case 'call-answer':
        if (message.targetUserId === user.id) {
          webrtcService.handleAnswer(message.fromUserId, message.answer);
        }
        break;

      case 'call-rejected':
        if (message.targetUserId === user.id) {
          setCallState({
            isInCall: false,
            isIncomingCall: false,
            isOutgoingCall: false,
            currentCallId: null,
            currentCallType: null,
            remoteUserId: null,
            remoteUsername: null,
          });
        }
        break;

      case 'ice-candidate':
        webrtcService.handleIceCandidate(message.fromUserId, message.candidate);
        break;
    }
  };

  return {
    callState,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
    isAudioMuted,
    isVideoOff,
  };
}
