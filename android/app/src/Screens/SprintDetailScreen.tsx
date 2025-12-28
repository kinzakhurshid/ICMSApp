import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Components
import { SprintTasksTable } from './components/SprintTasksTable';
import { SearchableSelect } from './components/SearchableSelect';
import { MultiSelect } from './components/MultiSelect';
import { Button } from './components/Button';
import { Loader } from './components/Loader';

// Types and hooks
import { Project, TaskDetails, ISprint } from './types';
import useAxios from '../hooks/useAxios';
import { stringToColor, formatDate } from './utils';

export default function SprintDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { from } = (route.params as { sprintId: string; from?: string }) || {};
  const { callApi, loading } = useAxios();

  // Smart back navigation:
  // - If opened explicitly from SprintBoard, always go back to SprintBoard
  // - Otherwise, rely on normal stack history (goBack)
  const handleBack = () => {
    try {
      if (from === 'SprintBoard') {
        const parent = (navigation as any).getParent?.();
        if (parent) {
          parent.navigate('SprintBoard' as never);
          return;
        }
        (navigation as any).navigate('SprintBoard');
        return;
      }

      if (
        (navigation as any).canGoBack &&
        typeof (navigation as any).canGoBack === 'function' &&
        (navigation as any).canGoBack()
      ) {
        (navigation as any).goBack();
      }
    } catch (error) {
      console.error('Navigation error in handleBack:', error);
      if ((navigation as any).goBack) {
        (navigation as any).goBack();
      }
    }
  };

  const [sprint, setSprint] = useState<ISprint | null>(null);
  const [allTasks, setAllTasks] = useState<TaskDetails[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [availableTasks, setAvailableTasks] = useState<TaskDetails[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [selectedTasksToAdd, setSelectedTasksToAdd] = useState<string[]>([]);
  const [selectedProjectToAdd, setSelectedProjectToAdd] = useState<string>('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isRemovingTaskId, setIsRemovingTaskId] = useState<string | null>(null);
  const [isRemovingProjectId, setIsRemovingProjectId] = useState<string | null>(null);
  const [showDeleteProjectIcons, setShowDeleteProjectIcons] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const sprintId = (route.params as any)?.sprintId;

  // Generate colors for projects
  const projectsWithColors = useMemo(() => {
    if (!sprint?.projectId) return [];
    return (sprint.projectId as Project[]).map(project => ({
      ...project,
      color: project.color || stringToColor(project.name),
    }));
  }, [sprint?.projectId]);

  const loadData = async () => {
    if (!sprintId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load sprint data
      const sprintResponse = await callApi({
        method: 'GET',
        url: `/sprints/${sprintId}`,
      });

      if (!sprintResponse) throw new Error('No sprint data received');
      setSprint(sprintResponse);

      // Load all projects
      const projectsResponse = await callApi({
        method: 'GET',
        url: '/projects/running',
      });

      setAllProjects(Array.isArray(projectsResponse?.data) ? projectsResponse.data : []);

      // If sprint is completed, we don't need tasks
      if (sprintResponse.completed) {
        setAllTasks([]);
        return;
      }

      // Load all tasks only if sprint not completed
      const tasksResponse = await callApi({
        method: 'GET',
        url: `sprints/${sprintId}/possibletasks`,
      });

      setAllTasks(Array.isArray(tasksResponse?.tasks) ? tasksResponse.tasks : []);
    } catch (err) {
      setError('Failed to load sprint details');
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sprintId]);

  // Compute available tasks
  useEffect(() => {
    if (!sprint) {
      setAvailableTasks(allTasks);
      return;
    }
    const sprintTaskIds = new Set(sprint.tasks.map(t => t._id));
    setAvailableTasks(allTasks.filter(t => !sprintTaskIds.has(t._id)));
  }, [allTasks, sprint]);

  // Compute available projects
  useEffect(() => {
    if (!sprint) {
      setAvailableProjects(allProjects);
      return;
    }
    const sprintProjectIds = new Set((sprint.projectId as Project[]).map(p => p._id));
    setAvailableProjects(allProjects.filter(p => !sprintProjectIds.has(p._id)));
  }, [allProjects, sprint]);

  // Task counts by status
  const taskCountsByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    (sprint?.tasks ?? []).forEach(t => {
      const s = t.status ?? 'Unknown';
      map[s] = (map[s] || 0) + 1;
    });
    ['completed', 'in_progress', 'todo', 'in_review', 'blocked', 'Unknown'].forEach(k => {
      if (!map[k]) map[k] = 0;
    });
    return map;
  }, [sprint]);


  const handleRemoveTask = async (taskId: string) => {
    if (!sprintId) return;
    setIsRemovingTaskId(taskId);
    try {
      await callApi({ method: 'DELETE', url: `/sprints/${sprintId}/tasks/${taskId}` });

      setSprint(prev => prev ? { ...prev, tasks: prev.tasks.filter(t => t._id !== taskId) } : prev);
      
      const removed = allTasks.find(t => t._id === taskId);
      if (removed) {
        setAvailableTasks(prev => [removed, ...prev]);
      }
      
      Alert.alert('Success', 'Task removed from sprint');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to remove task from sprint');
    } finally {
      setIsRemovingTaskId(null);
    }
  };

  const handleRemoveProject = async (projectId: string) => {
    if (!sprintId) return;
    setIsRemovingProjectId(projectId);
    try {
      await callApi({ method: 'DELETE', url: `/sprints/${sprintId}/projects/${projectId}` });

      setSprint(prev => {
        if (!prev) return prev;
        const updatedProjects = (prev.projectId as Project[]).filter(p => p._id !== projectId);
        return { ...prev, projectId: updatedProjects };
      });

      const removed = allProjects.find(p => p._id === projectId);
      if (removed) {
        setAvailableProjects(prev => [removed, ...prev]);
      }

      const tasksResponse = await callApi({
        method: 'GET',
        url: `sprints/${sprintId}/possibletasks`,
      });

      setAllTasks(Array.isArray(tasksResponse?.tasks) ? tasksResponse.tasks : []);
      
      Alert.alert('Success', 'Project removed from sprint');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to remove project from sprint');
    } finally {
      setIsRemovingProjectId(null);
      setShowDeleteProjectIcons(false);
    }
  };

  const handleAddProject = async () => {
    if (!sprintId) {
      Alert.alert('Error', 'Sprint id missing');
      return;
    }
    if (!selectedProjectToAdd) {
      Alert.alert('Error', 'Select a project');
      return;
    }

    setIsAddingProject(true);
    try {
      await callApi({
        method: 'POST',
        url: `/sprints/${sprintId}/projects`,
        data: { projectId: selectedProjectToAdd },
      });

      const addedProject = allProjects.find(p => p._id === selectedProjectToAdd);
      if (addedProject) {
        setSprint(prev => {
          if (!prev) return prev;
          const updatedProjects = [...(prev.projectId as Project[]), addedProject];
          return { ...prev, projectId: updatedProjects };
        });
        setAvailableProjects(prev => prev.filter(p => p._id !== selectedProjectToAdd));
      }

      const tasksResponse = await callApi({
        method: 'GET',
        url: `sprints/${sprintId}/possibletasks`,
      });

      setAllTasks(Array.isArray(tasksResponse?.tasks) ? tasksResponse.tasks : []);
      setSelectedProjectToAdd('');
      
      Alert.alert('Success', 'Project added to sprint');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add project to sprint');
    } finally {
      setIsAddingProject(false);
    }
  };

  const handleStartSprint = async () => {
    if (!sprintId) return;
    try {
      await callApi({ method: 'PATCH', url: `/sprints/${sprintId}/start` });
      const s = await callApi({ method: 'GET', url: `/sprints/${sprintId}` }) as ISprint;
      setSprint(s);
      Alert.alert('Success', 'Sprint started');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to start sprint');
    }
  };

  const handleCompleteSprint = async () => {
    if (!sprintId) return;
    try {
      await callApi({ method: 'PATCH', url: `/sprints/${sprintId}/complete` });
      const s = await callApi({ method: 'GET', url: `/sprints/${sprintId}` }) as ISprint;
      setSprint(s);
      Alert.alert('Success', 'Sprint Completed');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to complete sprint');
    }
  };

  const handleAddTask = async () => {
    if (!sprintId) {
      Alert.alert('Error', 'Sprint id missing');
      return;
    }
    if (selectedTasksToAdd.length === 0) {
      Alert.alert('Error', 'Select at least one task');
      return;
    }

    setIsAddingTask(true);
    try {
      for (const taskId of selectedTasksToAdd) {
        await callApi({
          method: 'POST',
          url: `/sprints/${sprintId}/tasks`,
          data: { taskId },
        });

        const addedTask = allTasks.find(t => t._id === taskId);
        if (addedTask) {
          setSprint(prev => prev ? { ...prev, tasks: [...prev.tasks, addedTask] } : prev);
          setAvailableTasks(prev => prev.filter(t => t._id !== taskId));
        }
      }

      setSelectedTasksToAdd([]);
      Alert.alert('Success', 'Tasks added to sprint');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add tasks to sprint');
    } finally {
      setIsAddingTask(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centered}>
        <Loader />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={loadData} title="Retry" />
      </View>
    );
  }

  if (!sprint) {
    return (
      <View style={styles.centered}>
        <Text>Loading sprint details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Sprint Overview</Text>
            <Text style={styles.subtitle} numberOfLines={1}>{sprint.name}</Text>
          </View>
        </View>

        {/* Sprint Info Card */}
        <View style={styles.card}>
          <View style={styles.sprintHeader}>
            <View style={styles.sprintInfo}>
              <View style={styles.sprintTitleRow}>
                <View style={[styles.colorIndicator, { backgroundColor: sprint.color ?? '#3b82f6' }]} />
                <Text style={styles.sprintName}>{sprint.name}</Text>
                {sprint.completed ? (
                  <View style={[styles.statusBadge, styles.completedBadge]}>
                    <Text style={[styles.statusText, styles.completedStatusText]}>Completed</Text>
                  </View>
                ) : sprint.started ? (
                  <View style={[styles.statusBadge, styles.startedBadge]}>
                    <Text style={[styles.statusText, styles.startedStatusText]}>Started</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.notStartedBadge]}>
                    <Text style={[styles.statusText, styles.notStartedStatusText]}>Not started</Text>
                  </View>
                )}
              </View>
              <Text style={styles.sprintGoal}>{sprint.goal ?? 'No goal defined'}</Text>
              <Text style={styles.sprintDates}>
                {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              {sprint.started && (
                <Button
                  onPress={handleCompleteSprint}
                  disabled={sprint.completed || loading}
                  title={sprint.completed ? 'Completed' : 'Complete'}
                />
              )}
              {!sprint.started && (
                <Button
                  onPress={handleStartSprint}
                  disabled={sprint.started || loading}
                  title={sprint.started ? 'Running' : 'Start'}
                />
              )}
            </View>
          </View>
        </View>


        {/* Projects Section */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Projects in this sprint ({projectsWithColors.length})
            </Text>
            <TouchableOpacity
              onPress={() => setShowDeleteProjectIcons(!showDeleteProjectIcons)}
              style={styles.deleteToggle}
            >
              <Ionicons name="trash" size={18} color={showDeleteProjectIcons ? '#EF4444' : '#6B7280'} />
            </TouchableOpacity>
          </View>

          <View style={styles.projectsList}>
            {projectsWithColors.length > 0 ? (
              projectsWithColors.map(project => (
                <View key={project._id} style={styles.projectItem}>
                  <TouchableOpacity
                    style={styles.projectButton}
                    onPress={() => {
                      // Navigate to project details
                      // navigation.navigate('ProjectDetails', { id: project._id });
                    }}
                  >
                    <View
                      style={[styles.projectColor, { backgroundColor: project.color }]}
                    />
                    <Text style={styles.projectName} numberOfLines={1}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                  {showDeleteProjectIcons && (
                    <TouchableOpacity
                      onPress={() => handleRemoveProject(project._id)}
                      disabled={isRemovingProjectId === project._id}
                      style={styles.removeButton}
                    >
                      {isRemovingProjectId === project._id ? (
                        <ActivityIndicator size={12} color="#FFFFFF" />
                      ) : (
                        <Ionicons name="close" size={12} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>No projects associated</Text>
            )}
          </View>

          {!sprint.completed && availableProjects.length > 0 && (
            <View style={styles.addSection}>
              <Text style={styles.addSectionTitle}>Add Project to Sprint</Text>
              <View style={styles.addProjectRow}>
                <SearchableSelect
                  options={availableProjects.map(p => ({
                    value: p._id,
                    label: p.name,
                  }))}
                  value={selectedProjectToAdd}
                  onChange={setSelectedProjectToAdd}
                  placeholder="Choose a project..."
                  style={styles.flex1}
                />
                <Button
                  onPress={handleAddProject}
                  disabled={isAddingProject || !selectedProjectToAdd}
                  style={styles.addButton}
                >
                  {isAddingProject ? (
                    <ActivityIndicator size={16} color="#FFFFFF" />
                  ) : (
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  )}
                </Button>
              </View>
            </View>
          )}
        </View>

        {/* Add Tasks Section */}
        {!sprint.completed && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add task to sprint</Text>
            <View style={styles.addTaskContainer}>
              <MultiSelect
                options={availableTasks.map(t => ({
                  value: t._id,
                  label: t.title,
                }))}
                selectedValues={selectedTasksToAdd}
                onChange={setSelectedTasksToAdd}
                placeholder="Choose one or more tasks..."
              />
              <Button
                onPress={handleAddTask}
                disabled={isAddingTask || !selectedTasksToAdd.length}
                title={isAddingTask ? 'Adding...' : 'Add Task'}
                style={styles.addTaskButton}
              />
            </View>
            <Text style={styles.helperText}>
              You can add existing tasks to this sprint. Tasks already in the sprint are excluded.
            </Text>
          </View>
        )}

        {/* Tasks Table */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sprint Tasks ({sprint.tasks.length})</Text>
          </View>
          <SprintTasksTable
            tasks={sprint.tasks}
            onRemoveTask={handleRemoveTask}
            isLoading={isLoading}
            onTaskPress={(taskId) => {
              // Navigate to TaskDetail screen
              // Try to navigate via parent navigator first (TasksTab stack)
              const parent = navigation.getParent();
              if (parent) {
                try {
                  parent.navigate('TasksTab' as never, {
                    screen: 'TaskDetail',
                    params: { taskId },
                  } as never);
                } catch (error) {
                  console.error('Navigation error to TaskDetail:', error);
                  // Fallback: try direct navigation
                  (navigation as any).navigate('TaskDetail', { taskId });
                }
              } else {
                // Fallback: try direct navigation
                (navigation as any).navigate('TaskDetail', { taskId });
              }
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sprintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sprintInfo: {
    flex: 1,
  },
  sprintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  colorIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginRight: 12,
  },
  sprintName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#DCFCE7',
  },
  startedBadge: {
    backgroundColor: '#DCFCE7',
  },
  notStartedBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  completedStatusText: {
    color: '#166534',
  },
  startedStatusText: {
    color: '#166534',
  },
  notStartedStatusText: {
    color: '#92400E',
  },
  sprintGoal: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  sprintDates: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButtons: {
    marginLeft: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  deleteToggle: {
    padding: 4,
  },
  projectsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  projectItem: {
    position: 'relative',
  },
  projectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  projectColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  projectName: {
    fontSize: 14,
    color: '#374151',
    maxWidth: 120,
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  addSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  addSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  addProjectRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  flex1: {
    flex: 1,
  },
  addButton: {
    paddingHorizontal: 12,
    minWidth: 44,
  },
  addTaskContainer: {
    gap: 12,
    marginBottom: 8,
  },
  addTaskButton: {
    alignSelf: 'flex-start',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
  },
});