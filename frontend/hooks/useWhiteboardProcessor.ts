import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface WhiteboardUpdate {
  canvas: string;
  frame_count?: number;
}

interface UseWhiteboardProcessorProps {
  roomId: string;
  enabled?: boolean;
}

export const useWhiteboardProcessor = ({ roomId, enabled = true }: UseWhiteboardProcessorProps) => {
  const [whiteboardCanvas, setWhiteboardCanvas] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !roomId) return;

    // Connect to whiteboard processor server
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to whiteboard processor');
      setIsConnected(true);
      
      // Join the room
      socket.emit('join_room', { room_id: roomId });
      
      // Request current canvas
      socket.emit('request_canvas', { room_id: roomId });
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from whiteboard processor');
      setIsConnected(false);
    });

    socket.on('connected', (data: { message: string }) => {
      console.log('Whiteboard processor message:', data.message);
    });

    socket.on('whiteboard_update', (data: WhiteboardUpdate) => {
      console.log('📊 Received whiteboard update');
      setWhiteboardCanvas(data.canvas);
      if (data.frame_count) {
        setFrameCount(data.frame_count);
      }
    });

    socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_room', { room_id: roomId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [roomId, enabled]);

  const requestCanvas = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('request_canvas', { room_id: roomId });
    }
  }, [isConnected, roomId]);

  return {
    whiteboardCanvas,
    isConnected,
    frameCount,
    requestCanvas,
  };
};
