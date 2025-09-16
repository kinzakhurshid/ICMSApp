import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initiateSocket = (token: string) => {
    
   socket = io('http://89.116.32.31:5001', {
    query: {
      token: token
    },
    auth: {
      token: token
    },
    extraHeaders: {
      'Authorization': `Bearer ${token}`
    },
    transports: ['websocket', 'polling'],
    timeout: 10000,
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const useSocket = () => {
  return { socket };
};