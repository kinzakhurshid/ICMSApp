import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ISprint } from '../Screens/types';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface SprintCardProps {
  sprint: ISprint;
  onPress?: (sprintId: string) => void;
}

const SprintCard: React.FC<SprintCardProps> = ({ sprint, onPress }) => {
  const navigation = useNavigation();

  const handlePress = () => {
    if (onPress) {
      onPress(sprint._id);
    } else {
      (navigation as any).navigate('SprintDetailNew', { sprintId: sprint._id });
    }
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.colorIndicator, { backgroundColor: sprint.color || '#f97316' }]} />
        <Text style={styles.name}>{sprint.name}</Text>
      </View>
      {sprint.goal && (
        <Text style={styles.goal} numberOfLines={2}>
          {sprint.goal}
        </Text>
      )}
      <View style={styles.dates}>
        <View style={styles.dateItem}>
          <Icon name="calendar-today" size={14} color="#6b7280" />
          <Text style={styles.dateText}>
            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
          </Text>
        </View>
      </View>
      <View style={styles.footer}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {sprint.tasks?.length || 0} {sprint.tasks?.length === 1 ? 'task' : 'tasks'}
          </Text>
        </View>
        {sprint.completed && (
          <View style={[styles.badge, styles.completedBadge]}>
            <Text style={[styles.badgeText, styles.completedText]}>Completed</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  goal: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  dates: {
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#10b981',
  },
  completedText: {
    color: '#FFFFFF',
  },
});

export default SprintCard;



