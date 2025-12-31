import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { webrtcService, CallEvent } from '../services/webrtc';
import { useWebSocket } from './useWebSocket';
import {
  startRinging,
  stopRinging,
  playDialingSound,
  stopDialingSound,
  playAcceptSound,
  playRejectSound,
  playEndSound,
  requestNotificationPermission,
  showCallNotification,
} from '../utils/callSounds';

interface CallState {
  isInCall: boolean;
  isIncomingCall: boolean;
  isOutgoingCall: boolean;
  currentCallId: string | null;
  currentCallType: 'voice' | 'video' | null;
  remoteUserId: string | null;
  remoteUsername: string | null;
  isConnecting: boolean;
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
  const { connected, sendCallMessage, callSignal } = useWebSocket();

  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isIncomingCall: false,
    isOutgoingCall: false,
    currentCallId: null,
    currentCallType: null,
    remoteUserId: null,
    remoteUsername: null,
    isConnecting: false,
  });

  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const pendingOfferRef = useRef<any>(null);

  // Request notification permissions on mount and initialize audio
  useEffect(() => {
    requestNotificationPermission();

    // Initialize audio context on first user interaction
    const initAudioOnInteraction = () => {
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      console.log('🎵 Audio context initialized on interaction');
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };

    document.addEventListener('click', initAudioOnInteraction);
    document.addEventListener('keydown', initAudioOnInteraction);

    return () => {
      document.removeEventListener('click', initAudioOnInteraction);
      document.removeEventListener('keydown', initAudioOnInteraction);
    };
  }, []);

  // Set WebSocket callback for WebRTC service
  useEffect(() => {
    webrtcService.setSignalingCallback(sendCallMessage);
  }, [sendCallMessage]);

  // Handle incoming call signals from WebSocket
  useEffect(() => {
    if (callSignal) {
      console.log('📞 Processing call signal:', callSignal);
      handleIncomingCallSignal(callSignal);
    }
  }, [callSignal]);

  useEffect(() => {
    // WebRTC event listeners
    const handleCallStarted = (event: CallEvent) => {
      console.log('🎉 WebRTC call started event:', event);
      // Only update state if not already in call (to avoid race conditions)
      setCallState(prev => {
        if (!prev.isInCall) {
          return {
            ...prev,
            isInCall: true,
            isIncomingCall: false,
            isOutgoingCall: false,
            isConnecting: false,
          };
        }
        return prev;
      });
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
        isConnecting: false,
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

      // Play dialing sound for outgoing call
      playDialingSound();

      setCallState({
        isInCall: false,
        isIncomingCall: false,
        isOutgoingCall: true,
        currentCallId: `${user.id}-${userId}-${Date.now()}`,
        currentCallType: type,
        remoteUserId: userId,
        remoteUsername: username,
        isConnecting: false,
      });
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const acceptCall = async () => {
    console.log('🔄 acceptCall() called');
    console.log('📊 Call state:', callState);
    console.log(
      '📞 Pending offer:',
      pendingOfferRef.current ? 'exists' : 'null'
    );

    if (!callState.remoteUserId || !pendingOfferRef.current) {
      console.error('❌ No pending call to accept');
      console.error('  - remoteUserId:', callState.remoteUserId);
      console.error('  - pendingOffer:', pendingOfferRef.current);
      return;
    }

    try {
      console.log('🎤 Step 1: Initializing local stream...');
      // Initialize local stream
      await webrtcService.initializeLocalStream(
        true,
        callState.currentCallType === 'video'
      );
      console.log('✅ Local stream initialized');

      console.log('📡 Step 2: Creating WebRTC answer...');
      // Create WebRTC answer
      const answer = await webrtcService.createAnswer(
        callState.remoteUserId,
        pendingOfferRef.current
      );
      console.log('✅ WebRTC answer created:', answer.type);

      console.log('📤 Step 3: Sending answer via WebSocket...');
      console.log('  - type: call-answer');
      console.log('  - targetUserId:', callState.remoteUserId);
      console.log('  - fromUserId:', user?.id);

      // Send answer via WebSocket signaling
      sendCallMessage({
        type: 'call-answer',
        targetUserId: callState.remoteUserId,
        fromUserId: user?.id,
        answer,
      });
      console.log('✅ Answer sent via WebSocket');

      console.log('🔔 Step 4: Stopping ringing and playing accept sound...');
      // Stop ringing and play accept sound
      stopRinging();
      playAcceptSound();
      console.log('✅ Sounds updated');

      console.log(
        '🔄 Step 5: IMMEDIATELY transitioning to active call state...'
      );
      console.log('📊 Before update - callState:', callState);
      // IMMEDIATELY transition to active call - don't wait for WebRTC
      setCallState(prev => {
        const newState = {
          ...prev,
          isInCall: true,
          isIncomingCall: false,
          isOutgoingCall: false,
          isConnecting: false,
        };
        console.log('📊 After update - newState:', newState);
        return newState;
      });

      pendingOfferRef.current = null;
      console.log(
        '🎉 Call accepted - IMMEDIATELY showing active call interface!'
      );

      // WebRTC connection will establish in background - no timeout needed
    } catch (error) {
      console.error('❌ Failed to accept call:', error);
      console.error('Error details:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
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

    // Stop ringing/dialing and play reject sound
    stopRinging();
    stopDialingSound();
    playRejectSound();

    setCallState({
      isInCall: false,
      isIncomingCall: false,
      isOutgoingCall: false,
      currentCallId: null,
      currentCallType: null,
      remoteUserId: null,
      remoteUsername: null,
      isConnecting: false,
    });
  };

  const endCall = () => {
    // Stop any ringing/dialing and play end sound
    stopRinging();
    stopDialingSound();
    playEndSound();

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
  const handleIncomingCallSignal = async (message: any) => {
    console.log('📞 Handling incoming call signal:', message);

    if (!user) {
      console.log('❌ No user found, ignoring call signal');
      return;
    }

    switch (message.type) {
      case 'call-offer':
        console.log('📞 Received call offer:', {
          targetUserId: message.targetUserId,
          currentUserId: user.id,
          fromUsername: message.fromUsername,
          callType: message.callType,
        });

        if (message.targetUserId === user.id) {
          console.log('✅ Call offer is for current user');
          pendingOfferRef.current = message.offer;
          setCallState(prev => {
            const newState = {
              isInCall: false,
              isIncomingCall: true,
              isOutgoingCall: false,
              currentCallId: `${message.fromUserId}-${user.id}-${Date.now()}`,
              currentCallType: message.callType || 'voice',
              remoteUserId: message.fromUserId,
              remoteUsername: message.fromUsername,
              isConnecting: false,
            };
            console.log('🔥 SET INCOMING CALL STATE:', newState);
            return newState;
          });

          console.log('🔔 Starting ringing and notification for incoming call');
          // Play ringing sound and show notification for incoming call
          startRinging();
          showCallNotification(
            `Incoming ${message.callType || 'voice'} call`,
            `${message.fromUsername} is calling you`
          );
        } else {
          console.log('⏭️ Call offer is for another user, ignoring');
        }
        break;

      case 'call-answer':
        console.log('📞 Processing call answer:', {
          targetUserId: message.targetUserId,
          currentUserId: user.id,
          fromUserId: message.fromUserId,
          isForMe: message.targetUserId === user.id,
        });

        if (message.targetUserId === user.id) {
          console.log('✅ Call answer is for me, processing...');
          try {
            await webrtcService.handleAnswer(
              message.fromUserId,
              message.answer
            );
            console.log(
              '✅ WebRTC answer handled - connection establishing...'
            );

            // Stop dialing sound
            stopDialingSound();

            console.log(
              '🔄 Answer received - IMMEDIATELY transitioning to active call!'
            );
            // IMMEDIATELY transition to active call - don't wait for WebRTC
            setCallState(prev => ({
              ...prev,
              isInCall: true,
              isIncomingCall: false,
              isOutgoingCall: false,
              isConnecting: false,
            }));

            console.log(
              '🎉 Caller now in active call - WebRTC connecting in background!'
            );
          } catch (error) {
            console.error('❌ Error handling call answer:', error);
          }
        } else {
          console.log('⏭️ Call answer is for another user, ignoring');
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
            isConnecting: false,
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
