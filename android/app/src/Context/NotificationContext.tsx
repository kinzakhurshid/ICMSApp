import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';

// User interface for notifications
export interface NotificationUser {
  _id: string;
  username?: string;
  profilePicture?: string;
  name?: string;
}

// Chat interface for notifications (used for message-type notifications)
export interface NotificationChat {
  _id: string;
  name?: string;
  type?: string;
}

// Message interface for notifications (used for inbox/chat notifications)
export interface NotificationMessage {
  _id: string;
  content: string;
  messageType?: string;
}

// Main notification interface
// NOTE: Backend can return different notification modules (PM, HR, etc.)
// so we keep this interface flexible and normalise in fetchNotifications.
export interface InboxNotification {
  _id: string;
  receiver: string;
  // Backend may send either a user object or an ID string
  sender: NotificationUser | string;
  // Can be "message", "reaction", "mention", "system", "task", etc.
  type: string;
  chat?: NotificationChat;
  relatedMessage?: NotificationMessage;
  title: string;
  body: string;
  metadata: Record<string, any>;
  // Derived flag in frontend based on readAt / read boolean
  read: boolean;
  delivered: boolean;
  createdAt: string;
  updatedAt: string;
  // Additional fields from new notifications API
  organizationId?: string;
  action?: string;
  link?: string;
  entity?: {
    kind: string;
    id: string;
  };
  severity?: string;
  module?: string;
  deliveredAt?: string;
  readAt?: string | null;
  isArchived?: boolean;
}

// API Response interfaces
export interface NotificationsResponse {
  notifications: InboxNotification[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export interface UnreadCountResponse {
  count: number;
}

// Notification tab types
export type NotificationTab = "inbox" | "general";

interface NotificationContextType {
  notifications: InboxNotification[];
  unreadCount: number;
  loading: boolean;
  notificationsLoading: boolean;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: InboxNotification) => void;
  openChat: (chatId: string) => void;
  chatToOpen: string | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false);
  const [chatToOpen, setChatToOpen] = useState<string | null>(null);
  const { callApi } = useAxios();
  
  // Get current user from Redux store
  const { currentUser } = useSelector((state: RootState) => state.user);

  // Get current user ID from Redux store
  const getCurrentUserId = (): string => {
    return currentUser?._id || currentUser?.id || '';
  };

  const fetchNotifications = async (page = 1, limit = 50): Promise<void> => {
    try {
      setNotificationsLoading(true);

      const userId = getCurrentUserId();
      if (!userId) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      // Helper to normalise raw notifications from any backend shape
      const normaliseItems = (items: any[]): InboxNotification[] => {
        return items.map((raw: any) => {
          const readFlag = !!(raw.read || raw.readAt);
          const deliveredFlag = !!(raw.delivered || raw.deliveredAt);

          // Normalise sender: can be an object or an ID string
          let sender: NotificationUser | string;
          if (raw.sender && typeof raw.sender === 'object') {
            sender = {
              _id: raw.sender._id || raw.sender.id || '',
              username: raw.sender.username,
              profilePicture: raw.sender.profilePicture,
              name: raw.sender.name,
            };
          } else {
            sender = typeof raw.sender === 'string'
              ? raw.sender
              : '';
          }

          return {
            _id: raw._id,
            receiver: raw.receiver,
            sender,
            type: raw.type || 'system',
            chat: raw.chat,
            relatedMessage: raw.relatedMessage,
            title: raw.title || '',
            body: raw.body || '',
            metadata: raw.metadata || {},
            read: readFlag,
            delivered: deliveredFlag,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
            organizationId: raw.organizationId,
            action: raw.action,
            link: raw.link,
            entity: raw.entity,
            severity: raw.severity,
            module: raw.module,
            deliveredAt: raw.deliveredAt,
            readAt: raw.readAt,
            isArchived: raw.isArchived,
          };
        });
      };

      // First try the unified notifications API (used by the web app)
      let response: any;
      let items: any[] = [];

      try {
        response = await callApi({
          method: 'GET',
          url: '/notifications',
          params: {
            page,
            limit,
            type: 'all', // Fetch all types of notifications (inbox and general)
          },
        });

        if (Array.isArray(response)) {
          items = response;
        } else if (Array.isArray(response?.notifications)) {
          items = response.notifications;
        } else if (Array.isArray(response?.data)) {
          items = response.data;
        } else if (Array.isArray(response?.results)) {
          items = response.results;
        }
      } catch (error) {
        console.error('Error fetching /notifications, falling back to inbox-notifications list:', error);
      }

      // If unified API returned nothing, fall back to legacy inbox notifications list
      if (!items.length) {
        try {
          const legacyResponse = await callApi({
            method: 'GET',
            url: `/inbox-notifications/user/${userId}`,
            params: { page, limit },
          });

          if (Array.isArray(legacyResponse)) {
            items = legacyResponse;
          } else if (Array.isArray(legacyResponse?.notifications)) {
            items = legacyResponse.notifications;
          } else if (Array.isArray(legacyResponse?.data)) {
            items = legacyResponse.data;
          }
        } catch (legacyError) {
          console.error('Error fetching legacy inbox notifications:', legacyError);
        }
      }

      // Normalise raw notifications into our InboxNotification shape
      const normalised: InboxNotification[] = normaliseItems(items);
      setNotifications(normalised);

      // Derive unread count from the fetched list so badge stays in sync
      const unread = normalised.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const fetchUnreadCount = async (): Promise<void> => {
    try {
      setLoading(true);
      const userId = getCurrentUserId();
      if (!userId) return;

      const response = await callApi({
        method: 'GET',
        url: `/inbox-notifications/user/${userId}/count`
      });

      if (response && response.count !== undefined) {
        setUnreadCount(response.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string): Promise<void> => {
    try {
      // New notifications API – mark single notification as read
      await callApi({
        method: 'PATCH',
        url: `/notifications/${notificationId}/read`,
      });

      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async (): Promise<void> => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      await callApi({
        method: 'POST',
        url: `/inbox-notifications/user/${userId}/read-all`
      });

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAllNotifications = async (): Promise<void> => {
    try {
      const userId = getCurrentUserId();
      if (!userId) return;

      await callApi({
        method: 'DELETE',
        url: `/inbox-notifications/user/${userId}/clear-all`
      });

      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const addNotification = (notification: InboxNotification): void => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Function to open a chat from anywhere (notifications, etc.)
  const openChat = (chatId: string): void => {
    console.log('NotificationContext: openChat called with chatId:', chatId);
    setChatToOpen(chatId);
    // Clear after a short delay to allow ChatContainer to pick it up
    setTimeout(() => setChatToOpen(null), 100);
  };

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    notificationsLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    addNotification,
    openChat,
    chatToOpen,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;