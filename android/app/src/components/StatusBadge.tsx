import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium' | 'large';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const getStatusColor = (status: string): string => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'upcoming':
        return '#3B82F6'; // Light blue
      case 'not started':
        return '#6B7280'; // Gray
      case 'in progress':
        return '#F59E0B'; // Yellow/Orange
      case 'on hold':
        return '#f59e0b'; // Yellow
      case 'completed':
        return '#10b981'; // Green
      case 'cancelled':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 };
      case 'large':
        return { paddingHorizontal: 16, paddingVertical: 8, fontSize: 16 };
      default:
        return { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 };
    }
  };

  const sizeStyles = getSizeStyles();
  const backgroundColor = getStatusColor(status);

  return (
    <View style={[styles.badge, { backgroundColor, ...sizeStyles }]}>
      <Text style={[styles.text, { fontSize: sizeStyles.fontSize }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});

export default StatusBadge;

