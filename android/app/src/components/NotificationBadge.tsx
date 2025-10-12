import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  style?: any;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  size = 'medium',
  color = '#FF4444',
  textColor = '#FFFFFF',
  style,
}) => {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return {
          width: 16,
          height: 16,
          borderRadius: 8,
          fontSize: 10,
        };
      case 'large':
        return {
          width: 24,
          height: 24,
          borderRadius: 12,
          fontSize: 14,
        };
      default: // medium
        return {
          width: 20,
          height: 20,
          borderRadius: 10,
          fontSize: 12,
        };
    }
  };

  const badgeSize = getBadgeSize();

  return (
    <View
      style={[
        styles.badge,
        {
          width: badgeSize.width,
          height: badgeSize.height,
          borderRadius: badgeSize.borderRadius,
          backgroundColor: color,
          minWidth: badgeSize.width,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          {
            fontSize: badgeSize.fontSize,
            color: textColor,
          },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  badgeText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificationBadge;
