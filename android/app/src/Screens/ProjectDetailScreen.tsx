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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';

const { width } = Dimensions.get('window');

// Define types for project data
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
    profilePic?: string;
  };
  teamMembers: Array<{
    _id: string;
    fullName: string;
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
  const [loading, setLoading] = useState<boolean>(true);
  const [taskLoading, setTaskLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'details' | 'tasks'>('details');
  const [expanded, setExpanded] = useState(false);

  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const projectId = route.params?.projectId;

  const toggleExpanded = () => setExpanded(!expanded);

  const handleEditProject = () => {
    // Navigate to edit project screen
    navigation.navigate('EditProject', { projectId });
  };

  const handleTaskClick = (taskId: string) => {
    // Navigate to task details screen
    navigation.navigate('TaskDetails', { taskId });
  };

  const handleDownload = async () => {
    if (!project?.fileUrl) {
      Alert.alert('Error', 'No file available for download');
      return;
    }

    try {
      // For React Native, we'll open the file URL directly
      if (project.fileUrl.startsWith('http')) {
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
        setTasks(response.data?.tasks || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        Alert.alert('Error', 'Failed to load tasks');
      } finally {
        setTaskLoading(false);
      }
    };

    if (projectId) {
      fetchProjectDetails();
      fetchTasks();
    }
  }, [projectId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

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
          style={styles.avatar}
          defaultSource={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
        />
      );
    }
    
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
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

  const isLong = project.description?.length > 200;
  const displayText = expanded ? project.description : project.description?.slice(0, 200);

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
              <Text style={styles.headerSubtitle} numberOfLines={2}>{project.name}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            {project.status === 'In Progress' && (
              <TouchableOpacity onPress={handleMarkCompleted} style={styles.markCompleteButton}>
                <Text style={styles.markCompleteButtonText}>Mark Completed</Text>
              </TouchableOpacity>
            )}
            
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
          {/* Project Header */}
          <View style={styles.projectHeader}>
            <View style={styles.projectInfo}>
              <View style={styles.projectMeta}>
                <Text style={styles.priorityText}>{project.priority} Priority</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
                    {project.status}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.projectTitle}>{project.name}</Text>
              
              <Text style={styles.projectDescription}>
                {displayText}
                {isLong && !expanded && '... '}
                {isLong && (
                  <TouchableOpacity onPress={toggleExpanded}>
                    <Text style={styles.readMoreText}>
                      {expanded ? 'Show less' : 'Read more'}
                    </Text>
                  </TouchableOpacity>
                )}
              </Text>
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
                Tasks ({tasks.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'details' ? (
            <>
              {/* Stats Cards */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <View style={styles.statIconContainer}>
                    <Ionicons name="cash-outline" size={24} color="#FF6B00" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Total Budget</Text>
                    <Text style={styles.statValue}>{formatCurrency(project.budget)}</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#10B98120' }]}>
                    <Ionicons name="cash-outline" size={24} color="#10B981" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Amount Spent</Text>
                    <Text style={styles.statValue}>{formatCurrency(project.spent)}</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#3B82F620' }]}>
                    <Ionicons name="people-outline" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Team Members</Text>
                    <Text style={styles.statValue}>{project.teamMembers.length + 1}</Text>
                  </View>
                </View>

                <View style={styles.statCard}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF620' }]}>
                    <Ionicons name="trending-up-outline" size={24} color="#8B5CF6" />
                  </View>
                  <View style={styles.statInfo}>
                    <Text style={styles.statLabel}>Budget Utilization</Text>
                    <Text style={styles.statValue}>
                      {Math.round((project.spent / project.budget) * 100)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Bottom Section */}
              <View style={styles.bottomSection}>
                {/* Team Section */}
                <View style={styles.teamSection}>
                  <Text style={styles.sectionTitle}>Project Team</Text>

                  {/* Project Manager */}
                  {project.projectManager && (
                    <View style={styles.pmSection}>
                      <Text style={styles.sectionSubtitle}>Project Manager</Text>
                      <View style={styles.pmCard}>
                        {renderEmployeeAvatar(project.projectManager)}
                        <Text style={styles.pmName}>{project.projectManager.fullName}</Text>
                      </View>
                    </View>
                  )}

                  {/* Team Members */}
                  {project.teamMembers && project.teamMembers.length > 0 && (
                    <View style={styles.membersSection}>
                      <Text style={styles.sectionSubtitle}>Team Members</Text>
                      {project.teamMembers.map((member) => (
                        <View key={member._id} style={styles.memberCard}>
                          {renderEmployeeAvatar(member)}
                          <Text style={styles.memberName}>{member.fullName}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Client Info */}
                <View style={styles.clientSection}>
                  <Text style={styles.sectionTitle}>Client Information</Text>
                  
                  <View style={styles.infoCard}>
                    <Ionicons name="business-outline" size={16} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Company</Text>
                      <Text style={styles.infoValue}>{project.client}</Text>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <Ionicons name="call-outline" size={16} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Contact</Text>
                      <Text style={styles.infoValue}>{project.clientContact}</Text>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <Ionicons name="mail-outline" size={16} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{project.clientEmail}</Text>
                    </View>
                  </View>

                  <View style={styles.infoCard}>
                    <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Timeline</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(project.startDate)} - {formatDate(project.endDate)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Project Files & Details */}
                <View style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Documents & Details</Text>

                  {/* File */}
                  {project.fileUrl && (
                    <View style={styles.fileCard}>
                      <View style={styles.fileInfo}>
                        <View style={styles.fileIconContainer}>
                          <Ionicons name="document-text-outline" size={20} color="#FF6B00" />
                        </View>
                        <View style={styles.fileDetails}>
                          <Text style={styles.fileName}>Project Document</Text>
                          <Text style={styles.fileType}>File Attachment</Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
                        <Ionicons name="download-outline" size={16} color="#FF6B00" />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Project Details */}
                  <View style={styles.detailsList}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Created</Text>
                      <Text style={styles.detailValue}>{formatDate(project.createdAt)}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Last Updated</Text>
                      <Text style={styles.detailValue}>{formatDate(project.updatedAt)}</Text>
                    </View>

                    {project.status === 'Completed' && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Completed on</Text>
                        <Text style={styles.detailValue}>{formatDate(project.completeDate || '')}</Text>
                      </View>
                    )}

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Priority</Text>
                      <Text style={styles.detailValue}>{project.priority}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Status</Text>
                      <Text style={styles.detailValue}>{project.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* Tasks Tab Content */
            <View style={styles.tasksContainer}>
              {taskLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF6B00" />
                </View>
              ) : tasks.length === 0 ? (
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
                  {tasks.map((task) => (
                    <View key={task._id} style={styles.tableRow}>
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
    gap: 12,
  },
  markCompleteButton: {
    backgroundColor: '#FF6B00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markCompleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: width * 0.4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  bottomSection: {
    gap: 24,
  },
  teamSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  pmSection: {
    marginBottom: 20,
  },
  pmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    gap: 12,
  },
  pmName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  membersSection: {
    gap: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 12,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  clientSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    gap: 12,
    marginBottom: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  detailsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fileIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  fileType: {
    fontSize: 12,
    color: '#6B7280',
  },
  downloadButton: {
    padding: 8,
  },
  detailsList: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
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
    gap: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableCell: {
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
    gap: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#6B7280',
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
