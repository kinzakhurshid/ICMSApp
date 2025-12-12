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

    // Handle NEW_NOTIFICATION_ALERT - can be inbox or system notification
    // According to backend docs:
    // - Message notifications have type: "message" AND have message property
    // - System notifications (attendance, break) have type: "attendance" or "system" and NO message property
    const handleNotificationAlert = (payload: any) => {
      console.log('🔍 ===== NEW_NOTIFICATION_ALERT RECEIVED =====');
      console.log('🔍 NotificationManager: NEW_NOTIFICATION_ALERT payload:', JSON.stringify(payload, null, 2));
      
      // Check notification type from payload
      const notificationType = payload?.type || '';
      const hasMessageProperty = payload?.message !== undefined && payload?.message !== null;
      
      // Determine if this is a message/inbox notification
      // Message notifications have type === 'message' AND have message property
      // System notifications have type === 'attendance' or 'system' and NO message property
      const isMessageNotification = notificationType === 'message' && hasMessageProperty;
      
      if (isMessageNotification) {
        console.log('🔍 This is an INBOX/MESSAGE notification');
        const inboxNotification = payload.message as InboxNotification;
        
        // Check for duplicates
        if (isNotificationProcessed(inboxNotification._id, inboxNotification.relatedMessage?._id)) {
          console.log('🔍 Duplicate inbox notification, skipping');
          return;
        }
        
        // Handle inbox notification
        handleNewNotification(inboxNotification);
      } else {
        // This is a SYSTEM notification (attendance, break, task, etc.)
        // Types: "attendance", "system", "task", etc.
        console.log('🔍 This is a SYSTEM notification (type:', notificationType, ')');
        
        // Handle system notification - convert to InboxNotification format for display
        const notificationId = payload._id || payload.notificationId || Date.now().toString();
        
        // Check for duplicates
        if (isNotificationProcessed(notificationId)) {
          console.log('🔍 Duplicate system notification, skipping');
          return;
        }
        
        // Extract title and body according to backend structure
        const title = payload.title || 'Notification';
        const body = payload.body || payload.content || '';
        
        // Extract sender information
        let sender: any = { _id: '', username: 'System', name: 'System' };
        if (payload.sender) {
          if (typeof payload.sender === 'string') {
            sender = { _id: payload.sender, username: 'System', name: 'System' };
          } else {
            sender = {
              _id: payload.sender._id || payload.sender.id || '',
              username: payload.sender.username || 'System',
              name: payload.sender.name || 'System',
            };
          }
        }
        
        const systemNotification: InboxNotification = {
          _id: notificationId,
          receiver: payload.receiver || '',
          sender: sender,
          type: notificationType || 'system',
          chat: payload.chatId ? { _id: payload.chatId } : undefined,
          title: title,
          body: body,
          metadata: {
            ...payload.metadata,
            link: payload.link,
            entity: payload.entity,
            severity: payload.severity,
            module: payload.module,
            action: payload.action,
            notificationType: notificationType,
            // Include break-specific metadata
            phase: payload.metadata?.phase, // "start" or "end" for breaks
            idlePresetId: payload.metadata?.idlePresetId,
            startTime: payload.metadata?.startTime,
            endTime: payload.metadata?.endTime,
            label: payload.metadata?.label, // "Lunch break", "Prayer time", etc.
            // Include attendance-specific metadata
            attendanceId: payload.metadata?.attendanceId,
            employeeId: payload.metadata?.employeeId,
          },
          read: false,
          delivered: payload.deliveredAt ? true : false,
          createdAt: payload.createdAt || new Date().toISOString(),
          updatedAt: payload.updatedAt || payload.createdAt || new Date().toISOString(),
        };
        
        console.log('🔍 System notification converted:', JSON.stringify(systemNotification, null, 2));
        
        // Add system notification to context
        addNotification(systemNotification);
        
        // Show Notifee notification for system notifications
        NotificationService.showLocalNotification(systemNotification);
      }
      
      console.log('🔍 ===== END NEW_NOTIFICATION_ALERT =====');
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

    // Handle UNREAD_COUNT_UPDATED event
    const handleUnreadCountUpdate = (data: any) => {
      console.log('🔍 ===== UNREAD_COUNT_UPDATED RECEIVED =====');
      console.log('🔍 NotificationManager: Unread count update:', JSON.stringify(data, null, 2));
      
      // Only update if it's for the current user
      if (data?.unreadCount !== undefined) {
        console.log('🔍 Updating unread count to:', data.unreadCount);
        // The NotificationContext will handle this via fetchUnreadCount
        fetchUnreadCount();
      }
      
      console.log('🔍 ===== END UNREAD_COUNT_UPDATED =====');
    };

    // Register socket event listeners with deduplication
    console.log('🔍 NotificationManager: Registering socket event listeners...');
    
    // Primary events
    socket.on('NEW_MESSAGE', handleNewMessage);
    socket.on('NEW_INBOX_NOTIFICATION', handleNewNotification);
    socket.on('NEW_NOTIFICATION_ALERT', handleNotificationAlert); // This handles both message and system notifications
    socket.on('UNREAD_COUNT_UPDATED', handleUnreadCountUpdate);
    
    // Debug all events
    socket.onAny(debugAllEvents);
    
    console.log('🔍 NotificationManager: Socket event listeners registered');

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('NEW_MESSAGE', handleNewMessage);
      socket.off('NEW_INBOX_NOTIFICATION', handleNewNotification);
      socket.off('NEW_NOTIFICATION_ALERT', handleNotificationAlert);
      socket.off('UNREAD_COUNT_UPDATED', handleUnreadCountUpdate);
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
