// FirebaseService.ts
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import { navigationRef } from './NavigationService';
import { Platform } from 'react-native';

// Type for notification data from backend
interface NotificationData {
  notificationId?: string;
  type?: string;
  action?: string;
  link?: string;
  entity?: {
    kind?: string;
    id?: string;
  };
  chatId?: string;
  [key: string]: any;
}

/**
 * Initialize Firebase services
 */
export const initializeFirebase = async () => {
  try {
    console.log('Firebase: Initializing Firebase...');
    
    // Check if Firebase is available
    if (!messaging) {
      console.error('Firebase: messaging is not available');
      return null;
    }

    // Request notification permissions (iOS) - wrap in try-catch to prevent crashes
    let authStatus;
    try {
      authStatus = await messaging().requestPermission();
    } catch (permError) {
      console.error('Firebase: Error requesting permissions:', permError);
      // Continue anyway - permissions might already be granted
      authStatus = messaging.AuthorizationStatus.AUTHORIZED;
    }
    
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Firebase: Notification permissions granted');
      
      // Get FCM token - wrap in try-catch
      let token;
      try {
        token = await messaging().getToken();
        console.log('Firebase: FCM Token:', token);
      } catch (tokenError) {
        console.error('Firebase: Error getting FCM token:', tokenError);
        token = null;
      }
      
      // Set up notification handlers
      try {
        setupNotificationHandlers();
      } catch (handlerError) {
        console.error('Firebase: Error setting up handlers:', handlerError);
      }
      
      return token;
    } else {
      console.log('Firebase: Notification permissions denied');
      return null;
    }
  } catch (error) {
    console.error('Firebase: Error initializing Firebase:', error);
    // Don't crash the app - return null and continue
    return null;
  }
};

/**
 * Setup notification handlers for foreground, background, and quit state
 */
const setupNotificationHandlers = () => {
  // Handle foreground messages (app is open)
  messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('Firebase: Notification received in foreground:', remoteMessage);
    
    // The notification will be handled by the existing Socket.IO system
    // This is just for logging and analytics
    if (remoteMessage.data) {
      logEvent('push_notification_received', {
        notificationId: remoteMessage.data.notificationId,
        type: remoteMessage.data.type,
      });
    }
  });

  // Handle notification when app is opened from quit state
  messaging()
    .getInitialNotification()
    .then((remoteMessage: FirebaseMessagingTypes.RemoteMessage | null) => {
      if (remoteMessage) {
        console.log('Firebase: Notification opened app from quit state:', remoteMessage);
        handleNotificationPress(remoteMessage);
      }
    });

  // Handle notification when app is opened from background
  messaging().onNotificationOpenedApp((remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
    console.log('Firebase: Notification opened app from background:', remoteMessage);
    handleNotificationPress(remoteMessage);
  });

  // Handle token refresh
  messaging().onTokenRefresh((token: string) => {
    console.log('Firebase: FCM Token refreshed:', token);
    // You should send this new token to your backend
    sendTokenToBackend(token);
  });
};

/**
 * Handle notification press/click
 */
const handleNotificationPress = (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
  const data = remoteMessage.data as NotificationData;
  
  if (!data) {
    console.log('Firebase: No data in notification');
    return;
  }

  console.log('Firebase: Handling notification press with data:', data);

  // Navigate based on notification data
  if (data.link) {
    // Parse the link and navigate
    // Example: "/PM/tasks/123" or "/HR/leave" or "/ChatWindow?chatId=123"
    navigateFromNotificationLink(data.link, data);
  } else if (data.chatId) {
    // Navigate to chat if chatId is present
    navigateToChat(data.chatId);
  } else if (data.entity?.kind && data.entity?.id) {
    // Navigate based on entity type
    navigateToEntity(data.entity.kind, data.entity.id);
  } else {
    // Default: navigate to notifications screen
    navigateToNotifications();
  }

  // Log analytics
  logEvent('push_notification_opened', {
    notificationId: data.notificationId,
    type: data.type,
    action: data.action,
  });
};

/**
 * Navigate from notification link
 */
const navigateFromNotificationLink = (link: string, data: NotificationData) => {
  if (!navigationRef.isReady()) {
    console.log('Firebase: Navigation not ready, will retry');
    setTimeout(() => navigateFromNotificationLink(link, data), 500);
    return;
  }

  try {
    // Parse link format: "/PM/tasks/123" or "/HR/leave" or "/ChatWindow?chatId=123"
    const parts = link.split('/').filter(Boolean);
    
    if (parts.length === 0) {
      navigateToNotifications();
      return;
    }

    const [module, screen, ...params] = parts;
    
    // Handle different navigation patterns
    if (screen === 'ChatWindow' || data.chatId) {
      navigateToChat(data.chatId || params[0]);
    } else if (module === 'PM' && screen === 'tasks') {
      // Navigate to task detail
      navigationRef.navigate('TaskDetail' as never, { taskId: params[0] } as never);
    } else if (module === 'HR' && screen === 'leave') {
      // Navigate to leave screen
      navigationRef.navigate('LeaveScreen' as never);
    } else if (module === 'PM' && screen === 'projects') {
      // Navigate to project detail
      navigationRef.navigate('ProjectDetail' as never, { projectId: params[0] } as never);
    } else {
      // Try to navigate to the screen name directly
      navigationRef.navigate(screen as never, { id: params[0] } as never);
    }
  } catch (error) {
    console.error('Firebase: Error navigating from link:', error);
    navigateToNotifications();
  }
};

/**
 * Navigate to chat
 */
