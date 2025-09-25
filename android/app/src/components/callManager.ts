import { EventEmitter } from 'events';
import { Alert, Platform, Vibration } from 'react-native';
import Sound from 'react-native-sound';
import { Socket } from 'socket.io-client';
import { User } from '../types/chattypes';
import webRTCManager from './WebRTCManeger';

export interface CallData {
  callId: string;
  caller: {
    _id: string;
    name: string;
    avatar?: string;
  };
  receiver: {
    _id: string;
    name: string;
    avatar?: string;
  };
  type: 'voice' | 'video';
  status: 'calling' | 'ringing' | 'ongoing' | 'ended' | 'missed' | 'rejected';
  startedAt?: Date;
  endedAt?: Date;
}

class CallManager extends EventEmitter {
  private currentCall: CallData | null = null;
  private ringtone: Sound | null = null;
  private isInitiator: boolean = false;
  private socket: Socket | null = null;
  private socketConnected: boolean = false;
  private isRinging: boolean = false;
  private currentUser: User | null = null;
  private vibrationInterval: NodeJS.Timeout | null = null;
  
  // Call state tracking
  private callState: 'idle' | 'calling' | 'ringing' | 'ongoing' | 'ending' = 'idle';
  
  // WebRTC related properties
  private iceCandidatesQueue: any[] = [];
  private iceGenerationStopped: boolean = false;

  initialize(currentUser: User) {
    this.currentUser = currentUser;
    this.setupRingtone();
    
    // Setup WebRTC event listeners
    this.setupWebRTCListeners();
  }

  setSocket(socket: Socket | null) {
    this.socket = socket;
    this.socketConnected = socket?.connected || false;
    
    if (socket) {
      this.setupSocketListeners();
    }
  }

  setCurrentUser(currentUser: User) {
    this.currentUser = currentUser;
  }

  // Setup WebRTC event listeners
  private setupWebRTCListeners(): void {
    webRTCManager.on('iceCandidate', (candidate: any) => {
      this.handleIceCandidate(candidate);
    });

    webRTCManager.on('remoteStream', (stream: any) => {
      console.log('📹 Remote stream received in CallManager');
      this.emit('remoteStream', stream);
    });

    webRTCManager.on('localStream', (stream: any) => {
      console.log('📹 Local stream ready in CallManager');
      this.emit('localStream', stream);
    });

    webRTCManager.on('connectionStateChange', (state: string) => {
      console.log('🔌 WebRTC connection state:', state);
      this.emit('connectionStateChange', state);
    });

    webRTCManager.on('iceConnectionStateChange', (state: string) => {
      console.log('❄️ WebRTC ICE connection state:', state);
      this.emit('iceConnectionStateChange', state);
    });

    webRTCManager.on('initialized', (data: any) => {
      console.log('✅ WebRTC initialized in CallManager:', data);
      if (data.success && this.currentCall) {
        this.emit('webRTCReady', this.currentCall);
        this.startWebRTCNegotiation();
      } else {
        this.emit('webRTCError', data.error);
      }
    });
  }

  private isCallActive(): boolean {
    return this.callState === 'calling' || this.callState === 'ringing' || this.callState === 'ongoing';
  }

  // ICE candidate handler
  private handleIceCandidate(candidate: any) {
    if (this.iceGenerationStopped) {
      console.log('🛑 ICE generation stopped, ignoring candidate');
      return;
    }

    if (!this.isCallActive() || !this.currentCall) {
      console.log('❌ Ignoring ICE candidate - call not active');
      this.stopIceGeneration();
      return;
    }

    if (!candidate) {
      console.log('🧊 ICE candidate generation complete');
      return;
    }

    console.log('🧊 ICE candidate generated in CallManager');

    try {
      if (this.socket && this.socketConnected) {
        this.socket.emit('iceCandidate', {
          callId: this.currentCall.callId,
          candidate: candidate
        });
      } else {
        console.log('❌ Socket not connected, queuing ICE candidate');
        this.iceCandidatesQueue.push(candidate);
      }
    } catch (error) {
      console.error('❌ Error sending ICE candidate:', error);
    }
  }

  // Method to stop ICE candidate generation
  private stopIceGeneration() {
    if (this.iceGenerationStopped) return;
    
    console.log('🛑 Stopping ICE candidate generation in CallManager');
    this.iceGenerationStopped = true;
    webRTCManager.stopIceGeneration();
  }

  // Socket listeners
  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('callInvite', (callData: CallData) => {
      console.log('📞 Received call invite:', callData.callId);
      this.receiveIncomingCall(callData);
    });

