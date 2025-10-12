import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
}

export const SprintTasksTable: React.FC<SprintTasksTableProps> = ({
  tasks,
  onRemoveTask,
  isLoading = false,
  rowClickBasePath = "/PM/tasks",
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
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No tasks in this sprint yet.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Table Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 3 }]}>Task</Text>
        <Text style={[styles.headerText, { flex: 2 }]}>Project</Text>
        <Text style={[styles.headerText, { flex: 1.5 }]}>Priority</Text>
        <Text style={[styles.headerText, { flex: 1.5 }]}>Status</Text>
        {onRemoveTask && (
          <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>Actions</Text>
        )}
      </View>

      {/* Table Rows */}
      {tasks.map((task) => {
        const statusColors = getStatusColor(task.status);
        const priorityColors = getPriorityColor(task.priority);

        return (
          <TouchableOpacity
            key={task._id}
            style={styles.taskRow}
            onPress={() => {
              // Navigate to task details
              // navigation.navigate('TaskDetails', { taskId: task._id });
            }}
          >
            <View style={[styles.cell, { flex: 3 }]}>
              <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
              {task.description && (
                <Text style={styles.taskDescription} numberOfLines={1}>
                  {task.description}
                </Text>
              )}
            </View>

            <View style={[styles.cell, { flex: 2 }]}>
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

            <View style={[styles.cell, { flex: 1.5 }]}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityColors.bg }]}>
                <Text style={[styles.priorityText, { color: priorityColors.text }]}>
                  {task.priority}
                </Text>
              </View>
            </View>

            <View style={[styles.cell, { flex: 1.5 }]}>
              <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                <Text style={[styles.statusText, { color: statusColors.text }]}>
                  {task.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {onRemoveTask && (
              <View style={[styles.cell, { flex: 1, alignItems: 'flex-end' }]}>
                <TouchableOpacity
                  onPress={() => onRemoveTask(task._id)}
                  style={styles.removeButton}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  cell: {
    paddingHorizontal: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  taskDescription: {
    fontSize: 12,
    color: '#6B7280',
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    padding: 4,
  },
});
