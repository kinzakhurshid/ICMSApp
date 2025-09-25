import { EventEmitter } from 'events';
import { Alert, Platform } from 'react-native';

// Import React Native WebRTC for version 1.100.1
import {
  RTCPeerConnection,
  RTCSessionDescription,
  RTCIceCandidate,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';

// Define types for better TypeScript support
interface RTCConfiguration {
  iceServers: { urls: string }[];
}

interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

interface RTCIceCandidateInit {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

// Extended interface for legacy methods
interface RTCPeerConnectionLegacy extends RTCPeerConnection {
  addStream?: (stream: MediaStream) => void;
  removeStream?: (stream: MediaStream) => void;
  onaddstream?: ((this: RTCPeerConnection, ev: Event) => any) | null;
}

class WebRTCManager extends EventEmitter {
  private peerConnection: RTCPeerConnectionLegacy | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };
  private isInitialized: boolean = false;
  private iceGenerationStopped: boolean = false;
  private isLegacyAPI: boolean = false;
// In your WebRTCManager, add this method for Android compatibility
private setupAndroidCompatibility(): void {
    if (Platform.OS !== 'android') return;
    
    // Android-specific WebRTC fixes
    try {
        // Polyfill for Android WebRTC issues
        if (typeof (global as any).RTCPeerConnection === 'undefined') {
            (global as any).RTCPeerConnection = require('react-native-webrtc').RTCPeerConnection;
        }
        
        if (typeof (global as any).RTCSessionDescription === 'undefined') {
            (global as any).RTCSessionDescription = require('react-native-webrtc').RTCSessionDescription;
        }
        
        if (typeof (global as any).RTCIceCandidate === 'undefined') {
            (global as any).RTCIceCandidate = require('react-native-webrtc').RTCIceCandidate;
        }
        
        if (typeof (global as any).mediaDevices === 'undefined') {
            (global as any).mediaDevices = require('react-native-webrtc').mediaDevices;
        }
        
        console.log('✅ Android WebRTC compatibility setup completed');
    } catch (error) {
        console.error('❌ Android WebRTC compatibility setup failed:', error);
    }
}

// Call this in your initialize method

  // Initialize WebRTC connection with explicit type parameter
  async initialize(callType: 'voice' | 'video' = 'voice'): Promise<boolean> {
    try {
      console.log('🚀 Initializing WebRTC for call type:', callType);
        try {
        // Add Android compatibility setup
        this.setupAndroidCompatibility();
        
        // Rest of your existing code...
        if (Platform.OS === 'android') {
            console.log('🔄 Android-specific WebRTC initialization');
            // Add small delay for Android to initialize properly
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Continue with your existing initialization...
    } catch (error) {
        console.error('❌ WebRTC initialization failed:', error);
        return false;
    }
      // Check if WebRTC is available
      if (!RTCPeerConnection) {
        throw new Error('WebRTC is not available');
      }

      // Close existing connection if any
      this.close();

      this.peerConnection = new RTCPeerConnection(this.configuration) as RTCPeerConnectionLegacy;
      this.iceGenerationStopped = false;

      // Detect API version
      this.detectAPIVersion();

      // Setup event listeners
      this.setupPeerConnectionListeners();

      // Get local media based on call type
      await this.getLocalMedia(callType === 'video');

      this.isInitialized = true;
      console.log('✅ WebRTC initialized successfully for', callType, 'call');
      this.emit('initialized', { callType, success: true });
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC:', error);
      this.emit('initialized', { callType, success: false, error });
      Alert.alert('WebRTC Error', `Failed to initialize ${callType} call functionality`);
      return false;
    }
  }

  // Detect if we're using legacy API (addStream) or modern API (addTrack)
  private detectAPIVersion(): void {
    if (!this.peerConnection) return;

    // Check if addTrack method exists (modern API)
    if (typeof (this.peerConnection as any).addTrack === 'function') {
      this.isLegacyAPI = false;
      console.log('🔍 Using modern WebRTC API (addTrack)');
    } 
    // Check if addStream method exists (legacy API)
    else if (typeof (this.peerConnection as any).addStream === 'function') {
      this.isLegacyAPI = true;
      console.log('🔍 Using legacy WebRTC API (addStream)');
    } else {
      // Default to modern API and hope for the best
      this.isLegacyAPI = false;
      console.warn('⚠️ Cannot detect WebRTC API version, defaulting to modern API');
    }
  }

  // Initialize WebRTC without media (for receiving calls)
  async initializeWithoutMedia(): Promise<boolean> {
    try {
      console.log('🚀 Initializing WebRTC without media...');
      
      if (!RTCPeerConnection) {
        throw new Error('WebRTC is not available');
      }

      this.close();
      this.peerConnection = new RTCPeerConnection(this.configuration) as RTCPeerConnectionLegacy;
      this.iceGenerationStopped = false;
      this.detectAPIVersion();
      this.setupPeerConnectionListeners();

      this.isInitialized = true;
      console.log('✅ WebRTC initialized without media successfully');
      this.emit('initialized', { callType: 'voice', success: true });
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC without media:', error);
      this.emit('initialized', { callType: 'voice', success: false, error });
      return false;
    }
  }

  // Method to stop ICE candidate generation
  stopIceGeneration(): void {
    if (this.iceGenerationStopped) return;
    
    console.log('🛑 WebRTCManager: Stopping ICE candidate generation');
    this.iceGenerationStopped = true;
    
    // Remove ICE candidate handler to prevent further calls
    if (this.peerConnection) {
      this.peerConnection.onicecandidate = null;
      console.log('✅ ICE candidate handler removed');
    }
  }

  // Setup peer connection event listeners
  private setupPeerConnectionListeners(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = (event: any) => {
      // Check if ICE generation has been stopped
      if (this.iceGenerationStopped) {
        console.log('🛑 WebRTCManager: ICE generation stopped, ignoring candidate');
        return;
      }

      if (event.candidate) {
        console.log('🧊 ICE candidate generated:', {
          candidate: event.candidate.candidate?.substring(0, 50) + '...',
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        });
        this.emit('iceCandidate', event.candidate);
      } else {
        console.log('🧊 ICE candidate generation complete');
        this.emit('iceCandidate', null);
      }
    };

    // Handle remote stream based on API version
    if (this.isLegacyAPI) {
      // Legacy API: onaddstream
      (this.peerConnection as any).onaddstream = (event: any) => {
        console.log('📹 Remote stream received (legacy API)');
        if (event.stream) {
          this.remoteStream = event.stream;
          this.emit('remoteStream', this.remoteStream);
          console.log('✅ Remote stream set via legacy API');
        }
      };
    } else {
      // Modern API: ontrack
      this.peerConnection.ontrack = (event: any) => {
        console.log('📹 Remote track received:', event.track?.kind);
        if (event.streams && event.streams[0]) {
          this.remoteStream = event.streams[0];
          this.emit('remoteStream', this.remoteStream);
          
          // Listen for track ended events
          event.track.onended = () => {
            console.log('🔴 Remote track ended');
            this.emit('remoteTrackEnded', event.track);
          };
        }
      };
    }

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔌 Connection state changed:', state);
      this.emit('connectionStateChange', state);

      switch (state) {
        case 'connected':
          console.log('✅ WebRTC connection established');
          this.emit('connected');
          break;
        case 'disconnected':
          console.log('⚠️ WebRTC connection disconnected');
          this.emit('disconnected');
          break;
        case 'failed':
          console.log('❌ WebRTC connection failed');
          this.emit('connectionFailed');
          break;
        case 'closed':
          console.log('🔴 WebRTC connection closed');
          this.stopIceGeneration();
          this.emit('closed');
          break;
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('❄️ ICE connection state changed:', state);
      this.emit('iceConnectionStateChange', state);

      switch (state) {
        case 'connected':
          console.log('✅ ICE connection established');
          break;
        case 'disconnected':
          console.log('⚠️ ICE connection disconnected');
          break;
        case 'failed':
          console.log('❌ ICE connection failed');
          this.emit('iceConnectionFailed');
          break;
        case 'completed':
          console.log('✅ ICE gathering completed');
          this.stopIceGeneration();
          break;
        case 'closed':
          console.log('🔴 ICE connection closed');
          this.stopIceGeneration();
          break;
      }
    };

    this.peerConnection.onsignalingstatechange = () => {
      const state = this.peerConnection?.signalingState;
      console.log('📡 Signaling state changed:', state);
      this.emit('signalingStateChange', state);
    };

    this.peerConnection.onicegatheringstatechange = () => {
      const state = this.peerConnection?.iceGatheringState;
      console.log('🌐 ICE gathering state changed:', state);
      this.emit('iceGatheringStateChange', state);

      if (state === 'complete') {
        this.stopIceGeneration();
      }
    };

    this.peerConnection.onnegotiationneeded = () => {
      console.log('🔄 Negotiation needed');
      this.emit('negotiationNeeded');
    };

    if (typeof this.peerConnection.ondatachannel !== 'undefined') {
      this.peerConnection.ondatachannel = (event: any) => {
        console.log('📨 Data channel received:', event.channel.label);
        this.emit('dataChannel', event.channel);
      };
    }
  }

  // Get local media (audio/video) with compatibility for both APIs
  async getLocalMedia(isVideoCall: boolean = true): Promise<MediaStream | null> {
    try {
      console.log('🎥 Getting local media for:', isVideoCall ? 'video call' : 'voice call');
      
      const constraints: any = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: isVideoCall ? {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        } : false
      };

      console.log('📋 Media constraints:', constraints);
      
      const stream = await mediaDevices.getUserMedia(constraints);
      this.localStream = stream;

      console.log('✅ Local media obtained - Audio tracks:', stream.getAudioTracks().length, 
                 'Video tracks:', stream.getVideoTracks().length);

      // Add tracks/stream to peer connection based on API version
      if (this.peerConnection && this.localStream) {
        if (this.isLegacyAPI) {
          // Legacy API: use addStream
          if (typeof (this.peerConnection as any).addStream === 'function') {
            (this.peerConnection as any).addStream(this.localStream);
            console.log('➕ Added stream to peer connection (legacy API)');
          } else {
            console.error('❌ addStream method not available');
            throw new Error('addStream method not available in legacy API');
          }
        } else {
          // Modern API: use addTrack for each track
          if (typeof (this.peerConnection as any).addTrack === 'function') {
            this.localStream.getTracks().forEach((track) => {
              (this.peerConnection as any).addTrack(track, this.localStream!);
              console.log('➕ Added track to peer connection:', track.kind, track.id);
            });
          } else {
            console.error('❌ addTrack method not available');
            throw new Error('addTrack method not available in modern API');
          }
        }

        // Listen for track ended events
        this.localStream.getTracks().forEach((track) => {
          track.onended = () => {
            console.log('🔴 Local track ended:', track.kind, track.id);
            this.emit('localTrackEnded', track);
          };
        });
      }

      this.emit('localStream', this.localStream);
      return this.localStream;
    } catch (error: any) {
      console.error('❌ Failed to get local media:', error);
      
      let errorMessage = 'Cannot access camera/microphone. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please check permissions and allow access to microphone' + 
                       (isVideoCall ? ' and camera.' : '.');
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No media devices found.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Media not supported on this device.';
      } else {
        errorMessage += 'Please check your device settings.';
      }
      
      Alert.alert('Media Error', errorMessage);
      this.emit('mediaError', error);
      throw error;
    }
  }

  // Add local media to existing peer connection
  async addLocalMedia(isVideoCall: boolean = true): Promise<MediaStream | null> {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      const stream = await this.getLocalMedia(isVideoCall);
      return stream;
    } catch (error) {
      console.error('❌ Failed to add local media:', error);
      throw error;
    }
  }

  // Create offer with better error handling
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('📤 Creating offer...');
      
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: this.isVideoCall(),
        voiceActivityDetection: true
      };

      const offer = await this.peerConnection.createOffer(offerOptions);
      console.log('✅ Offer created:', offer.type);
      
      await this.peerConnection.setLocalDescription(offer);
      console.log('✅ Local description set');
      
      return offer;
    } catch (error) {
      console.error('❌ Failed to create offer:', error);
      this.emit('offerError', error);
      throw error;
    }
  }

  // Create answer with better error handling
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('📥 Creating answer...');
      
      const answerOptions = {
        voiceActivityDetection: true
      };

      const answer = await this.peerConnection.createAnswer(answerOptions);
      console.log('✅ Answer created:', answer.type);
      
      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Local description set');
      
      return answer;
    } catch (error) {
      console.error('❌ Failed to create answer:', error);
      this.emit('answerError', error);
      throw error;
    }
  }

  // Set remote description with validation
  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    if (!description || !description.type) {
      throw new Error('Invalid remote description');
    }

    try {
      console.log('📋 Setting remote description:', description.type);
      const rtcDescription = new RTCSessionDescription(description);
      await this.peerConnection.setRemoteDescription(rtcDescription);
      console.log('✅ Remote description set successfully');
      this.emit('remoteDescriptionSet', description.type);
    } catch (error) {
      console.error('❌ Failed to set remote description:', error);
      this.emit('remoteDescriptionError', error);
      throw error;
    }
  }

  // Add ICE candidate with validation
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      console.warn('⚠️ Peer connection not available for ICE candidate');
      return;
    }

    if (!candidate) {
      console.warn('⚠️ Invalid ICE candidate');
      return;
    }

    try {
      console.log('➕ Adding ICE candidate:', {
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        candidate: candidate.candidate?.substring(0, 50) + '...'
      });
      
      const iceCandidate = new RTCIceCandidate(candidate);
      await this.peerConnection.addIceCandidate(iceCandidate);
      console.log('✅ ICE candidate added successfully');
    } catch (error) {
      console.warn('⚠️ Failed to add ICE candidate (non-critical):', error);
    }
  }

  // Toggle audio with state tracking
  toggleAudio(enabled: boolean): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = enabled;
      });
      console.log('🎙️ Audio toggled:', enabled ? 'ON' : 'OFF');
      this.emit('audioToggled', enabled);
      return true;
    }
    console.warn('⚠️ No local stream available for audio toggle');
    return false;
  }

  // Toggle video with state tracking
  toggleVideo(enabled: boolean): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = enabled;
      });
      console.log('📹 Video toggled:', enabled ? 'ON' : 'OFF');
      this.emit('videoToggled', enabled);
      return true;
    }
    console.warn('⚠️ No local stream available for video toggle');
    return false;
  }

  // Switch camera with better error handling
  async switchCamera(): Promise<boolean> {
    if (!this.localStream) {
      console.warn('⚠️ No local stream available for camera switch');
      return false;
    }

    try {
      console.log('🔄 Switching camera...');
      
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (!videoTrack) {
        console.warn('⚠️ No video track available for camera switch');
        return false;
      }

      const settings = videoTrack.getSettings();
      const facingMode = settings.facingMode === 'user' ? 'environment' : 'user';

      console.log('📸 Switching to camera:', facingMode);

      const constraints: any = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: false,
      };

      const newStream = await mediaDevices.getUserMedia(constraints);
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (this.peerConnection) {
        if (this.isLegacyAPI) {
          // For legacy API, we need to renegotiate by creating a new offer
          console.log('🔄 Legacy API: camera switch requires renegotiation');
          // The simple approach is to close and reopen the connection
          // In a real app, you'd want to handle this more gracefully
        } else {
          // For modern API, replace the track
          const senders = (this.peerConnection as any).getSenders();
          if (senders && typeof senders.find === 'function') {
            const sender = senders.find((s: any) => s.track && s.track.kind === 'video');
            
            if (sender && typeof sender.replaceTrack === 'function') {
              await sender.replaceTrack(newVideoTrack);
              console.log('✅ Video track replaced in peer connection');
            }
          }
        }
      }

      // Replace track in local stream
      this.localStream.removeTrack(videoTrack);
      this.localStream.addTrack(newVideoTrack);
      
      // Clean up old track and stream
      videoTrack.stop();
      newStream.getTracks().forEach(track => {
        if (track !== newVideoTrack) track.stop();
      });
      
      console.log('✅ Camera switched successfully');
      this.emit('cameraSwitched', facingMode);
      this.emit('localStream', this.localStream);
      return true;

    } catch (error) {
      console.error('❌ Failed to switch camera:', error);
      Alert.alert('Camera Error', 'Failed to switch camera. Please check camera permissions.');
      return false;
    }
  }

  // Get user media for audio only (for voice calls)
  async getAudioOnly(): Promise<MediaStream | null> {
    return this.getLocalMedia(false);
  }

  // Check if current call is video call
  isVideoCall(): boolean {
    if (!this.localStream) return false;
    return this.localStream.getVideoTracks().length > 0;
  }

  // Check if WebRTC is initialized
  isWebRTCInitialized(): boolean {
    return this.isInitialized && this.peerConnection !== null;
  }

  // Close connection with proper cleanup
  close(): void {
    console.log('🔴 Closing WebRTC connection...');
    
    // Stop ICE generation first
    this.stopIceGeneration();
    
    // Stop all media tracks first
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('⏹️ Stopped local track:', track.kind, track.id);
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
        console.log('⏹️ Stopped remote track:', track.kind, track.id);
      });
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('✅ Peer connection closed');
    }

    this.isInitialized = false;
    this.removeAllListeners();
    console.log('✅ WebRTC connection fully closed');
    this.emit('closed');
  }

  // Restart ICE - useful for reconnection
  async restartIce(): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('🔄 Restarting ICE...');
      this.iceGenerationStopped = false;
      const offer = await this.peerConnection.createOffer({ iceRestart: true });
      await this.peerConnection.setLocalDescription(offer);
      console.log('✅ ICE restart initiated');
    } catch (error) {
      console.error('❌ Failed to restart ICE:', error);
      throw error;
    }
  }

  // Create data channel for additional communication
  createDataChannel(label: string = 'data'): any {
    if (!this.peerConnection) {
      console.warn('⚠️ Peer connection not available for data channel');
      return null;
    }

    try {
      if (typeof (this.peerConnection as any).createDataChannel === 'function') {
        const dataChannel = (this.peerConnection as any).createDataChannel(label);
        console.log('📨 Data channel created:', label);
        
        dataChannel.onopen = () => {
          console.log('✅ Data channel opened:', label);
          this.emit('dataChannelOpen', dataChannel);
        };
        
        dataChannel.onclose = () => {
          console.log('🔴 Data channel closed:', label);
          this.emit('dataChannelClose', dataChannel);
        };
        
        dataChannel.onmessage = (event: any) => {
          console.log('📩 Data channel message received:', event.data);
          this.emit('dataChannelMessage', { channel: dataChannel, data: event.data });
        };

        return dataChannel;
      } else {
        console.warn('⚠️ createDataChannel method not available');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to create data channel:', error);
      return null;
    }
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Check if peer connection exists
  hasPeerConnection(): boolean {
    return this.peerConnection !== null;
  }

  // Check if local stream exists
  hasLocalStream(): boolean {
    return this.localStream !== null;
  }

  // Check if remote stream exists
  hasRemoteStream(): boolean {
    return this.remoteStream !== null;
  }

  // Get connection state
  getConnectionState(): string {
    return this.peerConnection?.connectionState || 'disconnected';
  }

  // Get ICE connection state
  getIceConnectionState(): string {
    return this.peerConnection?.iceConnectionState || 'disconnected';
  }

  // Get signaling state
  getSignalingState(): string {
    return this.peerConnection?.signalingState || 'closed';
  }

  // Get configuration
  getConfiguration(): RTCConfiguration {
    return { ...this.configuration };
  }

  // Update configuration (useful for adding TURN servers)
  updateConfiguration(newConfig: RTCConfiguration): void {
    this.configuration = { ...this.configuration, ...newConfig };
    console.log('⚙️ Configuration updated');
  }

  // Check if ICE generation is stopped
  isIceGenerationStopped(): boolean {
    return this.iceGenerationStopped;
  }

  // Check if using legacy API
  isUsingLegacyAPI(): boolean {
    return this.isLegacyAPI;
  }
}

// Create and export a single instance
const webRTCManager = new WebRTCManager();
export default webRTCManager;