    this.socket.on('callAccepted', (data: { callId: string }) => {
      console.log('✅ Call accepted:', data.callId);
      if (!this.currentCall || this.currentCall.callId !== data.callId) {
        console.log('❌ Call ID mismatch or no current call');
        return;
      }
      
      this.currentCall.status = 'ongoing';
      this.callState = 'ongoing';
      this.emit('callAccepted', this.currentCall);
    });

    this.socket.on('callRejected', (data: { callId: string; reason?: string }) => {
      console.log('❌ Call rejected:', data.callId);
      if (!this.currentCall || this.currentCall.callId !== data.callId) {
        return;
      }
      
      this.stopRingtone();
      this.currentCall.status = 'rejected';
      this.currentCall.endedAt = new Date();
      this.callState = 'idle';
      this.emit('callRejected', this.currentCall);
      this.cleanupCallResources();
    });

    this.socket.on('callEnded', (data: { callId: string }) => {
      console.log('📵 Call ended via socket:', data.callId);
      if (this.currentCall && this.currentCall.callId === data.callId) {
        this.stopRingtone();
        this.currentCall.status = 'ended';
        this.currentCall.endedAt = new Date();
        this.callState = 'idle';
        this.emit('callEnded', this.currentCall);
        this.saveCallHistory();
        this.cleanupCallResources();
      }
    });

    // ICE candidate listener
    this.socket.on('iceCandidate', (data: { callId: string; candidate: any }) => {
      console.log('📨 Received ICE candidate for call:', data.callId);
      
      if (!this.isCallActive() || !this.currentCall || this.currentCall.callId !== data.callId) {
        console.log('❌ Ignoring ICE candidate - call not active or ID mismatch');
        return;
      }

      if (!data.candidate) return;

      try {
        webRTCManager.addIceCandidate(data.candidate)
          .then(() => {
            console.log('✅ ICE candidate added successfully');
          })
          .catch((error: any) => {
            console.error('❌ Error adding ICE candidate:', error);
          });
      } catch (error) {
        console.error('❌ Exception adding ICE candidate:', error);
      }
    });

    // Socket connection status listeners
    this.socket.on('connect', () => {
      this.socketConnected = true;
      console.log('🔌 CallManager: Socket connected');
    });

