import { useState, useEffect, useRef } from 'react';
import { webrtcService, CallUser, CallEvent } from '../../services/webrtc';
import {
  Phone,
  Video,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  ScreenShare,
  MessageCircle,
  Users,
} from 'lucide-react';

interface CallUIProps {
  currentUserId: string;
  targetUserId?: string;
  targetUsername?: string;
  isVideoCall?: boolean;
  isIncomingCall?: boolean;
  onEndCall?: () => void;
  className?: string;
}

export function CallUI({
  currentUserId,
  targetUserId,
  targetUsername,
  isVideoCall = false,
  isIncomingCall = false,
  onEndCall,
  className = '',
}: CallUIProps) {
  const [isInCall, setIsInCall] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callUsers, setCallUsers] = useState<CallUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up WebRTC event listeners
    const handleCallStarted = (event: CallEvent) => {
      setIsInCall(true);
      setIsConnecting(false);
      startCallTimer();

      // Set local video
      if (localVideoRef.current && event.data?.stream) {
        localVideoRef.current.srcObject = event.data.stream;
      }
    };

    const handleCallEnded = () => {
      setIsInCall(false);
      setCallDuration(0);
      stopCallTimer();
      if (onEndCall) {
        onEndCall();
      }
    };

    const handleUserJoined = (event: CallEvent) => {
      if (remoteVideoRef.current && event.data?.stream) {
        remoteVideoRef.current.srcObject = event.data.stream;
      }
    };

    const handleUserLeft = () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    };

    const handleMuteChanged = (event: CallEvent) => {
      setIsAudioMuted(!event.data.enabled);
    };

    const handleVideoChanged = (event: CallEvent) => {
      setIsVideoOff(!event.data.enabled);
    };

    webrtcService.on('call-started', handleCallStarted);
    webrtcService.on('call-ended', handleCallEnded);
    webrtcService.on('user-joined', handleUserJoined);
    webrtcService.on('user-left', handleUserLeft);
    webrtcService.on('mute-changed', handleMuteChanged);
    webrtcService.on('video-changed', handleVideoChanged);

    return () => {
      webrtcService.off('call-started', handleCallStarted);
      webrtcService.off('call-ended', handleCallEnded);
      webrtcService.off('user-joined', handleUserJoined);
      webrtcService.off('user-left', handleUserLeft);
      webrtcService.off('mute-changed', handleMuteChanged);
      webrtcService.off('video-changed', handleVideoChanged);
    };
  }, [onEndCall]);

  const startCallTimer = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const stopCallTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCall = async () => {
    if (!targetUserId) return;

    setIsConnecting(true);
    try {
      // Initialize local stream
      const stream = await webrtcService.initializeLocalStream(
        true,
        isVideoCall
      );

      if (targetUserId) {
        // Create offer for 1-on-1 call
        const offer = await webrtcService.createOffer(targetUserId);

        // Send offer via signaling (this would go through your WebSocket)
        webrtcService.sendSignalingMessage(targetUserId, {
          type: 'call-offer',
          offer,
          isVideoCall,
        });
      }
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
    }
  };

  const acceptCall = async () => {
    if (!targetUserId) return;

    setIsConnecting(true);
    try {
      // Initialize local stream
      const stream = await webrtcService.initializeLocalStream(
        true,
        isVideoCall
      );

      // Create answer for incoming call
      // This would handle the incoming offer and create an answer
    } catch (error) {
      console.error('Failed to accept call:', error);
      setIsConnecting(false);
    }
  };

  const rejectCall = () => {
    // Send reject signal
    if (targetUserId) {
      webrtcService.sendSignalingMessage(targetUserId, {
        type: 'call-rejected',
      });
    }
    if (onEndCall) {
      onEndCall();
    }
  };

  const endCall = () => {
    webrtcService.leaveGroupCall();
  };

  const toggleAudio = () => {
    const muted = webrtcService.toggleAudio();
    setIsAudioMuted(!muted);
  };

  const toggleVideo = () => {
    const videoOff = webrtcService.toggleVideo();
    setIsVideoOff(!videoOff);
  };

  if (!isInCall && !isConnecting) {
    // Incoming/Outgoing call UI
    return (
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 ${className}`}
      >
        <div className='bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center'>
          <div className='mb-6'>
            <div className='w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center'>
              <span className='text-2xl font-bold text-gray-600'>
                {targetUsername?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>
              {isIncomingCall ? 'Incoming Call' : `Calling ${targetUsername}`}
            </h3>
            <p className='text-gray-600'>
              {isVideoCall ? 'Video Call' : 'Voice Call'}
            </p>
          </div>

          <div className='flex space-x-4 justify-center'>
            {isIncomingCall ? (
              <>
                <button
                  onClick={acceptCall}
                  className='bg-green-500 hover:bg-green-600 text-white p-4 rounded-full transition-colors'
                >
                  <Phone size={24} />
                </button>
                <button
                  onClick={rejectCall}
                  className='bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors'
                >
                  <PhoneOff size={24} />
                </button>
              </>
            ) : (
              <button
                onClick={startCall}
                className='bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-full transition-colors'
              >
                <Phone size={24} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div
        className={`fixed inset-0 bg-gray-900 flex items-center justify-center z-50 ${className}`}
      >
        <div className='text-center text-white'>
          <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4'></div>
          <p className='text-xl'>Connecting...</p>
        </div>
      </div>
    );
  }

  // Active call UI
  return (
    <div
      className={`fixed inset-0 bg-gray-900 flex flex-col z-50 ${className}`}
    >
      {/* Video Area */}
      <div className='flex-1 relative'>
        {/* Remote Video */}
        <div className='absolute inset-0 bg-black'>
          {isVideoCall ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='w-full h-full flex items-center justify-center'>
              <div className='text-center'>
                <div className='w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center'>
                  <span className='text-4xl font-bold text-gray-300'>
                    {targetUsername?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
                <h2 className='text-2xl font-semibold text-white mb-2'>
                  {targetUsername}
                </h2>
                <p className='text-gray-400'>
                  {isAudioMuted ? 'Muted' : 'Speaking'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (picture-in-picture for video calls) */}
        {isVideoCall && (
          <div className='absolute top-4 right-4 w-32 h-32 bg-gray-800 rounded-lg shadow-lg'>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className='w-full h-full object-cover rounded-lg'
            />
          </div>
        )}

        {/* Call Info */}
        <div className='absolute top-4 left-4 text-white'>
          <h2 className='text-xl font-semibold'>{targetUsername}</h2>
          <p className='text-gray-300 flex items-center space-x-2'>
            <span>{formatCallDuration(callDuration)}</span>
            <span>•</span>
            <span>{isVideoCall ? 'Video Call' : 'Voice Call'}</span>
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className='bg-gray-800 p-4'>
        <div className='flex items-center justify-center space-x-4'>
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-colors ${
              isAudioMuted
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {isAudioMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {isVideoCall && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-colors ${
                isVideoOff
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
          )}

          <button
            onClick={endCall}
            className='bg-red-500 hover:bg-red-600 text-white p-4 rounded-full transition-colors'
          >
            <PhoneOff size={24} />
          </button>

          {/* Additional controls */}
          <button className='bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors'>
            <ScreenShare size={20} />
          </button>

          <button className='bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors'>
            <MessageCircle size={20} />
          </button>

          {isVideoCall && (
            <button className='bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors'>
              <Users size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
