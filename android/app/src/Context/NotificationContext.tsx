import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';

// User interface for notifications
export interface NotificationUser {
  _id: string;
  username: string;
  profilePicture?: string;
  name?: string;
}

// Chat interface for notifications
export interface NotificationChat {
  _id: string;
  name?: string;
  type?: string;
}

// Message interface for notifications
export interface NotificationMessage {
  _id: string;
  content: string;
  messageType?: string;
}

// Main notification interface
export interface InboxNotification {
  _id: string;
  receiver: string;
  sender: NotificationUser;
  type: "message" | "reaction" | "mention" | "system" | "group_invite";
  chat?: NotificationChat;
  relatedMessage?: NotificationMessage;
  title: string;
  body: string;
  metadata: Record<string, any>;
  read: boolean;
  delivered: boolean;
  createdAt: string;
  updatedAt: string;
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

  const fetchNotifications = async (page = 1, limit = 20): Promise<void> => {
    try {
      setNotificationsLoading(true);
      const userId = getCurrentUserId();
      if (!userId) return;

      const response = await callApi({
        method: 'GET',
        url: `/inbox-notifications/user/${userId}`,
        params: { page, limit }
      });

      if (response && response.notifications) {
        setNotifications(response.notifications);
      }
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
      await callApi({
        method: 'PUT',
        url: `/inbox-notifications/${notificationId}/read`
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