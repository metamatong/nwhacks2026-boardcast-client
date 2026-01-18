import { useEffect, useRef, useState, useCallback } from 'react';

interface Participant {
  id: string;
  name: string;
  role: 'host' | 'participant';
  joined_at: string;
}

interface UseRoomWebSocketProps {
  joinCode: string | null;
  participantName: string;
  isHost?: boolean;
  onVideoFrame?: (frameData: string) => void;
}

export function useRoomWebSocket({ joinCode, participantName, isHost = false, onVideoFrame }: UseRoomWebSocketProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const clientId = useRef<string>(Math.random().toString(36).substring(7));

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
            client_id: clientId.current,
          };

          ws?.send(JSON.stringify(message));
        };

        // Step 4: Handle incoming messages
        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data);
          
          // Don't log video frames to avoid console spam
          if (msg.type !== 'video-frame') {
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

            case 'video-frame':
              // Handle incoming video frame from host
              if (msg.frame) {
                setCurrentFrame(msg.frame);
                if (onVideoFrame) {
                  onVideoFrame(msg.frame);
                }
              }
              break;

            case 'error':
              console.error('WebSocket error:', msg.message);
              break;

            default:
              console.log('Unknown message type:', msg.type);
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
        alert('Failed to join room. Please check the room code.');
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
  }, [joinCode, participantName, isHost, onVideoFrame]);

  // Helper function to send custom messages
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  // Helper function to send video frame (for host)
  const sendVideoFrame = useCallback((frameData: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'video-frame',
        frame: frameData,
      }));
    }
  }, []);

  return {
    participants,
    isConnected,
    roomId,
    sendMessage,
    sendVideoFrame,
    currentFrame,
  };
}
