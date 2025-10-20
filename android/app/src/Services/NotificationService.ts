import { Platform, Alert, Linking } from 'react-native';
import { InboxNotification } from '../Context/NotificationContext';

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
  private notificationQueue: LocalNotification[] = [];
  private isShowingNotification = false;

  // Show a local notification popup
  showLocalNotification = (notification: InboxNotification): void => {
    const localNotification: LocalNotification = {
      id: notification._id,
      title: this.getNotificationTitle(notification),
      body: this.getNotificationBody(notification),
      data: {
        notificationId: notification._id,
        chatId: notification.chat._id,
        senderId: notification.sender._id,
        type: notification.type,
      },
      priority: 'high',
      sound: true,
      vibrate: true,
    };

    // Add to queue
    this.notificationQueue.push(localNotification);
    
    // Process queue
    this.processNotificationQueue();
  };

  // Process notification queue
  private processNotificationQueue = (): void => {
    if (this.isShowingNotification || this.notificationQueue.length === 0) {
      return;
    }

    const notification = this.notificationQueue.shift();
    if (!notification) return;

    this.isShowingNotification = true;
    this.displayNotification(notification);
  };

  // Display the actual notification
  private displayNotification = (notification: LocalNotification): void => {
    if (Platform.OS === 'android') {
      this.showAndroidNotification(notification);
    } else {
      this.showIOSNotification(notification);
    }
  };

  // Show notification for Android
  private showAndroidNotification = (notification: LocalNotification): void => {
    // Create a professional WhatsApp-like notification
    Alert.alert(
      notification.title,
      notification.body,
      [
        {
          text: 'Reply',
          onPress: () => this.handleNotificationAction(notification, 'reply'),
          style: 'default',
        },
        {
          text: 'Mark as Read',
          onPress: () => this.handleNotificationAction(notification, 'mark_read'),
          style: 'default',
        },
        {
          text: 'View',
          onPress: () => this.handleNotificationAction(notification, 'view'),
          style: 'default',
        },
        {
          text: 'Dismiss',
          onPress: () => this.handleNotificationDismiss(notification),
          style: 'cancel',
        },
      ],
      {
        cancelable: true,
        onDismiss: () => this.handleNotificationDismiss(notification),
      }
    );
  };

  // Show notification for iOS
  private showIOSNotification = (notification: LocalNotification): void => {
    Alert.alert(
      notification.title,
      notification.body,
      [
        {
          text: 'Reply',
          onPress: () => this.handleNotificationAction(notification, 'reply'),
        },
        {
          text: 'View',
          onPress: () => this.handleNotificationAction(notification, 'view'),
        },
        {
          text: 'Dismiss',
          onPress: () => this.handleNotificationDismiss(notification),
          style: 'cancel',
        },
      ],
      {
        cancelable: true,
        onDismiss: () => this.handleNotificationDismiss(notification),
      }
    );
  };

  // Handle notification action
  private handleNotificationAction = (
    notification: LocalNotification,
    action: 'reply' | 'view' | 'mark_read'
  ): void => {
    switch (action) {
      case 'reply':
        this.navigateToChat(notification.data.chatId, { reply: true });
        break;
      case 'view':
        this.navigateToChat(notification.data.chatId);
        break;
      case 'mark_read':
        this.markNotificationAsRead(notification.id);
        break;
    }
    
    this.isShowingNotification = false;
    this.processNotificationQueue();
  };

  // Handle notification dismiss
  private handleNotificationDismiss = (notification: LocalNotification): void => {
    this.isShowingNotification = false;
    this.processNotificationQueue();
  };

  // Navigate to chat
  private navigateToChat = (chatId: string, options?: { reply?: boolean }): void => {
    // You can implement deep linking here or use navigation
    console.log('Navigate to chat:', chatId, options);
    
    // For now, we'll use a simple approach
    // In a real app, you'd use React Navigation or deep linking
    if (options?.reply) {
      console.log('Open chat with reply mode');
    } else {
      console.log('Open chat');
    }
  };

  // Mark notification as read
  private markNotificationAsRead = (notificationId: string): void => {
    console.log('Mark notification as read:', notificationId);
    // This will be handled by the NotificationContext
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

  // Clear notification queue
  clearQueue = (): void => {
    this.notificationQueue = [];
    this.isShowingNotification = false;
  };

  // Get queue length
  getQueueLength = (): number => {
    return this.notificationQueue.length;
  };
}

// Export singleton instance
export default new NotificationService();




