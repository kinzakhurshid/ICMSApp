import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: 'not_started' | 'started' | 'completed';
  size?: 'small' | 'medium' | 'large';
}

export default function SprintStatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'not_started':
        return { label: 'Not Started', color: '#6b7280', bgColor: '#f3f4f6' };
      case 'started':
        return { label: 'Started', color: '#10b981', bgColor: '#d1fae5' };
      case 'completed':
        return { label: 'Completed', color: '#3b82f6', bgColor: '#dbeafe' };
      default:
        return { label: 'Unknown', color: '#6b7280', bgColor: '#f3f4f6' };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }, sizeStyles]}>
      <Text style={[styles.text, { color: config.color }, sizeStyles.text]}>
        {config.label}
      </Text>
    </View>
  );
}

function getSizeStyles(size: string) {
  switch (size) {
    case 'small':
      return {
        paddingHorizontal: 8,
        paddingVertical: 4,
        text: { fontSize: 11 },
      };
    case 'large':
      return {
        paddingHorizontal: 16,
        paddingVertical: 8,
        text: { fontSize: 14 },
      };
    default:
      return {
        paddingHorizontal: 12,
        paddingVertical: 6,
        text: { fontSize: 12 },
      };
  }
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
  },
});