const navigateToChat = (chatId: string) => {
  if (!navigationRef.isReady()) {
    setTimeout(() => navigateToChat(chatId), 500);
    return;
  }
  
  try {
    navigationRef.navigate('ChatWindow' as never, { chatId } as never);
  } catch (error) {
    console.error('Firebase: Error navigating to chat:', error);
    navigateToNotifications();
  }
};

/**
 * Navigate to entity (task, project, etc.)
 */
const navigateToEntity = (entityKind: string, entityId: string) => {
  if (!navigationRef.isReady()) {
    setTimeout(() => navigateToEntity(entityKind, entityId), 500);
    return;
  }

  try {
    switch (entityKind.toLowerCase()) {
      case 'task':
        navigationRef.navigate('TaskDetail' as never, { taskId: entityId } as never);
        break;
      case 'project':
        navigationRef.navigate('ProjectDetail' as never, { projectId: entityId } as never);
        break;
      case 'leave':
        navigationRef.navigate('LeaveScreen' as never, { leaveId: entityId } as never);
        break;
      default:
        navigateToNotifications();
    }
  } catch (error) {
    console.error('Firebase: Error navigating to entity:', error);
    navigateToNotifications();
  }
};

/**
 * Navigate to notifications screen
 */
const navigateToNotifications = () => {
  if (!navigationRef.isReady()) {
    setTimeout(() => navigateToNotifications(), 500);
    return;
  }

  try {
    navigationRef.navigate('NotificationsScreen' as never);
  } catch (error) {
    console.error('Firebase: Error navigating to notifications:', error);
  }
};

/**
 * Send FCM token to backend
 * Call this after user logs in
 * Backend endpoint: POST /api/users/fcm-token
 */
export const sendTokenToBackend = async (userToken: string, fcmToken: string | null = null) => {
  // Use deployed server for all environments
  const API_BASE_URL = 'https://intelgency.com/api'; // Deployed server
  
  try {
    const token = fcmToken || await getFCMToken();
    if (!token) {
      console.log('Firebase: No FCM token to send');
      return false;
    }

    if (!userToken) {
      console.log('Firebase: No user token, cannot send FCM token to backend');
      return false;
    }

    // Helper to POST token to a given path (supports both /users and /user prefixes)
    const postToken = async (path: string) => {
      const endpoint = `${API_BASE_URL}${path}`;
      
      console.log('Firebase: Sending FCM token to:', endpoint);
      console.log('Firebase: Token length:', token.length);
      console.log('Firebase: User token length:', userToken.length);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          fcmToken: token,
        }),
      });

      const responseText = await response.text();
      console.log('Firebase: Response status:', response.status);
      console.log('Firebase: Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));
      console.log('Firebase: Response text (first 500 chars):', responseText.substring(0, 500));

      return { response, responseText };
    };

    // First try the documented path: /users/fcm-token
    let { response, responseText } = await postToken('/user/fcm-token');

    // If prod backend is actually mounted under /api/user/fcm-token, fall back
    if (response.status === 404) {
      console.log('Firebase: /user/fcm-token returned 404, trying /user/fcm-token fallback');
      const fallback = await postToken('/user/fcm-token');
      response = fallback.response;
      responseText = fallback.responseText;
    }

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Firebase: Failed to parse response as JSON');
      console.error('Firebase: Response was:', responseText);
      console.error('Firebase: This usually means the endpoint returned HTML (error page)');
      return false;
    }

    if (response.ok && data?.success) {
      console.log('Firebase: FCM token sent to backend successfully');
      console.log('Firebase: Response:', data);
      return true;
    } else {
      console.error('Firebase: Failed to send FCM token to backend');
      console.error('Firebase: Response status:', response.status);
      console.error('Firebase: Response data:', data);
      return false;
    }
  } catch (error: any) {
    // Only log errors in development, and make them less noisy
    if (__DEV__) {
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('Network request failed')) {
        // This is expected if backend isn't running - log at debug level only
        console.log('Firebase: Backend not available (this is OK if backend is not running)');
        console.log('Firebase: Backend should be at:', API_BASE_URL);
      } else {
        console.error('Firebase: Error sending FCM token:', errorMessage);
      }
    }
    // Silently fail in production or when backend is unavailable
    return false;
  }
};

/**
 * Log analytics event
 */
export const logEvent = async (eventName: string, params?: Record<string, any>) => {
  try {
    await analytics().logEvent(eventName, params);
    console.log(`Firebase: Logged event: ${eventName}`, params);
  } catch (error) {
    console.error('Firebase: Error logging event:', error);
  }
};

/**
 * Set user properties for analytics
 */
export const setUserProperties = async (properties: Record<string, string>) => {
  try {
    for (const [key, value] of Object.entries(properties)) {
      await analytics().setUserProperty(key, value);
    }
    console.log('Firebase: User properties set:', properties);
  } catch (error) {
    console.error('Firebase: Error setting user properties:', error);
  }
};

/**
 * Get FCM token
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Firebase: Error getting FCM token:', error);
    return null;
  }
};

/**
 * Subscribe to topic for push notifications
 */
export const subscribeToTopic = async (topic: string) => {
  try {
    await messaging().subscribeToTopic(topic);
    console.log(`Firebase: Subscribed to topic: ${topic}`);
  } catch (error) {
    console.error('Firebase: Error subscribing to topic:', error);
  }
};

/**
 * Unsubscribe from topic
 */
export const unsubscribeFromTopic = async (topic: string) => {
  try {
    await messaging().unsubscribeFromTopic(topic);
    console.log(`Firebase: Unsubscribed from topic: ${topic}`);
  } catch (error) {
    console.error('Firebase: Error unsubscribing from topic:', error);
  }
};

// Set up background message handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Firebase: Message handled in the background!', remoteMessage);
});

