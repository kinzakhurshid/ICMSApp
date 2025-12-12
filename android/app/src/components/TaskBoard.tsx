import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { TaskDetails } from '../Screens/types';
import StatusBadge from './StatusBadge';

interface TaskBoardProps {
  tasks: TaskDetails[];
  onTaskPress?: (taskId: string) => void;
  onCreateTask?: () => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onTaskPress, onCreateTask }) => {
  const { width } = Dimensions.get('window');
  const columnWidth = (width - 48) / 3; // 3 columns with padding

  const statusColumns = [
    { key: 'To Do', label: 'To Do', color: '#6b7280' },
    { key: 'In Progress', label: 'In Progress', color: '#f59e0b' },
    { key: 'In Review', label: 'In Review', color: '#3b82f6' },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const renderTaskCard = (task: TaskDetails) => (
    <TouchableOpacity
      key={task._id}
      style={styles.taskCard}
      onPress={() => onTaskPress?.(task._id)}
      activeOpacity={0.7}
    >
      <Text style={styles.taskTitle} numberOfLines={2}>
        {task.title}
      </Text>
      {task.description && (
        <Text style={styles.taskDescription} numberOfLines={2}>
          {task.description}
        </Text>
      )}
      {task.priority && (
        <View style={styles.taskFooter}>
          <StatusBadge status={task.priority} size="small" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.key);
          return (
            <View key={column.key} style={[styles.column, { width: columnWidth }]}>
              <View style={styles.columnHeader}>
                <View style={[styles.statusIndicator, { backgroundColor: column.color }]} />
                <Text style={styles.columnTitle}>{column.label}</Text>
                <Text style={styles.taskCount}>{columnTasks.length}</Text>
              </View>
              <ScrollView style={styles.columnContent} nestedScrollEnabled>
                {columnTasks.length > 0 ? (
                  columnTasks.map(renderTaskCard)
                ) : (
                  <View style={styles.emptyColumn}>
                    <Text style={styles.emptyText}>Drop tasks here</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
      {onCreateTask && (
        <TouchableOpacity style={styles.createButton} onPress={onCreateTask}>
          <Text style={styles.createButtonText}>Create Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  column: {
    marginRight: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  taskCount: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  columnContent: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyColumn: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  createButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default TaskBoard;




