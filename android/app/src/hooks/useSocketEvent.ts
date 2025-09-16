import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

const useSocketEvents = (socket: Socket | null, eventHandlers: Record<string, (...args: any[]) => void>) => {
  useEffect(() => {
    if (!socket) return;

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, eventHandlers]);
};

export default useSocketEvents;