// Context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  reconnect: () => {},
});

export const useSocket = () => {
  return useContext(SocketContext);
};

// Create a provider that accepts token as a prop
export const SocketProvider: React.FC<{ children: React.ReactNode; token: any  }> = ({ 
  children, 
  token 
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  console.log("**********",token.token)

  const initSocket = () => {
    if (token && !socket) {
      const newSocket = io('http://89.116.32.31:5001', {
    query: {
      token: token.token
    },
    auth: {
      token: token.token
    },
    extraHeaders: {
      'Authorization': `Bearer ${token.token}`
    },
    transports: ['websocket', 'polling'],
    timeout: 10000,
  });


      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.log("**********",token)
        console.log('Socket connection error:', error);
        setIsConnected(false);
      });

      return newSocket;
    }
    return null;
  };
  const reconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    initSocket();
  };

  useEffect(() => {
    const newSocket = initSocket();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};