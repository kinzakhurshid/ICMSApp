import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Bell } from 'react-native-feather';
import { useNavigation } from '@react-navigation/native';
import NotificationBadge from './NotificationBadge';

interface NotificationIconProps {
  unreadCount?: number;
  size?: number;
  color?: string;
}

const NotificationIcon: React.FC<NotificationIconProps> = ({
  unreadCount = 0,
  size = 24,
  color = '#1F2937',
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.navigate('NotificationsScreen');
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Bell size={size} color={color} />
      {unreadCount > 0 && (
        <NotificationBadge
          count={unreadCount}
          size="small"
          color="#FF6B35"
          style={styles.badge}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});

export default NotificationIcon;





