import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
import { ISprint, TaskDetails, Project } from './types';
import SprintStatusBadge from '../components/sprint/StatusBadge';
import MetricsCard from '../components/sprint/MetricsCard';
import TaskStatusChart from '../components/sprint/TaskStatusChart';
import MultiSelectField from '../components/task/MultiSelectField';
import { SprintTasksTable } from './components/SprintTasksTable';

export default function SprintDetailScreenNew() {
  const route = useRoute();
  const navigation = useNavigation();
  const { sprintId, from } = route.params as { sprintId: string; from?: string };
  const { callApi } = useAxios();

  const [sprint, setSprint] = useState<ISprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableTasks, setAvailableTasks] = useState<TaskDetails[]>([]);
  const [selectedTasksToAdd, setSelectedTasksToAdd] = useState<string[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isRemovingTask, setIsRemovingTask] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  /**
   * Smart back navigation:
   * - If we opened sprint detail from Sprint Board, always go back to Sprint Board
   * - Otherwise, rely on the normal navigation stack (goBack)
   */
  const handleBack = () => {
    try {
      // If this screen was opened explicitly from the Sprint Board drawer screen,
      // we want to make sure back returns there (because drawer screens don't
      // always keep a traditional stack history).
      if (from === 'SprintBoard') {
        const parent = (navigation as any).getParent?.();
        if (parent) {
          parent.navigate('SprintBoard' as never);
          return;
        }
        // Fallback if parent is not available
        (navigation as any).navigate('SprintBoard');
        return;
      }

      // Default behaviour: use the existing stack history
      if (
        (navigation as any).canGoBack &&
        typeof (navigation as any).canGoBack === 'function' &&
        (navigation as any).canGoBack()
      ) {
        (navigation as any).goBack();
      }
    } catch (error) {
      console.error('Navigation error in handleBack:', error);
      // Last resort: try simple goBack to avoid trapping the user
      if ((navigation as any).goBack) {
        (navigation as any).goBack();
      }
    }
  };

  useEffect(() => {
    loadSprintDetails();
  }, [sprintId]);

  const loadSprintDetails = async () => {
    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: `/sprints/${sprintId}`,
      });

      if (response) {
        setSprint(response);
        
        // Load possible tasks if sprint not completed
        if (!response.completed) {
          loadPossibleTasks();
        }
      }
    } catch (error: any) {
      console.error('Error loading sprint details:', error);
      Alert.alert('Error', 'Failed to load sprint details');
      handleBack();
    } finally {
      setLoading(false);
    }
  };

  const loadPossibleTasks = async () => {
    try {
      const response = await callApi({
        method: 'GET',
        url: `sprints/${sprintId}/possibletasks`,
      });
      
      if (response?.tasks) {
        setAvailableTasks(Array.isArray(response.tasks) ? response.tasks : []);
      }
    } catch (error) {
      console.error('Error loading possible tasks:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Sprint',
      'Are you sure you want to delete this sprint?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await callApi({
                method: 'DELETE',
                url: `/sprints/${sprintId}`,
              });
              Alert.alert('Success', 'Sprint deleted successfully');
              handleBack();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete sprint');
            }
          },
        },
      ]
    );
  };

  const handleStatusChange = async (newStatus: 'not_started' | 'started' | 'completed') => {
    try {
      await callApi({
        method: 'PATCH',
        url: `/sprints/${sprintId}/status`,
        data: { status: newStatus },
      });
      loadSprintDetails();
      setStatusDropdownOpen(false);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update sprint status');
    }
  };

  const handleStartSprint = async () => {
    try {
      await callApi({
        method: 'PATCH',
        url: `/sprints/${sprintId}/start`,
      });
      loadSprintDetails();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to start sprint');
    }
  };

  const handleCompleteSprint = async () => {
    try {
      await callApi({
        method: 'PATCH',
        url: `/sprints/${sprintId}/complete`,
      });
      loadSprintDetails();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to complete sprint');
    }
  };

  const handleAddTask = async () => {
    if (selectedTasksToAdd.length === 0) {
      Alert.alert('Error', 'Select at least one task');
      return;
    }

    try {
      setIsAddingTask(true);
      for (const taskId of selectedTasksToAdd) {
        await callApi({
          method: 'POST',
          url: `/sprints/${sprintId}/tasks`,
          data: { taskId },
        });
      }
      setSelectedTasksToAdd([]);
      loadSprintDetails();
      Alert.alert('Success', 'Tasks added to sprint');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to add tasks to sprint');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleRemoveTask = async (taskId: string) => {
    try {
      setIsRemovingTask(taskId);
      await callApi({
        method: 'DELETE',
        url: `/sprints/${sprintId}/tasks/${taskId}`,
      });
      loadSprintDetails();
      Alert.alert('Success', 'Task removed from sprint');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to remove task from sprint');
    } finally {
      setIsRemovingTask(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateRange = (start: string, end: string) => {
    return `${formatDate(start)} – ${formatDate(end)}`;
  };

  // Calculate task status distribution
  const taskStatusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      completed: 0,
      in_progress: 0,
      todo: 0,
      in_review: 0,
      blocked: 0,
      unknown: 0,
    };

    if (sprint?.tasks) {
      sprint.tasks.forEach((task) => {
        const status = task.status || 'unknown';
        counts[status] = (counts[status] || 0) + 1;
      });
    }

    return counts;
  }, [sprint?.tasks]);

  // Calculate completed and remaining hours
  const hoursMetrics = useMemo(() => {
    let completedHours = 0;
    let remainingHours = 0;

    if (sprint?.tasks) {
      sprint.tasks.forEach((task) => {
        completedHours += task.actualHours || 0;
        remainingHours += Math.max(0, (task.estimatedHours || 0) - (task.actualHours || 0));
      });
    }

    return { completedHours, remainingHours };
  }, [sprint?.tasks]);

  // Get current status
  const getCurrentStatus = (): 'not_started' | 'started' | 'completed' => {
    if (sprint?.completed) return 'completed';
    if (sprint?.started) return 'started';
    return 'not_started';
  };

  // Task options for multi-select
  const taskOptions = availableTasks.map((task) => ({
    label: task.title,
    value: task._id,
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading sprint details...</Text>
      </View>
    );
  }

  if (!sprint) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Sprint not found</Text>
        </View>
      </View>
    );
  }

  const currentStatus = getCurrentStatus();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Sprint Overview</Text>
          <Text style={styles.headerSubtitle}>{sprint.name}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.statusDropdownButton}
            onPress={() => setStatusDropdownOpen(!statusDropdownOpen)}
          >
            <SprintStatusBadge status={currentStatus} size="small" />
            <Ionicons name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => (navigation as any).navigate('EditSprint', { sprintId: sprint._id })}
          >
            <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Dropdown Modal */}
      {statusDropdownOpen && (
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatusDropdownOpen(false)}
        >
          <View style={styles.statusDropdownModal}>
            <TouchableOpacity
              style={styles.statusOption}
              onPress={() => handleStatusChange('not_started')}
            >
              <Text style={styles.statusOptionText}>Not Started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statusOption}
              onPress={() => handleStatusChange('started')}
            >
              <Text style={styles.statusOptionText}>Started</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statusOption}
              onPress={() => handleStatusChange('completed')}
            >
              <Text style={styles.statusOptionText}>Completed</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sprint Details Card */}
        <View style={styles.sprintDetailsCard}>
          <View style={styles.sprintHeader}>
            <View style={styles.sprintTitleRow}>
              <View style={[styles.sprintIndicator, { backgroundColor: sprint.color || '#3b82f6' }]} />
              <Text style={styles.sprintName}>{sprint.name}</Text>
              <SprintStatusBadge status={currentStatus} size="small" />
            </View>
            <Text style={styles.projectName}>
              {(sprint.projectId as Project[])?.[0]?.name || 'No Project'}
            </Text>
            <Text style={styles.dateRange}>
              {formatDateRange(sprint.startDate, sprint.endDate)}
            </Text>
          </View>
        </View>

        {/* Task Status Chart */}
        <TaskStatusChart counts={taskStatusCounts} />

        {/* Metrics Row - with spacing */}
        <View style={styles.metricsRow}>
          <View style={styles.metricsColumn}>
            <MetricsCard
              icon="checkmark-circle"
              label="Completed Hours"
              value={hoursMetrics.completedHours}
              iconColor="#10b981"
            />
          </View>
          <View style={styles.metricsColumn}>
            <MetricsCard
              icon="hourglass"
              label="Remaining Hours"
              value={hoursMetrics.remainingHours}
              iconColor="#f59e0b"
            />
          </View>
        </View>

        {/* Add Task to Sprint Card */}
        {!sprint.completed && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add task to sprint</Text>
            <View style={styles.addTaskContainer}>
              <Text style={styles.selectLabel}>Select Tasks</Text>
              <MultiSelectField
                label=""
                selectedValues={selectedTasksToAdd}
                options={taskOptions}
                onSelect={setSelectedTasksToAdd}
                placeholder="Choose one or more tasks..."
              />
              <TouchableOpacity
                style={[styles.addTaskButton, isAddingTask && styles.addTaskButtonDisabled]}
                onPress={handleAddTask}
                disabled={isAddingTask || selectedTasksToAdd.length === 0}
              >
                {isAddingTask ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addTaskButtonText}>Add Task</Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>
              You can add existing tasks to this sprint. Tasks already in the sprint are excluded.
            </Text>
          </View>
        )}

        {/* Sprint Tasks Table */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sprint Tasks ({sprint.tasks?.length || 0})</Text>
          <SprintTasksTable
            tasks={sprint.tasks || []}
            onRemoveTask={handleRemoveTask}
            isLoading={isRemovingTask !== null}
            onTaskPress={(taskId) => (navigation as any).navigate('TaskDetail', { taskId })}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editButton: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  deleteButton: {
    borderColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f97316',
  },
  editButtonText: {
    color: '#fff',
  },
  deleteButtonText: {
    color: '#ef4444',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
  },
  statusDropdownModal: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 150,
  },
  statusOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  scrollView: {
    flex: 1,
  },
  sprintDetailsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sprintHeader: {
    gap: 8,
  },
  sprintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sprintIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  sprintName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  dateRange: {
    fontSize: 14,
    color: '#6b7280',
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  metricsColumn: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  addTaskContainer: {
    gap: 12,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  addTaskButton: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  addTaskButtonDisabled: {
    opacity: 0.6,
  },
  addTaskButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

