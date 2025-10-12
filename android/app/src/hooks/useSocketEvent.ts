import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

const useSocketEvents = (socket: Socket | null, eventHandlers: Record<string, (...args: any[]) => void>) => {
  useEffect(() => {
    if (!socket) {
      console.log('🔌 useSocketEvents: No socket available');
      return;
    }

    console.log('🔌 useSocketEvents: Registering event handlers:', Object.keys(eventHandlers));
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      console.log('🔌 Registering handler for event:', event);
      socket.on(event, handler);
    });

    return () => {
      console.log('🔌 useSocketEvents: Cleaning up event handlers');
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, eventHandlers]);
};

export default useSocketEvents;