import { useState, useEffect, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';
import { User, WebRTCConnection, AudioState } from '../types';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const useWebRTC = (roomId: string, userId: string, isHost: boolean) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [audioState, setAudioState] = useState<AudioState>({
    isRecording: false,
    isMuted: false,
    stream: null
  });
  
  const connectionsRef = useRef<Map<string, WebRTCConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Join room when socket is ready
  useEffect(() => {
    if (socket && roomId && userId) {
      socket.emit('join-room', roomId, userId, isHost);
    }
  }, [socket, roomId, userId, isHost]);

  // Setup socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('room-participants', (participantsList: User[]) => {
      console.log('Room participants:', participantsList);
      setParticipants(participantsList);
    });

    socket.on('user-joined', ({ userId: newUserId, isHost: newUserIsHost }) => {
      console.log('User joined:', newUserId, 'isHost:', newUserIsHost);
      setParticipants(prev => [...prev, { id: newUserId, isHost: newUserIsHost }]);
      
      // If we're the host and a listener joins, create connection
      if (isHost && !newUserIsHost && localStreamRef.current) {
        console.log('Host creating connection for new listener:', newUserId);
        createConnectionAndOffer(newUserId);
      }
    });

    socket.on('user-left', (leftUserId: string) => {
      console.log('User left:', leftUserId);
      setParticipants(prev => prev.filter(p => p.id !== leftUserId));
      
      // Clean up connection
      const connection = connectionsRef.current.get(leftUserId);
      if (connection) {
        connection.peerConnection.close();
        connectionsRef.current.delete(leftUserId);
      }
    });

    socket.on('offer', async ({ offer, from }) => {
      console.log('Received offer from:', from);
      await handleOffer(offer, from);
    });

    socket.on('answer', async ({ answer, from }) => {
      console.log('Received answer from:', from);
      await handleAnswer(answer, from);
    });

    socket.on('ice-candidate', ({ candidate, from }) => {
      console.log('Received ICE candidate from:', from);
      handleIceCandidate(candidate, from);
    });

    return () => {
      socket.off('room-participants');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
    };
  }, [socket, isHost]);

  const createPeerConnection = useCallback((remoteUserId: string) => {
    console.log('Creating peer connection for:', remoteUserId);
    const peerConnection = new RTCPeerConnection(STUN_SERVERS);
    
    // Add local stream if we're the host
    if (isHost && localStreamRef.current) {
      console.log('Adding local stream tracks to peer connection');
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Adding track:', track.kind, track.enabled);
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from:', remoteUserId);
      const [remoteStream] = event.streams;
      console.log('Remote stream tracks:', remoteStream.getTracks().length);
      
      // Create audio element and play
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.autoplay = true;
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        // Try playing after user interaction
        document.addEventListener('click', () => {
          audio.play();
        }, { once: true });
      });
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('Sending ICE candidate to:', remoteUserId);
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          from: userId,
          to: remoteUserId
        });
      }
    };

    // Connection state monitoring
    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state changed:', peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
    };

    connectionsRef.current.set(remoteUserId, {
      userId: remoteUserId,
      peerConnection
    });

    return peerConnection;
  }, [socket, userId, isHost]);

  const createConnectionAndOffer = useCallback(async (remoteUserId: string) => {
    const peerConnection = createPeerConnection(remoteUserId);
    
    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      console.log('Sending offer to:', remoteUserId);
      if (socket) {
        socket.emit('offer', {
          offer: offer,
          from: userId,
          to: remoteUserId
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [createPeerConnection, socket, userId]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, from: string) => {
    console.log('Handling offer from:', from);
    const peerConnection = createPeerConnection(from);
    
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log('Sending answer to:', from);
      if (socket) {
        socket.emit('answer', {
          answer: answer,
          from: userId,
          to: from
        });
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [createPeerConnection, socket, userId]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit, from: string) => {
    console.log('Handling answer from:', from);
    const connection = connectionsRef.current.get(from);
    if (connection) {
      try {
        await connection.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote description set successfully');
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    } else {
      console.error('No peer connection found for:', from);
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit, from: string) => {
    console.log('Handling ICE candidate from:', from);
    const connection = connectionsRef.current.get(from);
    if (connection) {
      try {
        await connection.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('ICE candidate added successfully');
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    } else {
      console.error('No peer connection found for ICE candidate from:', from);
    }
  }, []);

  const startAudio = useCallback(async () => {
    if (!isHost) {
      console.log('Only hosts can start audio');
      return;
    }

    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Microphone access granted, stream tracks:', stream.getTracks().length);
      localStreamRef.current = stream;
      
      setAudioState(prev => ({
        ...prev,
        isRecording: true,
        stream
      }));

      // Add stream to existing connections
      connectionsRef.current.forEach(({ peerConnection, userId: connectionUserId }) => {
        console.log('Adding stream to existing connection:', connectionUserId);
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
      });

      // Create offers for all listeners that don't have connections yet
      const listeners = participants.filter(p => !p.isHost && p.id !== userId);
      console.log('Creating connections for listeners:', listeners.map(l => l.id));
      
      for (const listener of listeners) {
        if (!connectionsRef.current.has(listener.id)) {
          await createConnectionAndOffer(listener.id);
        }
      }
    } catch (error) {
      console.error('Error starting audio:', error);
      alert('Failed to access microphone. Please check permissions.');
    }
  }, [isHost, participants, socket, userId, createConnectionAndOffer]);

  const stopAudio = useCallback(() => {
    console.log('Stopping audio...');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      localStreamRef.current = null;
    }
    
    setAudioState(prev => ({
      ...prev,
      isRecording: false,
      isMuted: false,
      stream: null
    }));
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log('Audio track', audioTrack.enabled ? 'enabled' : 'disabled');
        setAudioState(prev => ({
          ...prev,
          isMuted: !audioTrack.enabled
        }));
      }
    }
  }, []);

  return {
    participants,
    audioState,
    startAudio,
    stopAudio,
    toggleMute
  };
};