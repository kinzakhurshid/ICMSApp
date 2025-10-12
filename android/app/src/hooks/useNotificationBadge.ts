import { useNotifications } from '../Context/NotificationContext';

export const useNotificationBadge = () => {
  const { unreadCount } = useNotifications();
  
  return {
    unreadCount,
    hasUnreadNotifications: unreadCount > 0,
    badgeText: unreadCount > 99 ? '99+' : unreadCount.toString(),
  };
};

export default useNotificationBadge;
