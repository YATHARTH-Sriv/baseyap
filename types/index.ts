export interface User {
  id: string;
  isHost: boolean;
  socketId?: string;
}

export interface Room {
  id: string;
  host: string | null;
  participants: Map<string, User>;
}

export interface WebRTCConnection {
  userId: string;
  peerConnection: RTCPeerConnection;
  stream?: MediaStream;
}

export interface SignalingData {
  from: string;
  to: string;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface AudioState {
  isRecording: boolean;
  isMuted: boolean;
  stream: MediaStream | null;
}