    this.socket.on('disconnect', () => {
      this.socketConnected = false;
      console.log('🔌 CallManager: Socket disconnected');
      
      if (this.isCallActive()) {
        console.log('⚠️ Socket disconnected during active call');
        this.emit('callError', new Error('Connection lost'));
        this.cleanupCallResources();
      }
    });
  }

  // Start WebRTC negotiation (create offer)
  private async startWebRTCNegotiation() {
    if (!this.currentCall || !this.isCallActive()) {
      console.log('❌ Cannot start WebRTC negotiation - call not active');
      return;
    }

    try {
      console.log('🔄 Starting WebRTC negotiation...');
      
      if (this.isInitiator) {
        const offer = await webRTCManager.createOffer();
        console.log('✅ Offer created, sending via socket');
        
        if (this.socket && this.socketConnected) {
          this.socket.emit('webrtcOffer', {
            callId: this.currentCall.callId,
            offer: offer
          });
        }
      }
    } catch (error) {
      console.error('❌ WebRTC negotiation failed:', error);
      this.emit('callError', error);
    }
  }

  // Handle incoming WebRTC offer
  async handleWebRTCOffer(offer: any) {
    if (!this.currentCall || !this.isCallActive()) {
      console.log('❌ Cannot handle WebRTC offer - call not active');
      return;
    }

    try {
      console.log('📥 Handling WebRTC offer');
      
      await webRTCManager.setRemoteDescription(offer);
      const answer = await webRTCManager.createAnswer();
      
      if (this.socket && this.socketConnected) {
        this.socket.emit('webrtcAnswer', {
          callId: this.currentCall.callId,
          answer: answer
        });
      }
    } catch (error) {
      console.error('❌ Failed to handle WebRTC offer:', error);
      this.emit('callError', error);
    }
  }

  // Handle incoming WebRTC answer
  async handleWebRTCAnswer(answer: any) {
    if (!this.currentCall || !this.isCallActive()) {
      console.log('❌ Cannot handle WebRTC answer - call not active');
      return;
    }

    try {
      console.log('📥 Handling WebRTC answer');
      await webRTCManager.setRemoteDescription(answer);
    } catch (error) {
      console.error('❌ Failed to handle WebRTC answer:', error);
      this.emit('callError', error);
    }
  }

  // Ringtone methods (same as before)
  private setupRingtone() {
    try {
      if (Platform.OS === 'ios') {
        console.log('Using vibration for iOS');
        this.ringtone = null;
        return;
      }

      this.ringtone = new Sound('beep.wav', Sound.MAIN_BUNDLE, (error) => {
        if (error) {
          console.log('Ringtone load failed, using vibration:', error);
          this.ringtone = null;
        }
      });
    } catch (error) {
      console.log('Ringtone setup error, using vibration:', error);
      this.ringtone = null;
    }
  }

  private playRingtone() {
    if (this.isRinging) return;
    console.log('Playing ringtone/vibration');
    
    try {
      if (this.ringtone) {
        this.ringtone.setNumberOfLoops(-1);
        this.ringtone.play((success) => {
          if (!success) this.startVibration();
        });
      } else {
        this.startVibration();
      }
      this.isRinging = true;
    } catch (error) {
      this.startVibration();
      this.isRinging = true;
    }
  }

  private stopRingtone() {
    console.log('Stopping ringtone/vibration');
    
    try {
      if (this.ringtone && this.isRinging) {
        this.ringtone.stop();
      }
      this.stopVibration();
      this.isRinging = false;
    } catch (error) {
      this.stopVibration();
      this.isRinging = false;
    }
  }

  private startVibration() {
    this.stopVibration();
    this.vibrationInterval = setInterval(() => {
      Vibration.vibrate(1000);
    }, 2000);
    Vibration.vibrate(1000);
  }

  private stopVibration() {
    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }
    Vibration.cancel();
  }

  private getMemberId(member: any): string {
    if (typeof member === 'string') return member;
    if (typeof member === 'object' && member !== null) {
      return member._id || member.id || '';
    }
    return '';
  }

  private getMemberName(member: any): string {
    if (typeof member === 'object' && member !== null) {
      return member.name || 'Unknown User';
    }
    return 'Unknown User';
  }

  private getMemberAvatar(member: any): string {
    if (typeof member === 'object' && member !== null) {
      return member.avatar || member.profilePic || '';
    }
    return '';
  }

  // Start a call
  async startCall(receiver: any, callType: 'voice' | 'video' = 'voice'): Promise<CallData | null> {
    try {
      if (!this.currentUser) {
        throw new Error('Current user not set');
      }

      if (this.isCallActive()) {
        throw new Error('Another call is already in progress');
      }

      const receiverId = this.getMemberId(receiver);
      const receiverName = this.getMemberName(receiver);
      
      if (!receiverId) {
        throw new Error('Invalid receiver');
      }

      const callData: CallData = {
        callId: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        caller: {
          _id: this.currentUser._id,
          name: this.currentUser.name,
          avatar: this.currentUser.avatar || this.currentUser.profilePic || '',
        },
        receiver: {
          _id: receiverId,
          name: receiverName,
          avatar: this.getMemberAvatar(receiver),
        },
        type: callType, // FIXED: Use callType parameter instead of undefined variable
        status: 'calling',
        startedAt: new Date(),
      };

      this.currentCall = callData;
      this.isInitiator = true;
      this.callState = 'calling';
      this.iceGenerationStopped = false;

      console.log('📞 Starting call:', callData.callId, 'Type:', callType);
      this.emit('callStarted', callData);

      // Initialize WebRTC
      const webrtcInitialized = await webRTCManager.initialize(callType);
      if (!webrtcInitialized) {
        throw new Error('Failed to initialize WebRTC');
      }

      if (this.socket && this.socketConnected) {
        this.socket.emit('callInvite', callData);
        console.log('📤 Call invitation sent via socket');
      } else {
        throw new Error('Socket not connected');
      }

      return callData;
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      this.emit('callError', error);
      this.cleanupCallResources();
      return null;
    }
  }

  receiveIncomingCall(callData: CallData) {
    if (this.isInCall()) {
      console.log('❌ Already in call, auto-rejecting busy call');
      this.autoRejectBusy(callData);
      return;
    }

    this.currentCall = callData;
    this.isInitiator = false;
    this.callState = 'ringing';
    this.iceGenerationStopped = false;

    this.playRingtone();
    this.emit('incomingCall', callData);

    console.log('📞 Incoming call received:', callData.callId, 'Type:', callData.type);
    this.showIncomingCallAlert(callData);
  }

  private autoRejectBusy(callData: CallData) {
    if (this.socket && this.socketConnected) {
      this.socket.emit('callRejected', { 
        callId: callData.callId, 
        reason: 'busy' 
      });
    }
  }

  private showIncomingCallAlert(callData: CallData) {
    Alert.alert(
      'Incoming Call',
      `${callData.caller.name} is calling you`,
      [
        {
          text: 'Reject',
          onPress: () => this.rejectCall(),
          style: 'destructive',
        },
        {
          text: 'Accept',
          onPress: () => this.acceptCall(),
        },
      ],
      { 
        cancelable: false,
        onDismiss: () => this.missedCall()
      }
    );
  }

  async acceptCall() {
    if (!this.currentCall) {
      console.log('❌ Cannot accept call: no current call');
      return;
    }

    this.stopRingtone();
    
    // Initialize WebRTC for receiving call
    const webrtcInitialized = await webRTCManager.initializeWithoutMedia();
    if (!webrtcInitialized) {
      this.emit('callError', new Error('Failed to initialize WebRTC'));
      return;
    }

    this.currentCall.status = 'ongoing';
    this.callState = 'ongoing';
    
    this.emit('callAccepted', this.currentCall);

    if (this.socket && this.socketConnected) {
      this.socket.emit('callAccepted', { callId: this.currentCall.callId });
      console.log('✅ Call acceptance notified via socket');
    }
  }

  async rejectCall() {
    if (!this.currentCall) return;

    this.stopRingtone();
    this.currentCall.status = 'rejected';
    this.currentCall.endedAt = new Date();
    this.callState = 'idle';
    
    this.emit('callRejected', this.currentCall);

    if (this.socket && this.socketConnected) {
      this.socket.emit('callRejected', { callId: this.currentCall.callId });
    }

    this.cleanupCallResources();
  }

  private missedCall() {
    if (!this.currentCall) return;

    this.stopRingtone();
    this.currentCall.status = 'missed';
    this.currentCall.endedAt = new Date();
    this.callState = 'idle';
    
    this.emit('callMissed', this.currentCall);
    this.saveCallHistory();
    this.cleanupCallResources();
  }

  async endCall() {
    if (!this.currentCall) {
      console.log('❌ No active call to end');
      return;
    }

    if (this.callState === 'ending') {
      console.log('⚠️ Call ending already in progress');
      return;
    }

    console.log('📵 Ending call:', this.currentCall.callId);
    this.callState = 'ending';
    this.stopRingtone();
    this.stopIceGeneration();

    this.currentCall.status = 'ended';
    this.currentCall.endedAt = new Date();
    
    this.emit('callEnded', this.currentCall);

    if (this.socket && this.socketConnected) {
      this.socket.emit('callEnded', { callId: this.currentCall.callId });
    }

    await this.saveCallHistory();
    this.cleanupCallResources();
  }

  private cleanupCallResources() {
    console.log('🧹 Cleaning up call resources');
    
    this.stopIceGeneration();
    webRTCManager.close();
    
    this.iceCandidatesQueue = [];
    this.currentCall = null;
    this.callState = 'idle';
    this.isInitiator = false;
    this.isRinging = false;
    
    console.log('✅ Call cleanup completed');
  }

  private async saveCallHistory() {
    if (!this.currentCall) return;
    
    try {
      console.log('💾 Saving call history:', this.currentCall.callId);
      this.emit('callHistorySaved', this.currentCall);
    } catch (error) {
      console.error('❌ Error saving call history:', error);
    }
  }

  // Public methods
  getCurrentCall(): CallData | null {
    return this.currentCall;
  }

  isInCall(): boolean {
    return this.isCallActive();
  }

  isSocketConnected(): boolean {
    return this.socketConnected;
  }

  getCallState(): string {
    return this.callState;
  }

  isCallInitiator(): boolean {
    return this.isInitiator;
  }

  // WebRTC control methods
  toggleAudio(enabled: boolean): boolean {
    return webRTCManager.toggleAudio(enabled);
  }

  toggleVideo(enabled: boolean): boolean {
    return webRTCManager.toggleVideo(enabled);
  }

  switchCamera(): Promise<boolean> {
    return webRTCManager.switchCamera();
  }

  getLocalStream() {
    return webRTCManager.getLocalStream();
  }

  getRemoteStream() {
    return webRTCManager.getRemoteStream();
  }

  cleanup() {
    console.log('🧹 Cleaning up call manager');
    this.stopRingtone();
    this.stopIceGeneration();
    webRTCManager.close();
    
    if (this.ringtone) {
      this.ringtone.release();
      this.ringtone = null;
    }
    
    this.removeAllListeners();
    console.log('✅ Call manager cleanup completed');
  }
}

export const callManager = new CallManager();