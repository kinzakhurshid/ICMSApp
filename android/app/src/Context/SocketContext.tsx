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

  console.log("🔍 ===== SOCKET CONTEXT DEBUG ======");
  console.log("🔍 SocketContext: Full token object:", JSON.stringify(token, null, 2));
  console.log("🔍 SocketContext: Token value:", token?.token);
  console.log("🔍 SocketContext: Is logged in:", token?.isLoggedIn);
  console.log("🔍 SocketContext: Current user:", token?.currentUser);
  console.log("🔍 SocketContext: Has token:", !!token?.token);
  console.log("🔍 SocketContext: Token length:", token?.token?.length);
  console.log("🔍 ===== END SOCKET CONTEXT DEBUG ======");

  const initSocket = () => {
    console.log('🔍 ===== INIT SOCKET CALLED =====');
    console.log('🔍 initSocket: token?.token exists:', !!token?.token);
    console.log('🔍 initSocket: socket exists:', !!socket);
    console.log('🔍 initSocket: should initialize:', !!(token?.token && !socket));
    
    if (token?.token && !socket) {
      console.log('🔍 SocketContext: Initializing socket with token:', token.token);
      console.log('🔍 SocketContext: Socket URL: http://89.116.32.31:5001');
      
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
      
      console.log('🔍 SocketContext: Socket created:', !!newSocket);


      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('🔍 ===== SOCKET CONNECTED =====');
        console.log('🔍 Socket ID:', newSocket.id);
        console.log('🔍 Socket connected successfully');
        setIsConnected(true);
        console.log('🔍 ===== END SOCKET CONNECTED =====');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔍 ===== SOCKET DISCONNECTED =====');
        console.log('🔍 Disconnect reason:', reason);
        console.log('🔍 Will attempt to reconnect automatically');
        setIsConnected(false);
        console.log('🔍 ===== END SOCKET DISCONNECTED =====');
      });

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('🔍 ===== SOCKET RECONNECTED =====');
        console.log('🔍 Reconnection attempt:', attemptNumber);
        console.log('🔍 Socket ID:', newSocket.id);
        setIsConnected(true);
        console.log('🔍 ===== END SOCKET RECONNECTED =====');
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔍 ===== SOCKET RECONNECT ATTEMPT =====');
        console.log('🔍 Attempt number:', attemptNumber);
        console.log('🔍 ===== END SOCKET RECONNECT ATTEMPT =====');
      });

      newSocket.on('reconnect_error', (error) => {
        console.log('🔍 ===== SOCKET RECONNECT ERROR =====');
        console.log('🔍 Reconnect error:', error);
        console.log('🔍 ===== END SOCKET RECONNECT ERROR =====');
      });

      newSocket.on('reconnect_failed', () => {
        console.log('🔍 ===== SOCKET RECONNECT FAILED =====');
        console.log('🔍 All reconnection attempts failed');
        console.log('🔍 ===== END SOCKET RECONNECT FAILED =====');
      });

      newSocket.on('connect_error', (error) => {
        console.log('🔍 ===== SOCKET CONNECTION ERROR =====');
        console.log('🔍 Error details:', error);
        console.log('🔍 Error message:', error.message);
        console.log('🔍 Error stack:', error.stack);
        console.log('🔍 Token being used:', token?.token);
        console.log('🔍 Is logged in:', token?.isLoggedIn);
        console.log('🔍 Socket URL: http://89.116.32.31:5001');
        setIsConnected(false);
        console.log('🔍 ===== END SOCKET CONNECTION ERROR =====');
      });

      return newSocket;
    }
    return null;
  };
  const reconnect = () => {
    console.log('🔍 ===== MANUAL RECONNECT CALLED =====');
    console.log('🔍 Current socket:', !!socket);
    console.log('🔍 Current connection status:', isConnected);
    
    if (socket) {
      console.log('🔍 Disconnecting existing socket');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
    
    console.log('🔍 Initializing new socket');
    const newSocket = initSocket();
    console.log('🔍 ===== END MANUAL RECONNECT =====');
    return newSocket;
  };

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('🔍 ===== APP STATE CHANGE =====');
      console.log('🔍 App state changed from', appState.current, 'to', nextAppState);
      console.log('🔍 Socket connected:', isConnected);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('🔍 App came to foreground, checking socket connection');
        if (socket && !isConnected) {
          console.log('🔍 Socket exists but not connected, attempting manual reconnect');
          socket.connect();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background
        console.log('🔍 App went to background, socket will handle reconnection automatically');
      }
      
      appState.current = nextAppState;
      console.log('🔍 ===== END APP STATE CHANGE =====');
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [socket, isConnected]);

  useEffect(() => {
    console.log('🔍 ===== SOCKET CONTEXT USEEFFECT =====');
    console.log('🔍 SocketContext: useEffect triggered');
    console.log('🔍 SocketContext: token?.token:', !!token?.token);
    console.log('🔍 SocketContext: token?.isLoggedIn:', token?.isLoggedIn);
    console.log('🔍 SocketContext: token object:', token);
    
    if (token?.token) {
      console.log('🔍 SocketContext: Token available, attempting socket connection');
      console.log('🔍 SocketContext: isLoggedIn status:', token?.isLoggedIn);
      
      const newSocket = initSocket();
      
      return () => {
        if (newSocket) {
          console.log('🔍 SocketContext: Cleaning up socket');
          newSocket.disconnect();
        }
      };
    } else {
      console.log('🔍 SocketContext: No token available, skipping socket initialization');
      console.log('🔍 SocketContext: token?.token:', !!token?.token);
      console.log('🔍 SocketContext: token?.isLoggedIn:', token?.isLoggedIn);
      
      if (socket) {
        console.log('🔍 SocketContext: Disconnecting existing socket due to no token');
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }
    console.log('🔍 ===== END SOCKET CONTEXT USEEFFECT =====');
  }, [token?.token, token?.isLoggedIn]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnect }}>
      {children}
    </SocketContext.Provider>
  );
};