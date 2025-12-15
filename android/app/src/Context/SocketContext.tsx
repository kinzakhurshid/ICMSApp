// Context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  const appState = useRef(AppState.currentState);
  const errorCountRef = useRef(0);
  const lastErrorTimeRef = useRef(0);

  // Reduced verbose logging - only log when necessary
  // console.log("🔍 SocketContext: Has token:", !!token?.token);

  const initSocket = () => {
    if (token?.token && !socket) {
      
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
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        forceNew: true,
      });
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        setIsConnected(true);
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('reconnect', () => {
        setIsConnected(true);
      });

      const ERROR_THROTTLE_MS = 10000; // Only log errors every 10 seconds (increased from 5)

      newSocket.on('reconnect_error', () => {
        // Silently handle reconnect errors - they're expected during network issues
        // Socket.IO will automatically retry
        setIsConnected(false);
      });

      newSocket.on('reconnect_failed', () => {
        // Only log if it's been a while since last error
        const now = Date.now();
        if (now - lastErrorTimeRef.current > ERROR_THROTTLE_MS) {
          lastErrorTimeRef.current = now;
        }
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error: any) => {
        const now = Date.now();
        const isExpectedError = 
          error.message === 'websocket error' || 
          error.message === 'timeout' ||
          error.message?.includes('timeout') ||
          error.message?.includes('websocket');
        
        // Suppress expected errors completely, only log unexpected ones
        if (!isExpectedError && now - lastErrorTimeRef.current > ERROR_THROTTLE_MS) {
          console.error('❌ Socket connection error:', error.message);
          lastErrorTimeRef.current = now;
        }
        
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
      setIsConnected(false);
    }
    
    const newSocket = initSocket();
    return newSocket;
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - reconnect if needed
        if (socket && !isConnected) {
          socket.connect();
        }
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [socket, isConnected]);

  useEffect(() => {
    if (token?.token) {
      const newSocket = initSocket();
      
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [token?.token, token?.isLoggedIn]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};