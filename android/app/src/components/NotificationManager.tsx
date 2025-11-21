import React, { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useNotifications } from '../Context/NotificationContext';
import { useSocket } from '../Context/SocketContext';
import NotificationService from '../Services/NotificationService';
import { InboxNotification } from '../Context/NotificationContext';
import { UPDATE_LAST_MESSAGE } from '../constants/events';

interface NotificationManagerProps {
  children: React.ReactNode;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ children }) => {
  const { socket, reconnect } = useSocket();
  const { addNotification, notifications } = useNotifications();
  const { isConnected } = useSocket();
  const appState = useRef(AppState.currentState);
  const processedNotifications = useRef<Set<string>>(new Set());

  // Deduplication function to prevent multiple notifications for same message
  const isNotificationProcessed = (notificationId: string, messageId?: string): boolean => {
    // Check both notification ID and message ID for better deduplication
    const key = messageId || notificationId;
    
    if (processedNotifications.current.has(key)) {
      console.log('🔍 Notification already processed, skipping:', key);
      return true;
    }
    
    processedNotifications.current.add(key);
    
    // Clean up old entries to prevent memory leaks (keep last 100)
    if (processedNotifications.current.size > 100) {
      const entries = Array.from(processedNotifications.current);
      processedNotifications.current.clear();
      entries.slice(-50).forEach(entry => processedNotifications.current.add(entry));
    }
    
    return false;
  };


  // Handle new notifications from socket
  useEffect(() => {
    console.log('🔍 ===== NOTIFICATION MANAGER SETUP =====');
    console.log('🔍 NotificationManager: Socket connection status:', socket ? 'Available' : 'Not available');
    console.log('🔍 NotificationManager: Socket connected:', isConnected);
    console.log('🔍 Socket object:', socket);
    console.log('🔍 Socket connected property:', socket?.connected);
    console.log('🔍 Socket id:', socket?.id);
    
    if (!socket) {
      console.log('🔍 NotificationManager: No socket available, skipping event listeners');
      return;
    }
    
    if (!isConnected) {
      console.log('🔍 NotificationManager: Socket not connected, waiting for connection...');
      return;
    }

            const handleNewNotification = (notification: InboxNotification) => {
              console.log('🔍 ===== NOTIFICATION MANAGER NEW INBOX NOTIFICATION =====');
              console.log('🔍 NotificationManager: New inbox notification received', JSON.stringify(notification, null, 2));
              
              // Check for duplicates
              if (isNotificationProcessed(notification._id, notification.relatedMessage?._id)) {
                console.log('🔍 Duplicate notification detected, skipping');
                return;
              }
              
              // Add to notification context for the notification screen
              addNotification(notification);
              
              // Show Notifee notification (replaces popup modal)
              NotificationService.showLocalNotification(notification);
              
              // Emit UPDATE_LAST_MESSAGE event to update chat list unread count
              if (socket && notification.chat?._id) {
                console.log('🔍 NotificationManager: Emitting UPDATE_LAST_MESSAGE for chat:', notification.chat._id);
                socket.emit(UPDATE_LAST_MESSAGE, {
                  chatId: notification.chat._id,
                  message: notification.relatedMessage,
                  unreadCount: 1 // Increment unread count
                });
              }
              
              console.log('🔍 ===== END NOTIFICATION MANAGER NEW INBOX NOTIFICATION =====');
            };

    const handleNotificationAlert = (data: any) => {
      console.log('🔍 ===== NOTIFICATION MANAGER ALERT =====');
      console.log('🔍 NotificationManager: Notification alert received', JSON.stringify(data, null, 2));
      
      // Create unique ID for deduplication
      const notificationId = data._id || data.notificationId || data.message?._id || Date.now().toString();
      const messageId = data.message?._id;
      
      // Check for duplicates
      if (isNotificationProcessed(notificationId, messageId)) {
        return;
      }
      
      // Convert alert data to notification format - match backend structure
      const sender = data.sender || data.message?.sender;
      const relatedMessage = data.message || data.relatedMessage;
      const notification: InboxNotification = {
        _id: notificationId,
        receiver: data.receiver || data.recipient || '',
        sender: sender || { _id: '', username: 'Unknown User', name: 'Unknown User' },
        type: data.type || 'message',
        chat: data.chat || data.chatId ? { _id: data.chatId } : undefined,
        relatedMessage: relatedMessage ? {
          _id: relatedMessage._id || '',
          content: relatedMessage.content || '',
          messageType: relatedMessage.messageType || 'text'
        } : undefined,
        title: data.title || (data.sender?.name ? `${data.sender.name}` : 'New Message'),
        body: relatedMessage?.content || data.body || data.content || 'New message',
        metadata: {
          ...data.metadata,
          senderName: sender?.name || sender?.username || data.senderName || 'Unknown User',
          senderAvatar: sender?.profilePicture || sender?.avatar || data.senderAvatar,
          chatId: data.chatId || data.chat?._id,
          messageId: relatedMessage?._id || data.messageId
        },
        read: false,
        delivered: true,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };

      console.log('🔍 NotificationManager final notification:', JSON.stringify(notification, null, 2));
      console.log('🔍 ===== END NOTIFICATION MANAGER ALERT =====');
      
      // Add to notification context and show popup
      addNotification(notification);
      handleNewNotification(notification);
    };

            const handleNewMessage = (data: any) => {
              console.log('🔍 ===== NOTIFICATION MANAGER NEW MESSAGE =====');
              console.log('🔍 NotificationManager: New message received', JSON.stringify(data, null, 2));
              
              // Create unique ID for deduplication
              const notificationId = data.message?._id || data._id || Date.now().toString();
              const messageId = data.message?._id;
              
              // Check for duplicates
              if (isNotificationProcessed(notificationId, messageId)) {
                console.log('🔍 Duplicate message detected, skipping');
                return;
              }
              
              // Convert message data to notification format - match backend structure
              const sender = data.message?.sender || data.sender;
              const relatedMessage = data.message;
              const notification: InboxNotification = {
                _id: notificationId,
                receiver: data.receiver || data.recipient || '',
                sender: sender || { _id: '', username: 'Unknown User', name: 'Unknown User' },
                type: 'message',
                chat: data.chat || data.chatId ? { _id: data.chatId } : undefined,
                relatedMessage: relatedMessage ? {
                  _id: relatedMessage._id || '',
                  content: relatedMessage.content || '',
                  messageType: relatedMessage.messageType || 'text'
                } : undefined,
                title: data.title || (sender?.name ? `${sender.name}` : 'New Message'),
                body: relatedMessage?.content || data.body || data.content || 'New message',
                metadata: {
                  ...data.metadata,
                  senderName: sender?.name || sender?.username || data.senderName || 'Unknown User',
                  senderAvatar: sender?.profilePicture || sender?.avatar || data.senderAvatar,
                  chatId: data.chatId || data.chat?._id,
                  messageId: relatedMessage?._id
                },
                read: false,
                delivered: true,
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
              };

              console.log('🔍 NotificationManager final message notification:', JSON.stringify(notification, null, 2));
              
              // Add to notification context
              addNotification(notification);
              
              // Show Notifee notification (replaces popup modal)
              NotificationService.showLocalNotification(notification);
              
              // Emit UPDATE_LAST_MESSAGE event to update chat list unread count
              if (socket && data.chatId) {
                console.log('🔍 NotificationManager: Emitting UPDATE_LAST_MESSAGE for chat:', data.chatId);
                socket.emit(UPDATE_LAST_MESSAGE, {
                  chatId: data.chatId,
                  message: relatedMessage,
                  unreadCount: 1 // Increment unread count
                });
              }
              
              console.log('🔍 ===== END NOTIFICATION MANAGER NEW MESSAGE =====');
            };

    // Add socket connection listeners
    socket.on('connect', () => {
      console.log('🔍 ===== SOCKET CONNECTED =====');
      console.log('🔍 Socket connected with ID:', socket.id);
      console.log('🔍 ===== END SOCKET CONNECTED =====');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔍 ===== SOCKET DISCONNECTED =====');
      console.log('🔍 Socket disconnected, reason:', reason);
      console.log('🔍 ===== END SOCKET DISCONNECTED =====');
    });

    // Add general event listener to debug all socket events
    const debugAllEvents = (eventName: string, data: any) => {
      console.log('🔍 ===== SOCKET EVENT DEBUG =====');
      console.log('🔍 Event name:', eventName);
      console.log('🔍 Event data:', JSON.stringify(data, null, 2));
      console.log('🔍 ===== END SOCKET EVENT DEBUG =====');
    };

    // Register socket event listeners with deduplication
    console.log('🔍 NotificationManager: Registering socket event listeners...');
    
    // Primary events only to prevent duplicates
    socket.on('NEW_MESSAGE', handleNewMessage);
    socket.on('NEW_INBOX_NOTIFICATION', handleNewNotification);
    
    // Debug all events
    socket.onAny(debugAllEvents);
    
    console.log('🔍 NotificationManager: Socket event listeners registered');

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('NEW_MESSAGE', handleNewMessage);
      socket.off('NEW_INBOX_NOTIFICATION', handleNewNotification);
      socket.offAny(debugAllEvents);
    };
  }, [socket, isConnected]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed from', appState.current, 'to', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, don't clear notifications immediately
        // Let them auto-dismiss after 5 seconds instead
        console.log('🔍 App came to foreground, keeping notifications visible');
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Watch for new notifications in context and show Notifee notification
  useEffect(() => {
    try {
      if (notifications && notifications.length > 0) {
        const latestNotification = notifications[0]; // Most recent notification
        
        // Validate notification structure
        if (!latestNotification || !latestNotification._id) {
          return;
        }
        
        // Check if this is a new unread notification that we haven't processed
        if (!latestNotification.read && !isNotificationProcessed(latestNotification._id, latestNotification.metadata?.messageId)) {
          console.log('🔍 NotificationManager: New notification detected, showing Notifee notification');
          
          // Show Notifee notification (replaces popup modal)
          NotificationService.showLocalNotification(latestNotification);
        }
      }
    } catch (error) {
      console.error('🔍 Error in notification context watcher:', error);
    }
  }, [notifications]);

  console.log('🔍 NotificationManager render - notifications count:', notifications.length);
  console.log('🔍 NotificationManager render - socket connected:', isConnected);
  
  return <>{children}</>;
};

// No styles needed - using real notification system

export default NotificationManager;
