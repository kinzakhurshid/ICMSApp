import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { TaskDetails } from '../Screens/types';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface TaskListViewProps {
  tasks: TaskDetails[];
  onTaskPress?: (taskId: string) => void;
  onCreateTask?: () => void;
  onExportAll?: () => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onTaskPress,
  onCreateTask,
  onExportAll,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Tasks</Text>
        </View>
        <View style={styles.headerRight}>
          {onCreateTask && (
            <TouchableOpacity style={styles.createButton} onPress={onCreateTask}>
              <Text style={styles.createButtonText}>Create Task</Text>
            </TouchableOpacity>
          )}
          {onExportAll && (
            <TouchableOpacity style={styles.exportButton} onPress={onExportAll}>
              <Icon name="download" size={20} color="#f97316" />
              <Text style={styles.exportButtonText}>Export All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        style={styles.tableScrollContainer}
        contentContainerStyle={styles.tableScrollContent}
      >
        <View style={styles.tableWrapper}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerText, { width: 200 }]}>TASK</Text>
            <Text style={[styles.headerText, { width: 140 }]}>ASSIGNED TO</Text>
            <Text style={[styles.headerText, { width: 100 }]}>PRIORITY</Text>
            <Text style={[styles.headerText, { width: 110 }]}>STATUS</Text>
            <Text style={[styles.headerText, { width: 120 }]}>DUE DATE</Text>
            <Text style={[styles.headerText, { width: 100 }]}>EST. HOURS</Text>
          </View>

          {tasks.length > 0 ? (
            <View>
              {tasks.map((task) => (
                <TouchableOpacity
                  key={task._id}
                  style={styles.taskRow}
                  onPress={() => onTaskPress?.(task._id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.taskTitle, { width: 200 }]} numberOfLines={1}>
                    {task.title}
                  </Text>
                  <View style={[styles.assignedTo, { width: 140 }]}>
                    {task.assignedTo && task.assignedTo.length > 0 ? (
                      <View style={styles.avatarContainer}>
                        {task.assignedTo.slice(0, 3).map((member, index) => (
                          <View key={member._id} style={[styles.avatar, { marginLeft: index > 0 ? -8 : 0 }]}>
                            <Text style={styles.avatarText}>{getInitials(member.fullName || member.firstName + ' ' + member.lastName)}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noAssignee}>Unassigned</Text>
                    )}
                  </View>
                  <View style={[styles.priority, { width: 100 }]}>
                    <PriorityBadge priority={task.priority} variant="outlined" />
                  </View>
                  <View style={[styles.status, { width: 110 }]}>
                    <StatusBadge status={task.status} size="small" />
                  </View>
                  <Text style={[styles.dueDate, { width: 120 }]}>{formatDate(task.dueDate)}</Text>
                  <Text style={[styles.estHours, { width: 100 }]}>
                    {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tasks found for this project</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  createButton: {
    backgroundColor: '#f97316',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f97316',
    gap: 6,
  },
  exportButtonText: {
    color: '#f97316',
    fontSize: 14,
    fontWeight: '600',
  },
  tableScrollContainer: {
    maxHeight: 400,
  },
  tableScrollContent: {
    paddingBottom: 8,
  },
  tableWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    minWidth: 770,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
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
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    minHeight: 56,
  },
  taskTitle: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    paddingRight: 8,
  },
  assignedTo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noAssignee: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  priority: {
    paddingRight: 8,
    alignItems: 'flex-start',
  },
  status: {
    paddingRight: 8,
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    paddingRight: 8,
  },
  estHours: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default TaskListView;



