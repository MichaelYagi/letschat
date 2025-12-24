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
  UserPlus,
} from 'lucide-react';

interface GroupCallUIProps {
  currentUserId: string;
  roomId: string;
  roomName?: string;
  onEndCall?: () => void;
  className?: string;
}

export function GroupCallUI({
  currentUserId,
  roomId,
  roomName = 'Group Call',
  onEndCall,
  className = '',
}: GroupCallUIProps) {
  const [isInCall, setIsInCall] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [participants, setParticipants] = useState<CallUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [showParticipantList, setShowParticipantList] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const participantVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
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
      const { userId, stream } = event.data || {};
      if (userId && stream) {
        const user: CallUser = {
          id: userId,
          username: `User${userId.slice(0, 4)}`,
          stream,
        };

        setParticipants(prev => [...prev, user]);

        // Set video element
        const videoEl = participantVideoRefs.current.get(userId);
        if (videoEl) {
          videoEl.srcObject = stream;
        }
      }
    };

    const handleUserLeft = (event: CallEvent) => {
      const { userId } = event.data || {};
      if (userId) {
        setParticipants(prev => prev.filter(p => p.id !== userId));

        // Clear video element
        const videoEl = participantVideoRefs.current.get(userId);
        if (videoEl) {
          videoEl.srcObject = null;
        }
      }
    };

    webrtcService.on('call-started', handleCallStarted);
    webrtcService.on('call-ended', handleCallEnded);
    webrtcService.on('user-joined', handleUserJoined);
    webrtcService.on('user-left', handleUserLeft);

    return () => {
      webrtcService.off('call-started', handleCallStarted);
      webrtcService.off('call-ended', handleCallEnded);
      webrtcService.off('user-joined', handleUserJoined);
      webrtcService.off('user-left', handleUserLeft);
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

  const joinGroupCall = async () => {
    setIsConnecting(true);
    try {
      await webrtcService.joinGroupCall(roomId);
    } catch (error) {
      console.error('Failed to join group call:', error);
      setIsConnecting(false);
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

  const inviteUser = () => {
    // Open user selection modal or navigate to friends
    console.log('Invite user to group call');
  };

  const renderVideoGrid = () => {
    const totalParticipants = participants.length + 1; // +1 for local user
    const gridCols =
      totalParticipants <= 1
        ? 1
        : totalParticipants <= 4
          ? 2
          : totalParticipants <= 9
            ? 3
            : 4;

    return (
      <div
        className={`grid gap-2 h-full p-4`}
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        }}
      >
        {/* Local Video */}
        <div className='relative bg-gray-800 rounded-lg overflow-hidden'>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className='w-full h-full object-cover'
          />
          <div className='absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm'>
            You
            {isAudioMuted && <MicOff size={12} className='inline ml-1' />}
            {isVideoOff && <VideoOff size={12} className='inline ml-1' />}
          </div>
        </div>

        {/* Participant Videos */}
        {participants.map(participant => (
          <div
            key={participant.id}
            className='relative bg-gray-800 rounded-lg overflow-hidden'
          >
            {participant.stream ? (
              <video
                ref={el => {
                  if (el && participantVideoRefs.current) {
                    participantVideoRefs.current.set(participant.id, el);
                    el.srcObject = participant.stream;
                  }
                }}
                autoPlay
                playsInline
                className='w-full h-full object-cover'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center'>
                <div className='text-center text-white'>
                  <div className='w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center'>
                    <span className='text-xl font-bold'>
                      {participant.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className='text-sm'>{participant.username}</p>
                </div>
              </div>
            )}
            <div className='absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm'>
              {participant.username}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isInCall && !isConnecting) {
    // Join call UI
    return (
      <div
        className={`fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50 ${className}`}
      >
        <div className='bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center'>
          <div className='mb-6'>
            <Users className='w-16 h-16 mx-auto mb-4 text-blue-500' />
            <h3 className='text-2xl font-semibold text-gray-900 mb-2'>
              {roomName}
            </h3>
            <p className='text-gray-600'>Join the group video call</p>
          </div>

          <div className='flex space-x-4 justify-center'>
            <button
              onClick={joinGroupCall}
              className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2'
            >
              <Phone size={20} />
              <span>Join Call</span>
            </button>
            <button
              onClick={onEndCall}
              className='bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg transition-colors'
            >
              Cancel
            </button>
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
          <p className='text-xl'>Joining group call...</p>
        </div>
      </div>
    );
  }

  // Active group call UI
  return (
    <div
      className={`fixed inset-0 bg-gray-900 flex flex-col z-50 ${className}`}
    >
      {/* Header */}
      <div className='bg-gray-800 px-4 py-3 flex items-center justify-between'>
        <div className='text-white'>
          <h2 className='text-lg font-semibold'>{roomName}</h2>
          <p className='text-sm text-gray-300'>
            {participants.length + 1} participants •{' '}
            {formatCallDuration(callDuration)}
          </p>
        </div>

        <button
          onClick={() => setShowParticipantList(!showParticipantList)}
          className='text-white hover:bg-gray-700 p-2 rounded-full transition-colors'
        >
          <Users size={20} />
        </button>
      </div>

      {/* Video Grid */}
      <div className='flex-1 relative'>{renderVideoGrid()}</div>

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

          <button
            onClick={inviteUser}
            className='bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-full transition-colors'
          >
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      {/* Participant Sidebar */}
      {showParticipantList && (
        <div className='absolute right-0 top-0 h-full w-80 bg-gray-800 shadow-xl z-10'>
          <div className='p-4 border-b border-gray-700 flex items-center justify-between'>
            <h3 className='text-white font-semibold'>
              Participants ({participants.length + 1})
            </h3>
            <button
              onClick={() => setShowParticipantList(false)}
              className='text-gray-400 hover:text-white'
            >
              ×
            </button>
          </div>

          <div className='p-4 space-y-2'>
            {/* Current User */}
            <div className='flex items-center space-x-3 p-2 rounded bg-gray-700'>
              <div className='w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm'>
                You
              </div>
              <div className='flex-1 text-white'>
                <p className='font-medium'>You</p>
                <p className='text-xs text-gray-400'>
                  {isAudioMuted && 'Muted • '}
                  {isVideoOff && 'Video Off'}
                </p>
              </div>
            </div>

            {/* Other Participants */}
            {participants.map(participant => (
              <div
                key={participant.id}
                className='flex items-center space-x-3 p-2 rounded hover:bg-gray-700'
              >
                <div className='w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm'>
                  {participant.username.charAt(0).toUpperCase()}
                </div>
                <div className='flex-1 text-white'>
                  <p className='font-medium'>{participant.username}</p>
                  <p className='text-xs text-gray-400'>Connected</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
