import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNotifications } from '../Context/NotificationContext';
import { useSocket } from '../Context/SocketContext';
import NotificationPopup from './NotificationPopup';
import NotificationService from '../Services/NotificationService';
import { InboxNotification } from '../Context/NotificationContext';

interface NotificationManagerProps {
  children: React.ReactNode;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const [currentNotification, setCurrentNotification] = useState<InboxNotification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { socket } = useSocket();
  const { markAsRead } = useNotifications();
  const appState = useRef(AppState.currentState);
  const notificationTimeout = useRef<NodeJS.Timeout>();

  // Handle new notifications from socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: InboxNotification) => {
      console.log('NotificationManager: New notification received', notification);
      
      // Clear any existing timeout
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }

      // Show notification popup
      setCurrentNotification(notification);
      setIsVisible(true);

      // Also show system notification
      NotificationService.showLocalNotification(notification);
    };

    const handleNotificationAlert = (data: any) => {
      console.log('NotificationManager: Notification alert received', data);
      
      // Convert alert data to notification format
      const notification: InboxNotification = {
        _id: data._id || Date.now().toString(),
        sender: data.sender,
        receiver: data.receiver,
        message: data.message,
        chat: data.chat,
        type: data.type || 'message',
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      handleNewNotification(notification);
    };

    // Register socket event listeners
    socket.on('NEW_NOTIFICATION_ALERT', handleNotificationAlert);
    socket.on('NEW_INBOX_NOTIFICATION', handleNewNotification);

    return () => {
      socket.off('NEW_NOTIFICATION_ALERT', handleNotificationAlert);
      socket.off('NEW_INBOX_NOTIFICATION', handleNewNotification);
    };
  }, [socket]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed from', appState.current, 'to', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, clear any visible notifications
        setIsVisible(false);
        setCurrentNotification(null);
        
        // Clear notification service queue
        // Note: clearQueue is called on the instance, not statically
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Handle notification popup actions
  const handleNotificationAction = (action: 'reply' | 'view' | 'mark_read') => {
    if (!currentNotification) return;

    console.log('Notification action:', action, currentNotification._id);

    switch (action) {
      case 'reply':
        // Navigate to chat with reply mode
        navigateToChat(currentNotification.chat._id, { reply: true });
        break;
      case 'view':
        // Navigate to chat
        navigateToChat(currentNotification.chat._id);
        break;
      case 'mark_read':
        // Mark notification as read
        markAsRead(currentNotification._id);
        break;
    }

    // Hide notification popup
    setIsVisible(false);
    setCurrentNotification(null);
  };

  // Handle notification dismiss
  const handleNotificationDismiss = () => {
    console.log('Notification dismissed');
    setIsVisible(false);
    setCurrentNotification(null);
  };

  // Navigate to chat (placeholder - implement based on your navigation)
  const navigateToChat = (chatId: string, options?: { reply?: boolean }) => {
    console.log('Navigate to chat:', chatId, options);
    
    // TODO: Implement navigation to chat screen
    // Example:
    // navigation.navigate('Chat', { 
    //   chatId, 
    //   replyMode: options?.reply 
    // });
  };

  // Auto-dismiss notification after 5 seconds
  useEffect(() => {
    if (isVisible && currentNotification) {
      notificationTimeout.current = setTimeout(() => {
        handleNotificationDismiss();
      }, 5000);
    }

    return () => {
      if (notificationTimeout.current) {
        clearTimeout(notificationTimeout.current);
      }
    };
  }, [isVisible, currentNotification]);

  return (
    <>
      {children}
      
      {/* Notification Popup */}
      {currentNotification && (
        <NotificationPopup
          notification={currentNotification}
          visible={isVisible}
          onDismiss={handleNotificationDismiss}
          onAction={handleNotificationAction}
        />
      )}
    </>
  );
};

export default NotificationManager;
