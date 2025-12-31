export interface WebRTCConfig {
  iceServers: RTCConfiguration['iceServers'];
}

export interface CallUser {
  id: string;
  username: string;
  stream?: MediaStream;
  peerConnection?: RTCPeerConnection;
}

export interface CallEvent {
  type:
    | 'call-started'
    | 'call-ended'
    | 'user-joined'
    | 'user-left'
    | 'mute-changed'
    | 'video-changed';
  data?: any;
}

export class WebRTCService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private users: Map<string, CallUser> = new Map();
  private isAudioEnabled = true;
  private isVideoEnabled = true;
  private eventListeners: Map<string, ((event: CallEvent) => void)[]> =
    new Map();
  private sendSignalingCallback: ((message: any) => void) | null = null;

  private config: WebRTCConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.stunprotocol.org:3478' },
    ],
  };

  constructor() {
    // Initialize WebRTC
  }

  // Event handling
  on(
    event:
      | 'call-started'
      | 'call-ended'
      | 'user-joined'
      | 'user-left'
      | 'mute-changed'
      | 'video-changed',
    callback: (event: CallEvent) => void
  ) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: (event: CallEvent) => void) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(
    event:
      | 'call-started'
      | 'call-ended'
      | 'user-joined'
      | 'user-left'
      | 'mute-changed'
      | 'video-changed',
    data?: any
  ) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback({ type: event, data }));
    }
  }

  // Media management
  async initializeLocalStream(
    audio: boolean = true,
    video: boolean = true
  ): Promise<MediaStream> {
    try {
      console.log('🎤 Initializing local stream with constraints:', {
        audio,
        video,
      });
      const constraints = {
        audio,
        video: video
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
            }
          : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.isAudioEnabled = audio;
      this.isVideoEnabled = video;

      console.log('✅ Local stream initialized successfully');
      console.log('🎤 Audio tracks:', this.localStream.getAudioTracks().length);
      console.log('📹 Video tracks:', this.localStream.getVideoTracks().length);

      this.emit('call-started', { stream: this.localStream });
      return this.localStream;
    } catch (error) {
      console.error('❌ Failed to get local stream:', error);
      console.error(
        '🎤 Microphone permission:',
        navigator.permissions ? 'check available' : 'not supported'
      );
      throw error;
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      this.isAudioEnabled = !this.isAudioEnabled;
      this.emit('mute-changed', { enabled: this.isAudioEnabled });
    }
    return this.isAudioEnabled;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      this.isVideoEnabled = !this.isVideoEnabled;
      this.emit('video-changed', { enabled: this.isVideoEnabled });
    }
    return this.isVideoEnabled;
  }

  // Peer connection management
  createPeerConnection(userId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.config);

    // Don't add local stream here - will be added in createOffer/createAnswer
    // to ensure stream is available before creating offer/answer

    // Handle ICE candidates
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate to:', userId);
        // Send ice candidate to remote user via signaling
        this.sendSignalingMessage(userId, {
          type: 'ice-candidate',
          candidate: event.candidate,
        });
      } else {
        console.log('🧊 ICE gathering completed for:', userId);
      }
    };

    // Handle incoming tracks
    peerConnection.ontrack = event => {
      const [remoteStream] = event.streams;
      this.addRemoteStream(userId, remoteStream);

      // Emit event when remote stream is received (connection is fully established)
      console.log('🎥 Remote stream received from:', userId);
      this.emit('user-joined', { userId, stream: remoteStream });
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(
        '📞 WebRTC connection state for',
        userId,
        ':',
        peerConnection.connectionState
      );

      if (peerConnection.connectionState === 'connected') {
        console.log('✅ WebRTC connection established with:', userId);
        console.log('🎉 Both users should now be able to hear each other!');
        this.emit('call-started', { userId, connected: true });
      } else if (
        peerConnection.connectionState === 'disconnected' ||
        peerConnection.connectionState === 'failed'
      ) {
        console.log('❌ WebRTC connection failed for:', userId);
        this.removeUser(userId);
      }
    };

    this.peerConnections.set(userId, peerConnection);
    return peerConnection;
  }

  // Call management for 1-on-1 calls
  async createOffer(userId: string): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.getOrCreatePeerConnection(userId);

    // Add the called user to track them
    this.addUser({ id: userId, username: userId });

    // Add local stream to peer connection before creating offer
    if (this.localStream) {
      console.log('🎤 Adding local stream to peer connection for offer');
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    } else {
      console.error('❌ No local stream available when creating offer');
      throw new Error('Local stream not initialized');
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    console.log('📞 WebRTC offer created for:', userId);
    return offer;
  }

  async createAnswer(
    userId: string,
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit> {
    const peerConnection = this.getOrCreatePeerConnection(userId);

    // Add the user to the users map to track them
    this.addUser({ id: userId, username: userId });

    // Add local stream to peer connection before creating answer
    if (this.localStream) {
      console.log('🎤 Adding local stream to peer connection for answer');
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    } else {
      console.error('❌ No local stream available when creating answer');
      throw new Error('Local stream not initialized');
    }

    await peerConnection.setRemoteDescription(offer);
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    console.log('✅ WebRTC answer created for:', userId);
    return answer;
  }

  async handleAnswer(
    userId: string,
    answer: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log('📞 Handling WebRTC answer from:', userId);
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.setRemoteDescription(answer);
      console.log('✅ WebRTC answer handled for:', userId);
      console.log(
        '📊 Connection state after answer:',
        peerConnection.connectionState
      );
      console.log(
        '📊 ICE connection state:',
        peerConnection.iceConnectionState
      );
    } else {
      console.error('❌ No peer connection found for:', userId);
    }
  }

  async handleIceCandidate(
    userId: string,
    candidate: RTCIceCandidateInit
  ): Promise<void> {
    console.log('🧊 Received ICE candidate from:', userId);
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      await peerConnection.addIceCandidate(candidate);
      console.log('✅ ICE candidate added for:', userId);
    } else {
      console.error('❌ No peer connection found for ICE candidate:', userId);
    }
  }

  // Group call management
  async joinGroupCall(roomId: string): Promise<void> {
    // Initialize local stream if not already done
    if (!this.localStream) {
      await this.initializeLocalStream();
    }

    // Join the signaling room for group calls
    // This would connect to your WebSocket/Signaling server
    console.log('Joining group call room:', roomId);
  }

  leaveGroupCall(): void {
    // Clean up all peer connections
    this.peerConnections.forEach((peerConnection, userId) => {
      peerConnection.close();
      this.removeUser(userId);
    });
    this.peerConnections.clear();
    this.users.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    this.emit('call-ended');
  }

  // Utility methods
  private getOrCreatePeerConnection(userId: string): RTCPeerConnection {
    let peerConnection = this.peerConnections.get(userId);
    if (!peerConnection) {
      peerConnection = this.createPeerConnection(userId);
    }
    return peerConnection;
  }

  private addRemoteStream(userId: string, stream: MediaStream): void {
    const user = this.users.get(userId);
    if (user) {
      user.stream = stream;
      this.emit('user-joined', { userId, stream });
    }
  }

  private removeUser(userId: string): void {
    this.users.delete(userId);
    const peerConnection = this.peerConnections.get(userId);
    if (peerConnection) {
      peerConnection.close();
      this.peerConnections.delete(userId);
    }
    this.emit('user-left', { userId });
  }

  addUser(user: CallUser): void {
    this.users.set(user.id, user);
  }

  getUsers(): CallUser[] {
    return Array.from(this.users.values());
  }

  // Set WebSocket callback for signaling
  setSignalingCallback(callback: (message: any) => void): void {
    this.sendSignalingCallback = callback;
  }

  // Signaling (to be implemented with your WebSocket)
  sendSignalingMessage(userId: string, message: any): void {
    // This should send message via your WebSocket signaling server
    console.log('📞 WebRTC sending signaling message to', userId, ':', message);

    if (this.sendSignalingCallback) {
      this.sendSignalingCallback({
        ...message,
        targetUserId: userId,
      });
    } else {
      console.error(
        '❌ WebSocket callback not set - cannot send signaling message'
      );
    }
  }

  // Cleanup
  destroy(): void {
    this.leaveGroupCall();
    this.eventListeners.clear();
  }

  // Getters
  isAudioMuted(): boolean {
    return !this.isAudioEnabled;
  }

  isVideoOff(): boolean {
    return !this.isVideoEnabled;
  }

  isInCall(): boolean {
    return this.localStream !== null;
  }
}

// Singleton instance
export const webrtcService = new WebRTCService();
