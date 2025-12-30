import { io, Socket } from 'socket.io-client';
import { useEffect, useRef } from 'react';

export const useSocket = (roomId: string) => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io('http://192.168.0.166:3000');

    socketRef.current.emit('join-room', roomId);

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return socketRef;
};
