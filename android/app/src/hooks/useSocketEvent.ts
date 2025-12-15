import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

const useSocketEvents = (socket: Socket | null, eventHandlers: Record<string, (...args: any[]) => void>) => {
  const handlersRef = useRef(eventHandlers);
  const registeredRef = useRef<Set<string>>(new Set());

  // Update ref when handlers change
  useEffect(() => {
    handlersRef.current = eventHandlers;
  }, [eventHandlers]);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const handlers = handlersRef.current;
    const eventNames = Object.keys(handlers);

    // Only register handlers that haven't been registered yet
    eventNames.forEach((event) => {
      if (!registeredRef.current.has(event)) {
        socket.on(event, handlers[event]);
        registeredRef.current.add(event);
      }
    });

    return () => {
      // Clean up only registered handlers
      registeredRef.current.forEach((event) => {
        if (handlers[event]) {
          socket.off(event, handlers[event]);
        }
      });
      registeredRef.current.clear();
    };
  }, [socket]); // Only depend on socket, not eventHandlers
};

export default useSocketEvents;