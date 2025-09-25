// Additional type definitions for React Native WebRTC
declare module 'react-native-webrtc' {
  export interface MediaStream extends globalThis.MediaStream {}
  export interface MediaStreamTrack extends globalThis.MediaStreamTrack {}
  export interface RTCSessionDescription extends globalThis.RTCSessionDescription {}
  export interface RTCIceCandidate extends globalThis.RTCIceCandidate {}
  export interface RTCPeerConnection extends globalThis.RTCPeerConnection {}

  export const mediaDevices: {
    getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream>;
    enumerateDevices(): Promise<InputDeviceInfo[]>;
  };

  export const RTCPeerConnection: {
    new(configuration?: RTCConfiguration): RTCPeerConnection;
  };

  export const RTCSessionDescription: {
    new(descriptionInitDict: RTCSessionDescriptionInit): RTCSessionDescription;
  };

  export const RTCIceCandidate: {
    new(candidateInitDict?: RTCIceCandidateInit): RTCIceCandidate;
  };
}