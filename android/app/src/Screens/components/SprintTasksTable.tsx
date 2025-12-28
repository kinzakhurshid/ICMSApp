import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface TaskDetails {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId?: {
    _id: string;
    name: string;
    color?: string;
  };
  dueDate?: string;
  assignedTo?: Array<{
    _id: string;
    fullName: string;
    profilePic?: string;
  }>;
}

interface SprintTasksTableProps {
  tasks: TaskDetails[];
  onRemoveTask?: (taskId: string) => void;
  isLoading?: boolean;
  rowClickBasePath?: string;
  onTaskPress?: (taskId: string) => void;
}

export const SprintTasksTable: React.FC<SprintTasksTableProps> = ({
  tasks,
  onRemoveTask,
  isLoading = false,
  rowClickBasePath = "/PM/tasks",
  onTaskPress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#DCFCE7', text: '#166534' };
      case 'in_progress':
        return { bg: '#DBEAFE', text: '#1E40AF' };
      case 'todo':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'in_review':
        return { bg: '#E9D5FF', text: '#6B21A8' };
      case 'blocked':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'medium':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'low':
        return { bg: '#DCFCE7', text: '#166534' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyWrapper}>
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No tasks in this sprint yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* Table Header */}
          <View style={styles.headerRow}>
            <Text style={[styles.headerText, { width: 250 }]}>TASK</Text>
            <Text style={[styles.headerText, { width: 180 }]}>PROJECT</Text>
            <Text style={[styles.headerText, { width: 100 }]}>PRIORITY</Text>
            <Text style={[styles.headerText, { width: 120 }]}>STATUS</Text>
            {onRemoveTask && (
              <Text style={[styles.headerText, { width: 80, textAlign: 'center' }]}>ACTIONS</Text>
            )}
          </View>

          {/* Table Rows */}
          {tasks.map((task, index) => {
            const statusColors = getStatusColor(task.status);
            const priorityColors = getPriorityColor(task.priority);
            const isLast = index === tasks.length - 1;

            return (
              <TouchableOpacity
                key={task._id}
                style={[styles.taskRow, isLast && styles.taskRowLast]}
                onPress={() => {
                  if (onTaskPress) {
                    onTaskPress(task._id);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.cell, { width: 250 }]}>
                  <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                  {task.description && (
                    <Text style={styles.taskDescription} numberOfLines={1}>
                      {task.description}
                    </Text>
                  )}
                </View>

                <View style={[styles.cell, { width: 180 }]}>
                  {task.projectId ? (
                    <View style={[styles.projectBadge, { backgroundColor: task.projectId.color || '#f97316' }]}>
                      <Text style={styles.projectText} numberOfLines={1}>
                        {task.projectId.name}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noProjectText}>-</Text>
                  )}
                </View>

                <View style={[styles.cell, { width: 100 }]}>
                  <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
                    <Text style={[styles.priorityText, { color: priorityColors.text }]}>
                      {task.priority}
                    </Text>
                  </View>
                </View>

                <View style={[styles.cell, { width: 120 }]}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>
                      {task.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>

                {onRemoveTask && (
                  <View style={[styles.cell, { width: 80, alignItems: 'center' }]}>
                    <TouchableOpacity
                      onPress={() => onRemoveTask(task._id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  scrollContainer: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  container: {
    // Let the parent card control background, radius, and shadow so alignment stays consistent
    backgroundColor: 'transparent',
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    minWidth: Math.max(width - 32, 730),
  },
  emptyWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  taskRowLast: {
    borderBottomWidth: 0,
  },
  cell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  projectBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  projectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  noProjectText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    minWidth: 70,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    minWidth: 90,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  removeButton: {
    padding: 4,
  },
});
