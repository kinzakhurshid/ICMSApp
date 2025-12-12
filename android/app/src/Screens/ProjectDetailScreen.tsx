import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';
import { CommonActions } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Define types for project data
type Sprint = {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  completed?: boolean;
  status?: string;
};

type Project = {
  _id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  budget: number;
  spent: number;
  client: string;
  clientContact: string;
  clientEmail: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  completeDate?: string;
  fileUrl?: string;
  projectManager?: {
    _id: string;
    fullName: string;
    email?: string;
    profilePic?: string;
  };
  teamMembers: Array<{
    _id: string;
    fullName: string;
    email?: string;
    profilePic?: string;
  }>;
};

type TaskDetails = {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
  assignedTo: Array<{
    _id: string;
    fullName: string;
    profilePic?: string;
  }>;
};

export default function ProjectDetailScreen({ navigation, route }: { navigation: any; route: any }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskDetails[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [taskLoading, setTaskLoading] = useState<boolean>(true);
  const [sprintLoading, setSprintLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board'); // Default to board view as per design
  const [searchQuery, setSearchQuery] = useState('');

  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const projectId = route.params?.projectId;

  const handleEditProject = () => {
    // Navigate to edit project screen
    navigation.navigate('EditProject', { projectId });
  };

  const handleTaskClick = (taskId: string) => {
    // Navigate to task details screen - need to navigate across sibling stacks
    // ProjectDetail is in ProjectStack, TaskDetail is in TaskStack
    // Both are children of PMTabNavigator
    try {
      // Try to navigate through parent tab navigator
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('TasksTab', {
          screen: 'TaskDetail',
          params: { taskId }
        });
      } else {
        // Fallback: use CommonActions to navigate
        navigation.dispatch(
          CommonActions.navigate({
            name: 'TasksTab',
            params: {
              screen: 'TaskDetail',
              params: { taskId }
            }
          })
        );
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Final fallback: try direct navigation
      navigation.navigate('TaskDetail' as never, { taskId } as never);
    }
  };

  const handleDownload = async () => {
    if (!project?.fileUrl) {
      Alert.alert('Error', 'No file available for download');
      return;
    }

    try {
      // For React Native, we'll open the file URL directly
      if (project.fileUrl?.startsWith('http')) {
        const supported = await Linking.canOpenURL(project.fileUrl);
        if (supported) {
          await Linking.openURL(project.fileUrl);
        } else {
          Alert.alert('Error', 'Cannot open this file type');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download file');
    }
  };

  const handleDeleteProject = () => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await callApi({
                method: 'DELETE',
                url: `/projects/${projectId}`,
              });

              Alert.alert('Success', 'Project deleted successfully!');
              navigation.goBack();
            } catch (err: any) {
              console.error(err);
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete project');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleMarkCompleted = async () => {
    try {
      setLoading(true);
      await callApi({
        method: 'PUT',
        url: `/projects/mark-complete/${projectId}`,
      });

      // Refresh project data
      const response = await callApi({
        method: 'GET',
        url: `/projects/${projectId}`,
      });
      setProject(response.data);
      Alert.alert('Success', 'Project marked as completed!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to mark project as completed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching project with ID:', projectId);
        console.log('API URL:', `/projects/${projectId}`);
        
        const response = await callApi({
          method: 'GET',
          url: `/projects/${projectId}`,
        });
        
        console.log('Project details response:', response);
        console.log('Response structure:', JSON.stringify(response, null, 2));
        console.log('Response success:', response?.success);
        console.log('Response data:', response?.data);
        
        // Check if response.data exists or if the data is directly in response
        const projectData = response.data || response;
        console.log('Project data to set:', projectData);
        console.log('Project data type:', typeof projectData);
        console.log('Project data keys:', projectData ? Object.keys(projectData) : 'No keys');
        
        if (projectData && (projectData._id || projectData.id)) {
          setProject(projectData);
          console.log('Project set successfully');
        } else {
          console.log('Project data is invalid:', projectData);
          Alert.alert('Error', 'Invalid project data received');
        }
      } catch (err) {
        console.error('Error fetching project details:', err);
        Alert.alert('Error', 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    };

    const fetchTasks = async () => {
      try {
        setTaskLoading(true);
        const response = await callApi({
          method: 'GET',
          url: `/task?projectId=${projectId}`,
        });
        console.log('Tasks response:', response);
        // Handle different response formats
        const tasksData = response?.data?.tasks || response?.data || response?.tasks || response || [];
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        console.log('Tasks set:', Array.isArray(tasksData) ? tasksData.length : 0, 'tasks');
      } catch (err) {
        console.error('Error fetching tasks:', err);
        // Don't show alert, just set empty array
        setTasks([]);
      } finally {
        setTaskLoading(false);
      }
    };

    const fetchSprints = async () => {
      try {
        setSprintLoading(true);
        const response = await callApi({
          method: 'GET',
          url: `/sprints/project/${projectId}`,
        });
        console.log('Sprints response:', response);
        // Handle different response formats
        const sprintsData = response?.data || response?.sprints || response || [];
        setSprints(Array.isArray(sprintsData) ? sprintsData : []);
      } catch (err) {
        console.error('Error fetching sprints:', err);
        // Don't show alert for sprints as it's optional
        setSprints([]);
      } finally {
        setSprintLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
      fetchTasks();
      fetchSprints();
    }
  }, [projectId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Ensure tasks is always an array to prevent undefined errors
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Normalize status for filtering - handle different status formats
  const normalizeStatus = (status: string) => {
    if (!status) return '';
    return status.toLowerCase().replace(/\s+/g, '_');
  };

  // Filter tasks based on search
  const filteredTasks = safeTasks.filter(task => 
    task?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task?.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate task statistics
  const taskStats = {
    total: safeTasks.length,
    completed: safeTasks.filter(t => normalizeStatus(t?.status) === 'completed').length,
    completionRate: safeTasks.length > 0 
      ? ((safeTasks.filter(t => normalizeStatus(t?.status) === 'completed').length / safeTasks.length) * 100).toFixed(1)
      : '0.0',
    teamMembers: (project?.teamMembers?.length || 0) + (project?.projectManager ? 1 : 0),
  };

  // Task counts by status - normalize status values for comparison
  const taskCountsByStatus = {
    todo: safeTasks.filter(t => normalizeStatus(t?.status) === 'todo').length,
    in_progress: safeTasks.filter(t => {
      const status = normalizeStatus(t?.status);
      return status === 'in_progress' || status === 'inprogress';
    }).length,
    in_review: safeTasks.filter(t => {
      const status = normalizeStatus(t?.status);
      return status === 'in_review' || status === 'inreview';
    }).length,
    completed: safeTasks.filter(t => normalizeStatus(t?.status) === 'completed').length,
    blocked: safeTasks.filter(t => normalizeStatus(t?.status) === 'blocked').length,
  };

  // Debug logging
  console.log('📊 [ProjectDetailScreen] Task Stats:', {
    total: taskStats.total,
    viewMode,
    taskCountsByStatus,
    filteredTasksCount: filteredTasks?.length || 0
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#10B981';
      case 'In Progress':
        return '#F59E0B';
      case 'Not Started':
        return '#6B7280';
      case 'On Hold':
        return '#EF4444';
      case 'Cancelled':
        return '#9CA3AF';
      default:
        return '#6B7280';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High':
        return <Ionicons name="flag" size={16} color="#EF4444" />;
      case 'Medium':
        return <Ionicons name="flag" size={16} color="#F59E0B" />;
      case 'Low':
        return <Ionicons name="flag" size={16} color="#10B981" />;
      default:
        return <Ionicons name="flag" size={16} color="#6B7280" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={16} color="#10B981" />;
      case 'in_progress':
        return <Ionicons name="time" size={16} color="#F59E0B" />;
      case 'todo':
        return <Ionicons name="ellipse-outline" size={16} color="#6B7280" />;
      case 'blocked':
        return <Ionicons name="ban" size={16} color="#EF4444" />;
      default:
        return <Ionicons name="ellipse-outline" size={16} color="#6B7280" />;
    }
  };

  const renderEmployeeAvatar = (user: any) => {
    if (user.profilePic) {
      return (
        <Image
          source={{ uri: user.profilePic }}
          style={styles.teamAvatar}
        />
      );
    }
    
    return (
      <View style={[styles.teamAvatar, styles.avatarPlaceholder]}>
        <Text style={styles.avatarText}>
          {getInitials(user.fullName || 'U')}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading project details...</Text>
      </View>
    );
  }

  // Debug logging
  console.log('Project state:', project);
  console.log('Loading state:', loading);
  console.log('Project ID from route:', projectId);

  if (!project) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#F59E0B" />
        <Text style={styles.errorTitle}>Project Not Found</Text>
        <Text style={styles.errorSubtitle}>Project ID: {projectId}</Text>
        <Text style={styles.errorSubtitle}>Loading: {loading.toString()}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Navigation */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#374151" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Project Overview</Text>
              <Text style={styles.headerSubtitle} numberOfLines={2}>{project?.name || 'Loading...'}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.createTaskButton}
              onPress={() => navigation.navigate('CreateTask', { projectId })}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createTaskButtonText}>Task</Text>
              </TouchableOpacity>
            
            <View style={styles.statusDropdown}>
              <Text style={styles.statusDropdownText}>{project?.status || 'Not Started'}</Text>
              <Ionicons name="chevron-down" size={16} color="#6B7280" />
            </View>
            
            <TouchableOpacity onPress={handleEditProject} style={styles.editButton}>
              <Ionicons name="create-outline" size={16} color="#374151" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleDeleteProject} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={16} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Key Metrics Cards */}
          <View style={styles.metricsContainer}>
            <View style={styles.metricCard}>
              <Ionicons name="bar-chart-outline" size={24} color="#3b82f6" />
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Total Tasks</Text>
                <Text style={styles.metricValue}>{taskStats.total}</Text>
                </View>
              </View>
              
            <View style={styles.metricCard}>
              <Ionicons name="bar-chart-outline" size={24} color="#10b981" />
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Completed</Text>
                <Text style={styles.metricValue}>{taskStats.completed}</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <Ionicons name="bar-chart-outline" size={24} color="#8b5cf6" />
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Completion Rate</Text>
                <Text style={styles.metricValue}>{taskStats.completionRate}%</Text>
              </View>
            </View>

            <View style={styles.metricCard}>
              <Ionicons name="people-outline" size={24} color="#f97316" />
              <View style={styles.metricContent}>
                <Text style={styles.metricLabel}>Team Members</Text>
                <Text style={styles.metricValue}>{taskStats.teamMembers}</Text>
              </View>
            </View>
          </View>

          {/* Task Status Breakdown */}
          <View style={styles.statusBreakdownContainer}>
            <Text style={styles.statusBreakdownTitle}>Task Status Breakdown</Text>
            <View style={styles.statusBreakdownCards}>
              <View style={[styles.statusCard, styles.statusCardTodo]}>
                <Text style={styles.statusCardLabel}>To Do</Text>
                <Text style={styles.statusCardValue}>{taskCountsByStatus.todo}</Text>
              </View>
              <View style={[styles.statusCard, styles.statusCardInProgress]}>
                <Text style={styles.statusCardLabel}>In Progress</Text>
                <Text style={styles.statusCardValue}>{taskCountsByStatus.in_progress}</Text>
              </View>
              <View style={[styles.statusCard, styles.statusCardInReview]}>
                <Text style={styles.statusCardLabel}>In Review</Text>
                <Text style={styles.statusCardValue}>{taskCountsByStatus.in_review}</Text>
              </View>
              <View style={[styles.statusCard, styles.statusCardCompleted]}>
                <Text style={styles.statusCardLabel}>Completed</Text>
                <Text style={styles.statusCardValue}>{taskCountsByStatus.completed}</Text>
              </View>
              <View style={[styles.statusCard, styles.statusCardBlocked]}>
                <Text style={styles.statusCardLabel}>Blocked</Text>
                <Text style={styles.statusCardValue}>{taskCountsByStatus.blocked}</Text>
              </View>
            </View>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' && styles.activeTab]}
              onPress={() => setActiveTab('details')}
            >
              <Ionicons name="information-circle-outline" size={16} color={activeTab === 'details' ? '#FF6B00' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
                Project Details
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
              onPress={() => setActiveTab('tasks')}
            >
              <Ionicons name="list-outline" size={16} color={activeTab === 'tasks' ? '#FF6B00' : '#6B7280'} />
              <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>
                Tasks ({safeTasks.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'details' ? (
            <View style={styles.detailsGrid}>
              {/* Top Row - Two Columns */}
              <View style={styles.topRow}>
                {/* Project Details Card (Left) */}
                <View style={styles.detailCard}>
                  {/* Priority and Status Badges */}
                  <View style={styles.badgesContainer}>
                    <View style={[styles.priorityBadge, { backgroundColor: project?.priority === 'High' ? '#FEE2E2' : project?.priority === 'Medium' ? '#FEF3C7' : '#D1FAE5' }]}>
                      <Text style={[styles.badgeText, { color: project?.priority === 'High' ? '#DC2626' : project?.priority === 'Medium' ? '#D97706' : '#059669' }]}>
                        {project?.priority || 'Medium'} Priority
                      </Text>
                  </View>
                    <View style={[styles.statusBadge, { backgroundColor: project?.status === 'In Progress' ? '#DBEAFE' : project?.status === 'Completed' ? '#D1FAE5' : '#F3F4F6' }]}>
                      <Text style={[styles.badgeText, { color: project?.status === 'In Progress' ? '#2563EB' : project?.status === 'Completed' ? '#059669' : '#6B7280' }]}>
                        {project?.status || 'Not Started'}
                      </Text>
                  </View>
                </View>

                  <Text style={styles.cardTitle}>{project?.name || 'Project'}</Text>
                  
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={20} color="#f97316" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>Start Date</Text>
                      <Text style={styles.detailValue}>{formatDate(project?.startDate)}</Text>
                  </View>
                </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={20} color="#f97316" />
                    <View style={styles.detailContent}>
                      <Text style={styles.detailLabel}>End Date</Text>
                      <Text style={styles.detailValue}>{formatDate(project?.endDate)}</Text>
                  </View>
                </View>

                  <View style={styles.descriptionSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.descriptionText}>{project?.description || 'No description provided'}</Text>
                </View>
              </View>

                {/* Project Team Card (Right) */}
                <View style={styles.teamCard}>
                  <Text style={styles.cardTitle}>Project Team</Text>

                  {/* Project Manager */}
                  {project?.projectManager && (
                    <View style={styles.teamMemberItem}>
                      <Text style={styles.teamSubtitle}>Project Manager</Text>
                      <View style={styles.teamMemberRow}>
                        {project.projectManager.profilePic ? (
                          <Image
                            source={{ uri: project.projectManager.profilePic }}
                            style={styles.teamAvatar}
                          />
                        ) : (
                          <View style={[styles.teamAvatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarText}>
                              {getInitials(project.projectManager.fullName)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.teamMemberInfo}>
                          <Text style={styles.teamMemberName}>{project.projectManager.fullName}</Text>
                          {project.projectManager.email && (
                            <Text style={styles.teamMemberEmail}>{project.projectManager.email}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Team Members */}
                  {project?.teamMembers && project.teamMembers.length > 0 && (
                    <View style={styles.teamMemberItem}>
                      <Text style={styles.teamSubtitle}>Team Members ({project.teamMembers.length})</Text>
                      {project.teamMembers.map((member) => (
                        <View key={member._id} style={styles.teamMemberRow}>
                          {member.profilePic ? (
                            <Image
                              source={{ uri: member.profilePic }}
                              style={styles.teamAvatar}
                            />
                          ) : (
                            <View style={[styles.teamAvatar, styles.avatarPlaceholder]}>
                              <Text style={styles.avatarText}>
                                {getInitials(member.fullName)}
                              </Text>
                    </View>
                          )}
                          <View style={styles.teamMemberInfo}>
                            <Text style={styles.teamMemberName}>{member.fullName}</Text>
                            {member.email && (
                              <Text style={styles.teamMemberEmail}>{member.email}</Text>
                  )}
                </View>
                    </View>
                      ))}
                  </View>
                  )}
                    </View>
                  </View>

              {/* Bottom Row - Two Columns */}
              <View style={styles.bottomRow}>
                {/* Project Sprints Card (Left) */}
                <View style={styles.sprintsCard}>
                  <Text style={styles.cardTitle}>
                    Project Sprints {(sprints?.length || 0) > 0 && `(${sprints.length})`}
                  </Text>
                  
                  {sprintLoading ? (
                    <ActivityIndicator size="small" color="#f97316" />
                  ) : (sprints?.length || 0) > 0 ? (
                    (sprints || []).map((sprint) => (
                      <View key={sprint._id} style={styles.sprintItem}>
                        <View style={styles.sprintInfo}>
                          <Text style={styles.sprintName}>{sprint.name}</Text>
                          <Text style={styles.sprintDates}>
                            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                      </Text>
                    </View>
                        <View style={[
                          styles.sprintStatusBadge,
                          { backgroundColor: sprint.completed ? '#10b981' : '#f97316' }
                        ]}>
                          <Text style={styles.sprintStatusText}>
                            {sprint.completed ? 'Completed' : 'Active'}
                          </Text>
                  </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noSprintsText}>No sprints found</Text>
                  )}
                </View>

                {/* Documents & Details Card (Right) */}
                <View style={styles.documentsCard}>
                  <Text style={styles.cardTitle}>Documents & Details</Text>
                  
                  {/* File Attachment */}
                  {project?.fileUrl && (
                    <View style={styles.documentItem}>
                      <View style={styles.documentInfo}>
                        <Ionicons name="document-text-outline" size={20} color="#f97316" />
                        <View style={styles.documentDetails}>
                          <Text style={styles.documentName}>Project Document</Text>
                          <Text style={styles.documentType}>File Attachment</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
                        <Ionicons name="download-outline" size={20} color="#f97316" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Created Date */}
                  <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Created</Text>
                    <Text style={styles.detailValue}>{formatDate(project?.createdAt)}</Text>
                    </View>
                    </View>
                      </View>
                    </View>
          ) : (
            /* Tasks Tab Content */
            <View style={styles.tasksContainer}>
              {/* Tasks Header */}
              <View style={styles.tasksHeader}>
                <View style={styles.tasksHeaderLeft}>
                  <Text style={styles.tasksTitle}>Project Tasks</Text>
                  <View style={styles.taskCountBadge}>
                    <Text style={styles.taskCountText}>{filteredTasks.length} tasks</Text>
                    </View>
                  </View>
                </View>

              {/* Search and View Controls */}
              <View style={styles.tasksControls}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search tasks..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
              </View>
                <View style={styles.viewControls}>
                  <TouchableOpacity
                    style={[styles.viewButton, viewMode === 'board' && styles.viewButtonActive]}
                    onPress={() => setViewMode('board')}
                  >
                    <Text style={[styles.viewButtonText, viewMode === 'board' && styles.viewButtonTextActive]}>
                      Board View
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
                    onPress={() => setViewMode('list')}
                  >
                    <Text style={[styles.viewButtonText, viewMode === 'list' && styles.viewButtonTextActive]}>
                      List View
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.createTaskButtonLarge}
                    onPress={() => navigation.navigate('CreateTask', { projectId })}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.createTaskButtonLargeText}>Create Task</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {taskLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF6B00" />
                </View>
              ) : viewMode === 'list' ? (
                /* List View */
                filteredTasks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No tasks found for this project</Text>
                </View>
              ) : (
                <View style={styles.tasksTable}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 2 }]}>Task</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>Assigned To</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Priority</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Status</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Due Date</Text>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Details</Text>
                  </View>

                  {/* Table Rows */}
                    {filteredTasks.map((task, index) => (
                      <View key={task._id} style={[styles.tableRow, index === filteredTasks.length - 1 && { borderBottomWidth: 0, marginBottom: 0 }]}>
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <Text style={styles.taskTitle} numberOfLines={1}>{task.title}</Text>
                        <Text style={styles.taskDescription} numberOfLines={1}>{task.description}</Text>
                      </View>

                      <View style={[styles.tableCell, { flex: 1.5 }]}>
                        {task.assignedTo && task.assignedTo.length > 0 ? (
                          <View style={styles.assigneeContainer}>
                            {task.assignedTo.slice(0, 3).map((user) => (
                              <View key={user._id} style={styles.assigneeAvatar}>
                                {renderEmployeeAvatar(user)}
                              </View>
                            ))}
                            {task.assignedTo.length > 3 && (
                              <View style={styles.moreAssignees}>
                                <Text style={styles.moreAssigneesText}>+{task.assignedTo.length - 3}</Text>
                              </View>
                            )}
                          </View>
                        ) : (
                          <Text style={styles.unassignedText}>Unassigned</Text>
                        )}
                      </View>

                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <View style={styles.priorityContainer}>
                          {getPriorityIcon(task.priority)}
                          <Text style={styles.priorityText}>{task.priority}</Text>
                        </View>
                      </View>

                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <View style={styles.statusContainer}>
                          {getStatusIcon(task.status)}
                          <Text style={styles.statusText}>{task.status}</Text>
                        </View>
                      </View>

                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <Text style={styles.dueDateText}>{formatDate(task.dueDate)}</Text>
                      </View>

                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <TouchableOpacity onPress={() => handleTaskClick(task._id)} style={styles.viewButton}>
                          <Text style={styles.viewButtonText}>View</Text>
                          <Ionicons name="chevron-forward" size={14} color="#FF6B00" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
                )
              ) : (
                /* Board View */
                <View style={styles.boardContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false} 
                    style={styles.boardScroll}
                    contentContainerStyle={{ paddingRight: 16 }}
                  >
                    {/* To Do Column */}
                    <View style={styles.boardColumn}>
                      <View style={styles.columnHeader}>
                        <Ionicons name="radio-button-off" size={16} color="#6B7280" />
                        <Text style={styles.columnTitle}>To Do</Text>
                        <Text style={styles.columnCount}>{taskCountsByStatus.todo}</Text>
                      </View>
                      <ScrollView 
                        style={styles.columnContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                      >
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'todo').map((task) => (
                          <TouchableOpacity
                            key={task._id}
                            style={styles.taskCard}
                            onPress={() => handleTaskClick(task._id)}
                          >
                            <Text style={styles.taskCardTitle} numberOfLines={2}>{task.title}</Text>
                            {task.description && (
                              <Text style={styles.taskCardDescription} numberOfLines={2}>
                                {task.description}
                              </Text>
                            )}
                            <View style={styles.taskCardFooter}>
                              <Text style={styles.taskCardDueDate}>
                                {formatDate(task.dueDate)}
                              </Text>
                              {getPriorityIcon(task.priority)}
                            </View>
                          </TouchableOpacity>
                        ))}
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'todo').length === 0 && (
                          <View style={styles.emptyColumn}>
                            <Text style={styles.emptyColumnText}>Drop tasks here</Text>
            </View>
          )}
                      </ScrollView>
                    </View>

                    {/* In Progress Column */}
                    <View style={styles.boardColumn}>
                      <View style={styles.columnHeader}>
                        <Ionicons name="radio-button-on" size={16} color="#F59E0B" />
                        <Text style={styles.columnTitle}>In Progress</Text>
                        <Text style={styles.columnCount}>{taskCountsByStatus.in_progress}</Text>
                      </View>
                      <ScrollView 
                        style={styles.columnContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                      >
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'in_progress' || normalizeStatus(t.status) === 'inprogress').map((task) => (
                          <TouchableOpacity
                            key={task._id}
                            style={styles.taskCard}
                            onPress={() => handleTaskClick(task._id)}
                          >
                            <Text style={styles.taskCardTitle} numberOfLines={2}>{task.title}</Text>
                            {task.description && (
                              <Text style={styles.taskCardDescription} numberOfLines={2}>
                                {task.description}
                              </Text>
                            )}
                            <View style={styles.taskCardFooter}>
                              <Text style={styles.taskCardDueDate}>
                                {formatDate(task.dueDate)}
                              </Text>
                              {getPriorityIcon(task.priority)}
                            </View>
                          </TouchableOpacity>
                        ))}
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'in_progress' || normalizeStatus(t.status) === 'inprogress').length === 0 && (
                          <View style={styles.emptyColumn}>
                            <Text style={styles.emptyColumnText}>Drop tasks here</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>

                    {/* In Review Column */}
                    <View style={styles.boardColumn}>
                      <View style={styles.columnHeader}>
                        <Ionicons name="radio-button-on" size={16} color="#3B82F6" />
                        <Text style={styles.columnTitle}>In Review</Text>
                        <Text style={styles.columnCount}>{taskCountsByStatus.in_review}</Text>
                      </View>
                      <ScrollView 
                        style={styles.columnContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                      >
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'in_review' || normalizeStatus(t.status) === 'inreview').map((task) => (
                          <TouchableOpacity
                            key={task._id}
                            style={styles.taskCard}
                            onPress={() => handleTaskClick(task._id)}
                          >
                            <Text style={styles.taskCardTitle} numberOfLines={2}>{task.title}</Text>
                            {task.description && (
                              <Text style={styles.taskCardDescription} numberOfLines={2}>
                                {task.description}
                              </Text>
                            )}
                            <View style={styles.taskCardFooter}>
                              <Text style={styles.taskCardDueDate}>
                                {formatDate(task.dueDate)}
                              </Text>
                              {getPriorityIcon(task.priority)}
                            </View>
                          </TouchableOpacity>
                        ))}
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'in_review' || normalizeStatus(t.status) === 'inreview').length === 0 && (
                          <View style={styles.emptyColumn}>
                            <Text style={styles.emptyColumnText}>Drop tasks here</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>

                    {/* Completed Column */}
                    <View style={styles.boardColumn}>
                      <View style={styles.columnHeader}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                        <Text style={styles.columnTitle}>Completed</Text>
                        <Text style={styles.columnCount}>{taskCountsByStatus.completed}</Text>
                      </View>
                      <ScrollView 
                        style={styles.columnContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                      >
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'completed').map((task) => (
                          <TouchableOpacity
                            key={task._id}
                            style={styles.taskCard}
                            onPress={() => handleTaskClick(task._id)}
                          >
                            <Text style={styles.taskCardTitle} numberOfLines={2}>{task.title}</Text>
                            {task.description && (
                              <Text style={styles.taskCardDescription} numberOfLines={2}>
                                {task.description}
                              </Text>
                            )}
                            <View style={styles.taskCardFooter}>
                              <Text style={styles.taskCardDueDate}>
                                {formatDate(task.dueDate)}
                              </Text>
                              {getPriorityIcon(task.priority)}
                            </View>
                          </TouchableOpacity>
                        ))}
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'completed').length === 0 && (
                          <View style={styles.emptyColumn}>
                            <Text style={styles.emptyColumnText}>Drop tasks here</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>

                    {/* Blocked Column */}
                    <View style={styles.boardColumn}>
                      <View style={styles.columnHeader}>
                        <Ionicons name="ban" size={16} color="#EF4444" />
                        <Text style={styles.columnTitle}>Blocked</Text>
                        <Text style={styles.columnCount}>{taskCountsByStatus.blocked}</Text>
                      </View>
                      <ScrollView 
                        style={styles.columnContent}
                        nestedScrollEnabled={true}
                        showsVerticalScrollIndicator={false}
                      >
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'blocked').map((task) => (
                          <TouchableOpacity
                            key={task._id}
                            style={styles.taskCard}
                            onPress={() => handleTaskClick(task._id)}
                          >
                            <Text style={styles.taskCardTitle} numberOfLines={2}>{task.title}</Text>
                            {task.description && (
                              <Text style={styles.taskCardDescription} numberOfLines={2}>
                                {task.description}
                              </Text>
                            )}
                            <View style={styles.taskCardFooter}>
                              <Text style={styles.taskCardDueDate}>
                                {formatDate(task.dueDate)}
                              </Text>
                              {getPriorityIcon(task.priority)}
                            </View>
                          </TouchableOpacity>
                        ))}
                        {filteredTasks.filter(t => normalizeStatus(t.status) === 'blocked').length === 0 && (
                          <View style={styles.emptyColumn}>
                            <Text style={styles.emptyColumnText}>Drop tasks here</Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createTaskButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  createTaskButtonLargeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 6,
  },
  statusDropdownText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 8,
  },
  content: {
    padding: 16,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: width * 0.42,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBreakdownContainer: {
    marginBottom: 24,
  },
  statusBreakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  statusBreakdownCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusCard: {
    flex: 1,
    minWidth: width * 0.18,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusCardTodo: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusCardInProgress: {
    backgroundColor: '#FEF3C7',
  },
  statusCardInReview: {
    backgroundColor: '#DBEAFE',
  },
  statusCardCompleted: {
    backgroundColor: '#D1FAE5',
  },
  statusCardBlocked: {
    backgroundColor: '#FEE2E2',
  },
  statusCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  statusCardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  taskCountBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  tasksControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    minWidth: 200,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  viewControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  viewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 100,
  },
  viewButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#f97316',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  viewButtonTextActive: {
    color: '#f97316',
    fontWeight: '600',
  },
  boardContainer: {
    marginTop: 8,
    minHeight: 500,
    width: '100%',
  },
  boardScroll: {
    flexGrow: 0,
  },
  boardColumn: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    minHeight: 450,
    flexShrink: 0,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  columnCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  columnContent: {
    flex: 1,
    minHeight: 350,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  taskCardDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  taskCardDueDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyColumn: {
    padding: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyColumnText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  projectHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
  },
  projectInfo: {
    flex: 1,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  projectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  readMoreText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 24,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FF6B00',
  },
  detailsGrid: {
    gap: 16,
  },
  topRow: {
    flexDirection: width < 768 ? 'column' : 'row',
    gap: 16,
  },
  bottomRow: {
    flexDirection: width < 768 ? 'column' : 'row',
    gap: 16,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    minHeight: 300,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  teamCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    minHeight: 300,
  },
  sprintsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    minHeight: 200,
  },
  documentsCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    minHeight: 200,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  descriptionSection: {
    marginTop: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 4,
  },
  teamSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 8,
  },
  teamMemberItem: {
    marginBottom: 16,
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  teamAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  teamMemberInfo: {
    flex: 1,
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  teamMemberEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  sprintItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  sprintInfo: {
    flex: 1,
  },
  sprintName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  sprintDates: {
    fontSize: 12,
    color: '#6b7280',
  },
  sprintStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sprintStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  noSprintsText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 16,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#6b7280',
  },
  downloadButton: {
    padding: 8,
  },
  tasksContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
  tasksTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'flex-start',
    marginBottom: 8,
    minHeight: 70,
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    lineHeight: 20,
  },
  taskDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 0,
    lineHeight: 16,
  },
  assigneeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -4,
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  moreAssignees: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  moreAssigneesText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
  },
  unassignedText: {
    fontSize: 12,
    color: '#6B7280',
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dueDateText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  priorityText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  avatarPlaceholder: {
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
