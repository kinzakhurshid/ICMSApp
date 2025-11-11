import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNotifications } from '../Context/NotificationContext';
import NotificationBadge from './NotificationBadge';

interface ChatHeaderProps {
  title: string;
  onBackPress: () => void;
  onNotificationPress?: () => void;
  showNotificationIcon?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  onBackPress,
  onNotificationPress,
  showNotificationIcon = true,
}) => {
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <Icon name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.rightActions}>
        {showNotificationIcon && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationPress}
          >
            <Icon name="notifications-outline" size={24} color="#1F2937" />
            {unreadCount > 0 && (
              <NotificationBadge
                count={unreadCount}
                size="small"
                style={styles.notificationBadge}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default ChatHeader;