import { useEffect, useRef, useState, useCallback } from 'react';

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'participant';
  joined_at: string;
}

interface WebRTCSignal {
  type: 'webrtc-offer' | 'webrtc-answer' | 'webrtc-ice-candidate';
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  from: string;
  to?: string;
}

interface TranscriptMessage {
  type: 'transcript';
  text: string;
}

interface HighlightMessage {
  type: 'highlight';
  title: string;
  detail: string;
}

interface KeywordDetectedMessage {
  type: 'keyword-detected';
}

interface UseRoomWebSocketProps {
  joinCode: string | null;
  participantName: string;
  isHost?: boolean;
  onWebRTCSignal?: (signal: WebRTCSignal) => void;
  onTranscript?: (message: TranscriptMessage) => void;
  onHighlight?: (message: HighlightMessage) => void;
  onKeywordDetected?: (message: KeywordDetectedMessage) => void;
}

export function useRoomWebSocket({ joinCode, participantName, isHost = false, onWebRTCSignal, onTranscript, onHighlight, onKeywordDetected }: UseRoomWebSocketProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(7));
  const onWebRTCSignalRef = useRef(onWebRTCSignal);
  const onTranscriptRef = useRef(onTranscript);
  const onHighlightRef = useRef(onHighlight);
  const onKeywordDetectedRef = useRef(onKeywordDetected);

  // Keep callback refs updated
  useEffect(() => {
    onWebRTCSignalRef.current = onWebRTCSignal;
    onTranscriptRef.current = onTranscript;
    onHighlightRef.current = onHighlight;
    onKeywordDetectedRef.current = onKeywordDetected;
  }, [onWebRTCSignal, onTranscript, onHighlight, onKeywordDetected]);

  // Get client ID
  const getClientId = useCallback(() => clientIdRef.current, []);

  useEffect(() => {
    if (!joinCode || !participantName) return;

    let ws: WebSocket | null = null;

    const connectWebSocket = async () => {
      try {
        // Step 1: Exchange join_code for room_id via REST
        const response = await fetch('https://boardcast-server.fly.dev/api/rooms/join/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ join_code: joinCode }),
        });

        if (!response.ok) {
          throw new Error('Failed to join room');
        }

        const data = await response.json();
        const fetchedRoomId = data.room_id;
        setRoomId(fetchedRoomId);

        // Step 2: Open WebSocket connection
        const wsUrl = `wss://boardcast-server.fly.dev/ws/rooms/${fetchedRoomId}/`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        // Step 3: Handle connection opened
        ws.onopen = () => {
          console.log('WebSocket connected to room:', fetchedRoomId);
          setIsConnected(true);

          // Send create-room or join-room message
          const message = {
            type: isHost ? 'create-room' : 'join-room',
            name: participantName,
            client_id: clientIdRef.current,
          };

          ws?.send(JSON.stringify(message));
        };

        // Step 4: Handle incoming messages
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          
          // Don't log WebRTC signals (too noisy)
          if (!msg.type?.startsWith('webrtc-')) {
            console.log('WebSocket message received:', msg);
          }

          switch (msg.type) {
            case 'room-created':
              console.log('Room created successfully');
              setParticipants(msg.participants || []);
              break;

            case 'participant-joined':
              console.log('Participant joined:', msg.participant);
              setParticipants(msg.participants || []);
              break;

            case 'participant-left':
              console.log('Participant left:', msg.participant);
              setParticipants(msg.participants || []);
              break;

            case 'webrtc-offer':
            case 'webrtc-answer':
            case 'webrtc-ice-candidate':
              // Forward WebRTC signaling to callback
              if (onWebRTCSignalRef.current && msg.from !== clientIdRef.current) {
                onWebRTCSignalRef.current(msg as WebRTCSignal);
              }
              break;

            case 'transcript':
              console.log('📝 WebSocket: Transcript message received:', msg);
              // Forward transcript to callback
              if (onTranscriptRef.current) {
                console.log('📝 WebSocket: Calling onTranscript callback');
                onTranscriptRef.current(msg as TranscriptMessage);
              } else {
                console.warn('📝 WebSocket: No onTranscript callback registered!');
              }
              break;

            case 'highlight':
              console.log('⭐ WebSocket: Highlight message received:', msg);
              // Forward highlight to callback
              if (onHighlightRef.current) {
                console.log('⭐ WebSocket: Calling onHighlight callback');
                onHighlightRef.current(msg as HighlightMessage);
              } else {
                console.warn('⭐ WebSocket: No onHighlight callback registered!');
              }
              break;

            case 'keyword-detected':
              console.log('🎯 WebSocket: Keyword detected message received:', msg);
              // Forward to callback
              if (onKeywordDetectedRef.current) {
                console.log('🎯 WebSocket: Calling onKeywordDetected callback');
                onKeywordDetectedRef.current(msg as KeywordDetectedMessage);
              } else {
                console.warn('🎯 WebSocket: No onKeywordDetected callback registered!');
              }
              break;

            case 'error':
              console.error('WebSocket error:', msg.message);
              break;

            default:
              // Silently ignore unknown message types
              break;
          }
        };

        // Step 5: Handle errors
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
        };

        // Step 6: Handle connection closed
        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        };
      } catch (error) {
        console.error('Failed to connect:', error);
        setConnectionError('Room not found. Please check the room code and try again.');
      }
    };

    connectWebSocket();

    // Step 7: Cleanup on unmount
    return () => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'leave-room' }));
        ws.close();
      }
    };
  }, [joinCode, participantName, isHost]);

  // Helper function to send custom messages
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Send WebRTC signaling message
  const sendWebRTCSignal = useCallback((signal: Omit<WebRTCSignal, 'from'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...signal,
        from: clientIdRef.current,
      }));
    }
  }, []);

  return {
    participants,
    isConnected,
    roomId,
    connectionError,
    sendMessage,
    sendWebRTCSignal,
    getClientId,
  };
}
