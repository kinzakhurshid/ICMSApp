import { Platform } from 'react-native';
import notifee, { AndroidImportance, EventType, Event } from '@notifee/react-native';
import { InboxNotification } from '../Context/NotificationContext';
import { navigationRef } from './NavigationService';
import { navigateToTab } from './NavigationService';

export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  data?: any;
  sound?: boolean;
  vibrate?: boolean;
  priority?: 'high' | 'normal' | 'low';
  category?: string;
}

class NotificationService {
  private notificationChannelId: string = 'icms_notifications';
  private isInitialized = false;

  // Initialize Notifee and create notification channel
  initialize = async (): Promise<void> => {
    if (this.isInitialized) return;

    try {
      // Check if notifee is available
      if (!notifee) {
        console.warn('NotificationService: Notifee is not available');
        return;
      }

      // Request permission - wrap in try-catch for iOS
      try {
        await notifee.requestPermission();
      } catch (permError) {
        console.error('NotificationService: Error requesting permission:', permError);
        // Continue anyway - permissions might already be granted
      }

      if (Platform.OS === 'android') {
        // Create a channel for Android
        try {
          await notifee.createChannel({
            id: this.notificationChannelId,
            name: 'ICMS Notifications',
            importance: AndroidImportance.HIGH,
            sound: 'default',
            vibration: true,
            vibrationPattern: [300, 500],
          });
        } catch (channelError) {
          console.error('NotificationService: Error creating channel:', channelError);
          // Continue anyway - channel might already exist
        }
      }

      // Set up notification event handlers
      try {
        this.setupEventHandlers();
      } catch (handlerError) {
        console.error('NotificationService: Error setting up handlers:', handlerError);
        // Continue anyway
      }

      this.isInitialized = true;
      console.log('NotificationService: Notifee initialized successfully');
    } catch (error) {
      console.error('NotificationService: Failed to initialize Notifee:', error);
      // Don't crash - app should continue without Notifee
    }
  };

  // Set up event handlers for notification interactions
  private setupEventHandlers = (): void => {
    // Handle notification press (when user taps notification)
    notifee.onForegroundEvent(async ({ type, detail }: Event) => {
      if (type === EventType.PRESS) {
        console.log('NotificationService: Notification pressed', detail.notification);
        this.handleNotificationPress(detail.notification?.data);
      } else if (type === EventType.ACTION_PRESS) {
        console.log('NotificationService: Action pressed', detail.pressAction?.id);
        if (detail.pressAction?.id === 'open') {
          this.handleNotificationPress(detail.notification?.data);
        }
      }
    });

    // Handle background notification press
    notifee.onBackgroundEvent(async ({ type, detail }: Event) => {
      if (type === EventType.PRESS) {
        console.log('NotificationService: Background notification pressed', detail.notification);
        this.handleNotificationPress(detail.notification?.data);
      }
    });
  };

  // Show a local notification using Notifee
  showLocalNotification = async (notification: InboxNotification): Promise<void> => {
    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      const title = this.getNotificationTitle(notification);
      const body = this.getNotificationBody(notification);
      const chatId = notification.chat?._id || notification.metadata?.chatId || '';
      const notificationId = notification._id;

      // Prepare notification data - ensure chatId is always included
      const finalChatId = chatId || notification.chat?._id || notification.metadata?.chatId || '';
      const notificationData: any = {
        id: notificationId,
        title,
        body,
        data: {
          notificationId,
          chatId: finalChatId,
          senderId: notification.sender?._id || notification.metadata?.senderId,
          type: notification.type || 'message',
          link: notification.link || (finalChatId ? `/ChatWindow?chatId=${finalChatId}` : ''),
          // Include nested data for easier access
          metadata: {
            ...notification.metadata,
            chatId: finalChatId,
          },
        },
      };

      // Android-specific settings
      if (Platform.OS === 'android') {
        // Notifee expects largeIcon to be either a valid URL string or omitted.
        const rawLargeIcon =
          (notification as any)?.sender?.profilePic ||
          (notification as any)?.metadata?.senderAvatar;
        const largeIcon =
          typeof rawLargeIcon === 'string' && rawLargeIcon.startsWith('http')
            ? rawLargeIcon
            : undefined;

        notificationData.android = {
          channelId: this.notificationChannelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'open',
          },
          // Use notification icon from drawable (required by Android)
          // This is a white bell icon on transparent background
          smallIcon: 'ic_notification',
          ...(largeIcon ? { largeIcon } : {}),
          sound: 'default',
          vibrationPattern: [300, 500],
        };
      }

