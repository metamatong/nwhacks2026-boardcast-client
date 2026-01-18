import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebRTCProps {
  roomId: string | null;
  isHost: boolean;
  localStream?: MediaStream | null;
  signalingUrl: string;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'host-ready';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  from?: string;
  to?: string;
}

export function useWebRTC({ roomId, isHost, localStream, signalingUrl }: UseWebRTCProps) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<string>('new');
  
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(7));
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // ICE servers configuration (STUN/TURN)
  const iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  // Send signaling message
  const sendSignal = useCallback((message: SignalingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        from: clientIdRef.current,
      }));
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(iceServers);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      setConnectionState(pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsConnected(true);
      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setIsConnected(false);
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [sendSignal]);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    const pc = peerConnectionRef.current;

    switch (message.type) {
      case 'host-ready':
        // Participant: Host is ready, send join request
        if (!isHost) {
          sendSignal({ type: 'join' });
        }
        break;

      case 'join':
        // Host: Participant wants to join, create offer
        if (isHost && pc) {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal({
              type: 'offer',
              sdp: pc.localDescription!,
              to: message.from,
            });
          } catch (error) {
            console.error('Error creating offer:', error);
          }
        }
        break;

      case 'offer':
        // Participant: Received offer from host
        if (!isHost && pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(message.sdp!));
            
            // Add any pending ICE candidates
            for (const candidate of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidatesRef.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal({
              type: 'answer',
              sdp: pc.localDescription!,
              to: message.from,
            });
          } catch (error) {
            console.error('Error handling offer:', error);
          }
        }
        break;

      case 'answer':
        // Host: Received answer from participant
        if (isHost && pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(message.sdp!));
            
            // Add any pending ICE candidates
            for (const candidate of pendingCandidatesRef.current) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            }
            pendingCandidatesRef.current = [];
          } catch (error) {
            console.error('Error handling answer:', error);
          }
        }
        break;

      case 'ice-candidate':
        // Both: Add ICE candidate
        if (pc) {
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(message.candidate!));
            } else {
              // Queue candidate if remote description not set yet
              pendingCandidatesRef.current.push(message.candidate!);
            }
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        }
        break;
    }
  }, [isHost, sendSignal]);

  // Initialize WebSocket and peer connection
  useEffect(() => {
    if (!roomId) return;

    // Create peer connection
    const pc = createPeerConnection();

    // If host, add local stream tracks
    if (isHost && localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Connect to signaling server
    const wsUrl = `${signalingUrl}${roomId}/`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebRTC signaling connected');
      if (isHost) {
        // Host announces readiness
        sendSignal({ type: 'host-ready' });
      } else {
        // Participant requests to join
        sendSignal({ type: 'join' });
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Don't process our own messages
        if (message.from !== clientIdRef.current) {
          handleSignalingMessage(message);
        }
      } catch (error) {
        console.error('Error parsing signaling message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
    };

    return () => {
      // Cleanup
      if (pc) {
        pc.close();
      }
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      peerConnectionRef.current = null;
      wsRef.current = null;
      setRemoteStream(null);
      setIsConnected(false);
    };
  }, [roomId, isHost, localStream, signalingUrl, createPeerConnection, handleSignalingMessage, sendSignal]);

  // Update tracks when local stream changes (for host)
  useEffect(() => {
    const pc = peerConnectionRef.current;
    if (!pc || !isHost || !localStream) return;

    // Get current senders
    const senders = pc.getSenders();
    
    // Update or add tracks
    localStream.getTracks().forEach((track) => {
      const sender = senders.find((s) => s.track?.kind === track.kind);
      if (sender) {
        sender.replaceTrack(track);
      } else {
        pc.addTrack(track, localStream);
      }
    });
  }, [localStream, isHost]);

  return {
    remoteStream,
    isConnected,
    connectionState,
  };
}
