import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  BackHandler,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../Services/NavigationService';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatTimeForDisplay } from '../utills/utills';

const { width } = Dimensions.get('window');

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
}

interface User {
  _id: string;
  name: string;
  email?: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  projectManager?: string;
}

interface Comment {
  _id: string;
  text: string;
  createdAt: string;
  createdBy: User;
  attachment?: string;
}

interface ChecklistItem {
  _id: string;
  item: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: Employee;
}

interface Sprint {
  _id: string;
  name: string;
  color?: string;
}

interface TaskDetail {
  _id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  progress?: number; // 0-100, only for in_progress tasks
  assignedTo: Employee[];
  assignedBy: User;
  organizationId: string;
  projectId: Project;
  labels: string[];
  dependencies: string[]; // Array of task IDs
  followers: Employee[];
  comments: Comment[];
  attachments?: string; // URL string
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  sprintId?: Sprint[];
  isBug: boolean;
  expectedResult?: string;
  actualResult?: string;
  link?: string;
  remarks?: Array<{
    text: string;
    createdBy: User;
    createdAt: string;
  }>;
}

export default function TaskDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { taskId } = route.params as { taskId: string };
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { callApi } = useAxios();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isProjectManager, setIsProjectManager] = useState(false);
  const [progressInput, setProgressInput] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  // Handle back navigation - ensure we go back to TaskList, not Home
  const handleGoBack = useCallback(() => {
    try {
      console.log('🔍 [TaskDetailScreen] handleGoBack called');
      console.log('🔍 [TaskDetailScreen] navigation.canGoBack():', navigation.canGoBack());
      
      // Check if we can go back
      if (navigation.canGoBack()) {
        console.log('🔍 [TaskDetailScreen] Can go back, calling navigation.goBack()');
        navigation.goBack();
      } else {
        console.log('🔍 [TaskDetailScreen] Cannot go back, navigating to TaskList explicitly');
        // If we can't go back, navigate to TaskList explicitly
        // Try to navigate to TasksTab -> TaskList
        const parent = navigation.getParent();
        if (parent) {
          console.log('🔍 [TaskDetailScreen] Using parent navigator');
          parent.navigate('TasksTab', {
            screen: 'TaskList'
          });
        } else {
          console.log('🔍 [TaskDetailScreen] Using CommonActions');
          // Fallback: use CommonActions to navigate to TaskList
          navigation.dispatch(
            CommonActions.navigate({
              name: 'TasksTab',
              params: {
                screen: 'TaskList'
              }
            })
          );
        }
      }
    } catch (error) {
      console.error('🔍 [TaskDetailScreen] Navigation error:', error);
      // Final fallback: try to navigate to TaskList directly
      try {
        console.log('🔍 [TaskDetailScreen] Trying direct navigation to TaskList');
        navigation.navigate('TaskList' as never);
      } catch (e) {
        console.error('🔍 [TaskDetailScreen] Direct navigation failed:', e);
        // If all else fails, try to reset to TaskList
        try {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'TasksTab',
                  params: {
                    screen: 'TaskList'
                  }
                }
              ]
            })
          );
        } catch (resetError) {
          console.error('🔍 [TaskDetailScreen] Reset navigation failed:', resetError);
        }
      }
    }
  }, [navigation]);

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleGoBack();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [handleGoBack]);

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: `/task/${taskId}`,
      });

      if (response?.success && response?.task) {
        const taskData = response.task;
        setTask(taskData);
        
        // Check if current user is following
        const userEmployeeId = (currentUser as any)?.employee?._id || currentUser?._id;
        const isUserFollowing = taskData.followers?.some(
          (f: Employee) => f._id === userEmployeeId
        ) || false;
        setIsFollowing(isUserFollowing);

        // Check if current user is project manager
        const projectManagerId = taskData.projectId?.projectManager;
        if (projectManagerId === userEmployeeId) {
          setIsProjectManager(true);
        }

        // Set progress input
        if (taskData.progress !== undefined && taskData.progress !== null) {
          setProgressInput(String(taskData.progress));
        } else {
          setProgressInput('0');
        }
      } else {
        Alert.alert('Error', 'Failed to load task details');
        handleGoBack();
      }
    } catch (error: any) {
      console.error('Error fetching task details:', error);
      Alert.alert('Error', 'Failed to load task details');
      handleGoBack();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await callApi({
                method: 'DELETE',
                url: `/task/${taskId}`,
              });
              if (response?.success) {
                Alert.alert('Success', 'Task deleted successfully');
                handleGoBack();
              } else {
                Alert.alert('Error', 'Failed to delete task');
              }
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleFollow = async () => {
    try {
      const endpoint = isFollowing ? `/task/${taskId}/unfollow` : `/task/${taskId}/follow`;
      const response = await callApi({
        method: 'POST',
        url: endpoint,
      });
      if (response?.success) {
        setIsFollowing(!isFollowing);
        Alert.alert('Success', isFollowing ? 'Unfollowed task' : 'Following task');
        fetchTaskDetails(); // Refresh to get updated followers list
      } else {
        Alert.alert('Error', 'Failed to update follow status');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await callApi({
        method: 'POST',
        url: `/task/${taskId}/comments`,
        data: { text: commentText.trim() },
      });
      if (response?.success) {
        Alert.alert('Success', 'Comment added successfully');
        setCommentText('');
        fetchTaskDetails(); // Refresh to get new comment
      } else {
        Alert.alert('Error', 'Failed to add comment');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateProgress = async () => {
    const progress = Number(progressInput);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      Alert.alert('Error', 'Progress must be a number between 0 and 100');
      return;
    }

    try {
      setUpdatingProgress(true);
      const response = await callApi({
        method: 'PATCH',
        url: `/task/${taskId}/progress`,
        data: { progress },
      });
      if (response?.success) {
        Alert.alert('Success', 'Progress updated');
        fetchTaskDetails(); // Refresh to show updated progress
      } else {
        Alert.alert('Error', 'Failed to update progress');
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update progress');
    } finally {
      setUpdatingProgress(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getInitials = (firstName?: string, lastName?: string, name?: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
    }
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const canEditOrDelete = () => {
    if (!task || !currentUser) return false;
    const isQA = (currentUser as any)?.role === 'QA';
    const isBug = task.isBug;
    
    // QA can edit/delete bugs, Project Managers can edit/delete any task
    return (isQA && isBug) || isProjectManager;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading task details...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Task not found</Text>
        </View>
      </View>
    );
  }

  const showEditDelete = canEditOrDelete();
  const showProgress = task.status === 'in_progress';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Overview</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followButtonActive]}
            onPress={handleFollow}
          >
            <Ionicons name={isFollowing ? 'eye' : 'eye-outline'} size={18} color={isFollowing ? '#fff' : '#f97316'} />
            <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
              Follow
            </Text>
          </TouchableOpacity>
          {showEditDelete && (
            <>
              <TouchableOpacity
                style={[styles.editButton]}
                onPress={() => (navigation as any).navigate('EditTask', { taskId: task._id })}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.deleteButton]} onPress={handleDelete}>
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Task Card */}
        <View style={styles.mainCard}>
          <View style={styles.badgeRow}>
            <PriorityBadge priority={task.priority} variant="outlined" />
            <StatusBadge status={getStatusLabel(task.status)} size="small" />
          </View>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.descriptionLabel}>Description:</Text>
          <Text style={styles.descriptionText}>{task.description || 'No description provided'}</Text>
        </View>

        {/* Layout - Single column on mobile, two columns on tablet */}
        <View style={styles.twoColumnContainer}>
          {/* Left Column */}
          <View style={[styles.leftColumn, width < 768 && styles.fullWidthColumn]}>
            {/* Task Progress Card */}
            {showProgress && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Task Progress</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${task.progress || 0}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentage}>{task.progress || 0}%</Text>
                </View>
                <View style={styles.progressInputContainer}>
                  <TextInput
                    style={styles.progressInput}
                    value={progressInput}
                    onChangeText={setProgressInput}
                    keyboardType="numeric"
                    placeholder="0-100"
                    placeholderTextColor="#9ca3af"
                  />
                  <View style={styles.progressArrows}>
                    <TouchableOpacity
                      onPress={() => {
                        const val = Math.max(0, Number(progressInput) - 1);
                        setProgressInput(String(val));
                      }}
                    >
                      <Ionicons name="chevron-up" size={16} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const val = Math.min(100, Number(progressInput) + 1);
                        setProgressInput(String(val));
                      }}
                    >
                      <Ionicons name="chevron-down" size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.progressHint}>Enter 0-100</Text>
                <TouchableOpacity
                  style={styles.updateProgressButton}
                  onPress={handleUpdateProgress}
                  disabled={updatingProgress || !progressInput.trim()}
                >
                  {updatingProgress ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.updateProgressButtonText}>Update Progress</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Task Details Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Task Details</Text>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#f97316" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Start Date</Text>
                  <Text style={styles.detailValue}>{formatDate(task.startDate)}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#f97316" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Due Date</Text>
                  <Text style={styles.detailValue}>{formatDate(task.dueDate)}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Estimated Hours</Text>
                  <Text style={styles.detailValue}>{task.estimatedHours || 0}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color="#3b82f6" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Actual Hours</Text>
                  <Text style={styles.detailValue}>{task.actualHours || 0}</Text>
                </View>
              </View>

              {/* Task Progress Section */}
              <View style={styles.progressSection}>
                <Text style={styles.progressSectionTitle}>Task Progress</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${task.progress || 0}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressPercentage}>{task.progress || 0}%</Text>
                </View>
                <View style={styles.progressInputContainer}>
                  <TextInput
                    style={styles.progressInput}
                    value={progressInput}
                    onChangeText={setProgressInput}
                    keyboardType="numeric"
                    placeholder="0-100"
                    placeholderTextColor="#9ca3af"
                  />
                  <View style={styles.progressArrows}>
                    <TouchableOpacity
                      onPress={() => {
                        const val = Math.max(0, Number(progressInput || 0) - 1);
                        setProgressInput(String(val));
                      }}
                      style={styles.arrowButton}
                    >
                      <Ionicons name="chevron-up" size={16} color="#6b7280" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const val = Math.min(100, Number(progressInput || 0) + 1);
                        setProgressInput(String(val));
                      }}
                      style={styles.arrowButton}
                    >
                      <Ionicons name="chevron-down" size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.progressHint}>Enter 0-100</Text>
                <TouchableOpacity
                  style={[
                    styles.updateProgressButton,
                    (updatingProgress || !progressInput.trim()) && styles.updateProgressButtonDisabled
                  ]}
                  onPress={handleUpdateProgress}
                  disabled={updatingProgress || !progressInput.trim()}
                >
                  {updatingProgress ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.updateProgressButtonText}>Update Progress</Text>
                  )}
                </TouchableOpacity>
              </View>

              {task.labels && task.labels.length > 0 && (
                <View style={styles.detailRow}>
                  <Ionicons name="pricetag-outline" size={20} color="#8b5cf6" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Labels</Text>
                    <View style={styles.labelsContainer}>
                      {task.labels.map((label, idx) => (
                        <View key={idx} style={styles.labelTag}>
                          <Text style={styles.labelText}>{label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Sprints Card */}
            {task.sprintId && task.sprintId.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Sprints ({task.sprintId.length})</Text>
                {task.sprintId.map((sprint) => (
                  <TouchableOpacity 
                    key={sprint._id} 
                    style={styles.sprintCard}
                    onPress={() => {
                      (navigation as any).navigate('SprintDetail', { sprintId: sprint._id });
                    }}
                  >
                    <Text style={styles.sprintName}>{sprint.name}</Text>
                    <View style={styles.sprintViewRow}>
                      <View style={[styles.sprintDot, sprint.color && { backgroundColor: sprint.color }]} />
                      <Text style={styles.sprintViewText}>View Sprint {'>'}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Comments Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Comments ({task.comments?.length || 0})</Text>
              <View style={styles.commentInputContainer}>
                {currentUser && (
                  <View style={styles.commentAvatarContainer}>
                    {currentUser.profilePic ? (
                      <Image
                        source={{ uri: currentUser.profilePic }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarInitials}>
                          {getInitials(undefined, undefined, currentUser.name)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  placeholderTextColor="#9ca3af"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
              </View>
              {task.comments && task.comments.length > 0 ? (
                <View style={styles.commentsList}>
                  {task.comments.map((comment) => {
                    const createdBy = comment.createdBy as any;
                    const avatarUri = createdBy?.profileImage || (currentUser as any)?.profilePic;
                    const name = createdBy?.name || 'Unknown';

                    return (
                      <View key={comment._id} style={styles.commentItem}>
                        {avatarUri ? (
                          <Image source={{ uri: avatarUri }} style={styles.commentUserAvatar} />
                        ) : (
                          <View style={[styles.commentUserAvatar, styles.avatarPlaceholder]}>
                            <Text style={styles.avatarInitials}>{getInitials(undefined, undefined, name)}</Text>
                          </View>
                        )}
                        <View style={styles.commentContent}>
                          <Text style={styles.commentUser}>{name}</Text>
                          <Text style={styles.commentText}>{comment.text}</Text>
                          <Text style={styles.commentTime}>{formatDateTime(comment.createdAt)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text style={styles.noCommentsText}>No comments yet</Text>
              )}
              <TouchableOpacity
                style={[styles.commentButton, (!commentText.trim() || submittingComment) && styles.commentButtonDisabled]}
                onPress={handleAddComment}
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.commentButtonText}>Comment</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Right Column */}
          <View style={[styles.rightColumn, width < 768 && styles.fullWidthColumn]}>
            {/* Assignment Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Assignment</Text>
              
              <Text style={styles.assignmentLabel}>Assigned To:</Text>
              {task.assignedTo && task.assignedTo.length > 0 ? (
                task.assignedTo.map((user) => {
                  if (!user || typeof user !== 'object') return null;
                  const avatarUri = user.profileImage;
                  const firstName = user.firstName || '';
                  const lastName = user.lastName || '';
                  const email = user.email || '';

                  return (
                    <View key={user._id} style={styles.assignmentRow}>
                      {avatarUri ? (
                        <Image source={{ uri: avatarUri }} style={styles.assignmentAvatar} />
                      ) : (
                        <View style={[styles.assignmentAvatar, styles.avatarPlaceholder]}>
                          <Text style={styles.avatarInitials}>{getInitials(firstName, lastName)}</Text>
                        </View>
                      )}
                      <View style={styles.assignmentInfo}>
                        <Text style={styles.assignmentName}>
                          {firstName} {lastName}
                        </Text>
                        {!!email && <Text style={styles.assignmentEmail}>{email}</Text>}
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.noAssignment}>Unassigned</Text>
              )}

              <Text style={[styles.assignmentLabel, styles.assignmentLabelMargin]}>Assigned By:</Text>
              {task.assignedBy ? (
                <View style={styles.assignmentRow}>
                  {(task.assignedBy as any).profileImage ? (
                    <Image
                      source={{ uri: (task.assignedBy as any).profileImage }}
                      style={styles.assignmentAvatar}
                    />
                  ) : (
                    <View style={[styles.assignmentAvatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitials}>
                        {getInitials(undefined, undefined, task.assignedBy.name)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.assignmentInfo}>
                    <Text style={styles.assignmentName}>{task.assignedBy.name}</Text>
                    {!!(task.assignedBy as any).email && (
                      <Text style={styles.assignmentEmail}>{(task.assignedBy as any).email}</Text>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={styles.noAssignment}>Unknown</Text>
              )}

              <Text style={[styles.assignmentLabel, styles.assignmentLabelMargin]}>Project:</Text>
              <TouchableOpacity 
                style={styles.projectRow}
                onPress={() => {
                  console.log('🔍 [TaskDetailScreen] Project row clicked');
                  console.log('🔍 [TaskDetailScreen] Task projectId:', task.projectId);
                  const projectId = task.projectId._id;
                  console.log('🔍 [TaskDetailScreen] Project ID:', projectId);
                  console.log('🔍 [TaskDetailScreen] navigationRef.isReady():', navigationRef.isReady());
                  console.log('🔍 [TaskDetailScreen] navigationRef.current:', navigationRef.current);
                  if (navigationRef.current) {
                    console.log('🔍 [TaskDetailScreen] Current route name:', navigationRef.current.getCurrentRoute()?.name);
                    console.log('🔍 [TaskDetailScreen] Navigation state:', JSON.stringify(navigationRef.current.getState(), null, 2));
                  }
                  
                  // Use navigationRef to navigate to ProjectDetail
                  if (navigationRef.isReady()) {
                    console.log('🔍 [TaskDetailScreen] Attempting navigation to ProjectDetail');
                    
                    try {
                      // Navigate directly to ProjectDetail in drawer (works for both Employee and PM)
                      navigationRef.navigate('ProjectDetail' as never, { projectId } as never);
                      console.log('🔍 [TaskDetailScreen] Navigation call completed');
                    } catch (error) {
                      console.error('🔍 [TaskDetailScreen] Navigation error:', error);
                      // Fallback: try navigating through MainTabs for PM users
                      try {
                        navigationRef.navigate('MainTabs' as never, {
                          screen: 'ProjectsTab',
                          params: {
                            screen: 'ProjectDetail',
                            params: { projectId }
                          }
                        } as never);
                        console.log('🔍 [TaskDetailScreen] Fallback navigation completed');
                      } catch (fallbackError) {
                        console.error('🔍 [TaskDetailScreen] Fallback navigation error:', fallbackError);
                      }
                    }
                  } else {
                    console.warn('🔍 [TaskDetailScreen] Navigation skipped - navigationRef not ready');
                  }
                }}
              >
                <Ionicons name="folder-outline" size={20} color="#f97316" />
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName}>{task.projectId.name}</Text>
                  {task.projectId.description && (
                    <Text style={styles.projectDescription} numberOfLines={2}>
                      {task.projectId.description.replace(/<[^>]*>/g, '')}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Followers Card */}
            {task.followers && task.followers.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Followers ({task.followers.length})</Text>
                {task.followers.map((follower) => (
                  <View key={follower._id} style={styles.assignmentRow}>
                    {follower.profileImage ? (
                      <Image source={{ uri: follower.profileImage }} style={styles.assignmentAvatar} />
                    ) : (
                      <View style={[styles.assignmentAvatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarInitials}>
                          {getInitials(follower.firstName, follower.lastName)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.assignmentName}>
                        {follower.firstName} {follower.lastName}
                      </Text>
                      {!!follower.email && <Text style={styles.assignmentEmail}>{follower.email}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Dependencies Card */}
            {task.dependencies && task.dependencies.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Dependencies ({task.dependencies.length})</Text>
                {task.dependencies.map((depId, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.dependencyRow}
                    onPress={() => {
                      (navigation as any).navigate('TaskDetails', { taskId: depId });
                    }}
                  >
                    <Ionicons name="link-outline" size={16} color="#3b82f6" />
                    <Text style={styles.dependencyText}>{depId}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Checklist Card */}
            {task.checklist && task.checklist.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Checklist ({task.checklist.length})</Text>
                {task.checklist.map((item) => (
                  <View key={item._id} style={styles.checklistItem}>
                    <Ionicons
                      name={item.completed ? 'checkbox' : 'checkbox-outline'}
                      size={20}
                      color={item.completed ? '#10b981' : '#6b7280'}
                    />
                    <Text style={[styles.checklistText, item.completed && styles.checklistTextCompleted]}>
                      {item.item}
                    </Text>
                    {item.completed && item.completedBy && (
                      <Text style={styles.checklistCompletedBy}>
                        by {item.completedBy.firstName} {item.completedBy.lastName}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Attachments Card */}
            {task.attachments && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Attachments</Text>
                <TouchableOpacity
                  style={styles.attachmentRow}
                  onPress={() => {
                    if (task.attachments) {
                      Linking.openURL(task.attachments);
                    }
                  }}
                >
                  <Ionicons name="document-attach-outline" size={20} color="#3b82f6" />
                  <Text style={styles.attachmentText}>Download Attachment</Text>
                  <Ionicons name="download-outline" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            )}

            {/* Link Card */}
            {task.link && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Link</Text>
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => {
                    if (task.link) {
                      Linking.openURL(task.link);
                    }
                  }}
                >
                  <Ionicons name="link-outline" size={20} color="#3b82f6" />
                  <Text style={styles.linkText} numberOfLines={1}>{task.link}</Text>
                  <Ionicons name="open-outline" size={20} color="#3b82f6" />
                </TouchableOpacity>
              </View>
            )}

            {/* Timeline Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Timeline</Text>
              <View style={styles.timelineRow}>
                <Text style={styles.timelineLabel}>Created:</Text>
                <Text style={styles.timelineValue}>{formatDateTime(task.createdAt)}</Text>
              </View>
              <View style={styles.timelineRow}>
                <Text style={styles.timelineLabel}>Last Updated:</Text>
                <Text style={styles.timelineValue}>{formatDateTime(task.updatedAt)}</Text>
              </View>
              {task.completedAt && (
                <View style={styles.timelineRow}>
                  <Text style={styles.timelineLabel}>Completed:</Text>
                  <Text style={styles.timelineValue}>{formatDateTime(task.completedAt)}</Text>
                </View>
              )}
            </View>
          </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginLeft: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f97316',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
  },
  followButtonActive: {
    backgroundColor: '#f97316',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f97316',
  },
  followButtonTextActive: {
    color: '#fff',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f97316',
    borderWidth: 1,
    borderColor: '#f97316',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  scrollView: {
    flex: 1,
  },
  mainCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  twoColumnContainer: {
    flexDirection: width < 768 ? 'column' : 'row',
    paddingHorizontal: 16,
    gap: 16,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
  fullWidthColumn: {
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#f97316',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
  },
  progressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  progressInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#111827',
  },
  progressArrows: {
    flexDirection: 'column',
    gap: 2,
  },
  progressHint: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  updateProgressButton: {
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  updateProgressButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  updateProgressButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  progressSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  arrowButton: {
    padding: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  labelsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  labelTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  sprintCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    marginBottom: 8,
  },
  sprintName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  sprintViewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sprintDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  sprintViewText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  commentInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  commentAvatarContainer: {
    width: 40,
    height: 40,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  commentsList: {
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  commentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  noCommentsText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  commentButton: {
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  commentButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  commentButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  assignmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  assignmentLabelMargin: {
    marginTop: 16,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  assignmentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  assignmentInfo: {
    flex: 1,
  },
  assignmentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  assignmentEmail: {
    fontSize: 12,
    color: '#6b7280',
  },
  noAssignment: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  dependencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    marginBottom: 8,
  },
  dependencyText: {
    flex: 1,
    fontSize: 12,
    color: '#3b82f6',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checklistText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  checklistCompletedBy: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  attachmentText: {
    flex: 1,
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timelineLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});