      // iOS-specific settings
      if (Platform.OS === 'ios') {
        notificationData.ios = {
          sound: 'default',
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        };
      }

      // Display the notification
      await notifee.displayNotification(notificationData);
      console.log('NotificationService: Notification displayed:', notificationId);
    } catch (error) {
      console.error('NotificationService: Failed to show notification:', error);
    }
  };

  // Handle notification press/tap
  private handleNotificationPress = (data?: any): void => {
    if (!data) {
      console.log('NotificationService: No data in notification');
      return;
    }

    console.log('NotificationService: Handling notification press with data:', JSON.stringify(data, null, 2));

    // Extract chatId from various possible locations
    const chatId = data.chatId || 
                   data.metadata?.chatId || 
                   data.chat?._id ||
                   data.chat?.id;
    const link = data.link;
    const type = data.type || data.metadata?.type;
    const body = data.body || data.notification?.body || '';

    console.log('NotificationService: Extracted chatId:', chatId, 'type:', type);

    // If it's a message notification, ALWAYS navigate to inbox
    // This handles notifications like "You have a new message from [Sender Name]"
    const isMessageNotification = type === 'message' || data.type === 'message';
    
    if (isMessageNotification) {
      console.log('NotificationService: Message notification detected, navigating to inbox');
      if (chatId) {
        console.log('NotificationService: Opening specific chat in inbox:', chatId);
        this.navigateToChat(chatId);
      } else {
        console.log('NotificationService: Navigating to inbox (no specific chat)');
        this.navigateToInbox();
      }
    } else if (chatId) {
      // If we have a chatId (even if not explicitly message type), navigate to that chat
      console.log('NotificationService: Has chatId, navigating to inbox:', chatId);
      this.navigateToChat(chatId);
    } else if (link) {
      // Try to parse link
      this.navigateFromLink(link, data);
    } else {
      // Default: Navigate to notifications screen
      console.log('NotificationService: No chatId or link, navigating to notifications');
      this.navigateToNotifications();
    }
  };

  // Navigate to inbox tab (without opening specific chat)
  private navigateToInbox = (): void => {
    if (!navigationRef.isReady()) {
      setTimeout(() => this.navigateToInbox(), 500);
      return;
    }

    try {
      console.log('NotificationService: Navigating to inbox tab');
      
      // Try different inbox tab names based on user role
      const inboxTabNames = ['InboxTab', 'EmployeeInboxTab'];
      let navigated = false;
      
      for (const tabName of inboxTabNames) {
        try {
          navigateToTab(tabName);
          navigated = true;
          console.log('NotificationService: Successfully navigated to', tabName);
          break;
        } catch (error) {
          console.log('NotificationService: Failed to navigate to', tabName);
          continue;
        }
      }
      
      // If navigation failed, try direct navigation
      if (!navigated) {
        try {
          navigationRef.navigate('InboxTab' as never);
          console.log('NotificationService: Navigated to InboxTab directly');
        } catch (error) {
          console.error('NotificationService: All navigation methods failed');
        }
      }
    } catch (error) {
      console.error('NotificationService: Error navigating to inbox:', error);
    }
  };

  // Navigate to chat
  private navigateToChat = (chatId: string): void => {
    if (!navigationRef.isReady()) {
      setTimeout(() => this.navigateToChat(chatId), 500);
      return;
    }

    try {
      console.log('NotificationService: Navigating to inbox with chat:', chatId);
      
      // Navigate to inbox tab first
      const inboxTabNames = ['InboxTab', 'EmployeeInboxTab'];
      let navigated = false;
      
      for (const tabName of inboxTabNames) {
        try {
          navigateToTab(tabName);
          navigated = true;
          console.log('NotificationService: Navigated to', tabName);
          break;
        } catch (error) {
          console.log('NotificationService: Failed to navigate to', tabName);
          continue;
        }
      }
      
      // If navigation failed, try direct navigation
      if (!navigated) {
        try {
          navigationRef.navigate('InboxTab' as never);
        } catch (error) {
          console.error('NotificationService: All navigation methods failed');
        }
      }
      
      // Use global callback to open the chat
      setTimeout(() => {
        (global as any).pendingChatId = chatId;
        console.log('NotificationService: Set pendingChatId:', chatId);
        
        // Also try to trigger via NotificationContext if possible
        if ((global as any).openChatCallback) {
          (global as any).openChatCallback(chatId);
          console.log('NotificationService: Called openChatCallback');
        }
      }, 500); // Delay to ensure navigation completes
      
    } catch (error) {
      console.error('NotificationService: Error navigating to chat:', error);
    }
  };

  // Navigate from link
  private navigateFromLink = (link: string, data: any): void => {
    if (!navigationRef.isReady()) {
      setTimeout(() => this.navigateFromLink(link, data), 500);
      return;
    }

    try {
      // Parse link format: "/PM/tasks/123" or "/HR/leave" or "/ChatWindow?chatId=123"
      const parts = link.split('/').filter(Boolean);
      
      if (parts.length === 0) {
        this.navigateToNotifications();
        return;
      }

      const [module, screen, ...params] = parts;
      
      if (screen === 'ChatWindow' || data.chatId) {
        this.navigateToChat(data.chatId || params[0]);
      } else if (module === 'PM' && screen === 'tasks') {
        navigationRef.navigate('TaskDetail' as never, { taskId: params[0] } as never);
      } else if (module === 'HR' && screen === 'leave') {
        navigationRef.navigate('LeaveScreen' as never);
      } else if (module === 'PM' && screen === 'projects') {
        navigationRef.navigate('ProjectDetail' as never, { projectId: params[0] } as never);
      } else {
        this.navigateToNotifications();
      }
    } catch (error) {
      console.error('NotificationService: Error navigating from link:', error);
      this.navigateToNotifications();
    }
  };

  // Navigate to notifications screen
  private navigateToNotifications = (): void => {
    if (!navigationRef.isReady()) {
      setTimeout(() => this.navigateToNotifications(), 500);
      return;
    }

    try {
      navigationRef.navigate('NotificationsScreen' as never);
    } catch (error) {
      console.error('NotificationService: Error navigating to notifications:', error);
    }
  };

  // Get notification title
  private getNotificationTitle = (notification: InboxNotification): string => {
    const senderName = notification.metadata?.senderName?.trim() ||
                      notification.sender?.name?.trim() || 
                      notification.sender?.username?.trim() ||
                      'Unknown User';
    
    if (notification.chat && notification.chat.type === 'group') {
      return `${senderName} in ${notification.chat.name || 'Group'}`;
    }
    
    return senderName;
  };

  // Get notification body
  private getNotificationBody = (notification: InboxNotification): string => {
    if (notification.relatedMessage) {
      const message = notification.relatedMessage;
      switch (message.messageType) {
        case 'text':
          return message.content;
        case 'image':
          return '📷 Photo';
        case 'video':
          return '🎥 Video';
        case 'audio':
          return '🎵 Voice message';
        case 'document':
          return '📄 Document';
        default:
          return message.content || 'New message';
      }
    }
    return notification.body || 'New notification';
  };

  // Cancel a notification
  cancelNotification = async (notificationId: string): Promise<void> => {
    try {
      await notifee.cancelNotification(notificationId);
      console.log('NotificationService: Notification cancelled:', notificationId);
    } catch (error) {
      console.error('NotificationService: Failed to cancel notification:', error);
    }
  };

  // Cancel all notifications
  cancelAllNotifications = async (): Promise<void> => {
    try {
      await notifee.cancelAllNotifications();
      console.log('NotificationService: All notifications cancelled');
    } catch (error) {
      console.error('NotificationService: Failed to cancel all notifications:', error);
    }
  };

  // Get displayed notifications
  getDisplayedNotifications = async (): Promise<any[]> => {
    try {
      return await notifee.getDisplayedNotifications();
    } catch (error) {
      console.error('NotificationService: Failed to get displayed notifications:', error);
      return [];
    }
  };
}

// Export singleton instance
export default new NotificationService();




