import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PriorityBadgeProps {
  priority: string;
  variant?: 'outlined' | 'filled';
  vertical?: boolean; // For vertical text layout
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, variant = 'outlined', vertical = false }) => {
  const getPriorityColor = (priority: string): string => {
    const normalizedPriority = priority.toLowerCase();
    switch (normalizedPriority) {
      case 'low':
        return '#10b981'; // Green
      case 'medium':
        return '#f59e0b'; // Yellow/Orange
      case 'high':
        return '#f97316'; // Orange
      case 'critical':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const color = getPriorityColor(priority);

  return (
    <View
      style={[
        styles.badge,
        variant === 'filled' ? { backgroundColor: color } : { borderColor: color, borderWidth: 1 },
        vertical && styles.verticalBadge,
      ]}
    >
      {vertical ? (
        <View style={styles.verticalContainer}>
          {priority.split('').map((char, index) => (
            <Text
              key={index}
              style={[
                styles.verticalText,
                variant === 'filled' ? { color: '#FFFFFF' } : { color },
              ]}
            >
              {char}
            </Text>
          ))}
        </View>
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'filled' ? { color: '#FFFFFF' } : { color },
          ]}
        >
          {priority}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  verticalBadge: {
    width: 28,
    height: 56,
    paddingHorizontal: 2,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  verticalText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
});

export default PriorityBadge;

