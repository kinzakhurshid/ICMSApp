// TaskScreen.tsx
import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  ListRenderItem,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { PieChart } from 'react-native-chart-kit';
import Svg, { Circle } from 'react-native-svg';
import AppHeader from '../components/AppHeader';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';
import PriorityBadge from '../components/PriorityBadge';
import StatusBadge from '../components/StatusBadge';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../Services/NavigationService';

const { width } = Dimensions.get('window');

// Define types for your data
type StatItem = {
  id: string;
  label: string;
  value: number;
  color: string;
};
type BoardColumn = {
  id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
  color: string;
}
type PieDataItem = {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
};

type TaskDetail = {
  _id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'blocked';
  dueDate: string;
  projectId: {
    _id: string;
    name: string;
  };
  assignedTo: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string;
  }>;
  startDate: string;
};

type StatsData = {
  total?: number;
  completed?: number;
  highPriority?: number;
  overdue?: number;
  completionRate?: number;
  priority?: {
    high?: number;
    medium?: number;
    low?: number;
  };
  status?: {
    todo?: number;
    in_progress?: number;
    in_review?: number;
    blocked?: number;
  };
};

// Define props for Donut component
interface DonutProps {
  size?: number;
  stroke?: number;
  progress?: number;
  track?: string;
  fill?: string;
  label?: string;
}

function Donut({ 
  size = 110, 
  stroke = 12, 
  progress = 0.58, 
  track = '#f0f0f0', 
  fill = '#41d16a', 
  label = '58%' 
}: DonutProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={fill}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="round"
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
          fill="none"
        />
      </Svg>
      <Text style={{ fontSize: 18, fontWeight: '700', color: '#2B2B2B' }}>{label}</Text>
    </View>
  );
}

// Define props for LegendDot component
interface LegendDotProps {
  color: string;
  label: string;
}

function LegendDot({ color, label }: LegendDotProps) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

export default function TaskScreen({ navigation }: { navigation: any }) {
  const [activeTab, setActiveTab] = useState('Active');
  const [viewMode, setViewMode] = useState('board'); // Default to board view as per design
  const [stats, setStats] = useState<StatsData>({});
  const [loading, setLoading] = useState(true);
  // Match web default: show all time initially
  const [timeFilter, setTimeFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [allTasks, setAllTasks] = useState<TaskDetail[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  });
  
  // Add state for year dropdown
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Date navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedMonth, setSelectedMonth] = useState('Month');
  
  // Backlog/Notes section state
  const [backlogTab, setBacklogTab] = useState('Backlog');
  const [selectedSprint, setSelectedSprint] = useState('All Active Sprints');
  const [sprintType, setSprintType] = useState('Normal Sprints');
  const [showSprintDropdown, setShowSprintDropdown] = useState(false);
  
  // Bugs state
  const [bugs, setBugs] = useState<TaskDetail[]>([]);
  const [bugsLoading, setBugsLoading] = useState(false);
  const [bugsActiveTab, setBugsActiveTab] = useState('Active');
  const [bugsSearchQuery, setBugsSearchQuery] = useState('');
  const [bugsSelectedStatus, setBugsSelectedStatus] = useState('All Statuses');
  const [bugsSelectedMonth, setBugsSelectedMonth] = useState('Month');
  
  // Generate year options (current year and previous 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  }, []);

  const { currentUser } = useSelector((state: RootState) => state.user);
  const { callApi } = useAxios();

  const renderBoardView = () => {
    console.log('Board view - allTasks:', allTasks.length, allTasks.map(t => ({ title: t.title, status: t.status })));
    console.log('Board view - activeTab:', activeTab);
    
    const boardColumns: BoardColumn[] = [
      { id: '1', title: 'To Do', status: 'todo', color: '#ffb020' },
      { id: '2', title: 'In Progress', status: 'in_progress', color: '#4cb3ff' },
      { id: '3', title: 'In Review', status: 'in_review', color: '#9b59b6' },
      { id: '4', title: 'Completed', status: 'completed', color: '#41d16a' },
      { id: '5', title: 'Blocked', status: 'blocked', color: '#ff4d4f' },
    ];

    const getTasksForColumn = (status: string) => {
      const tasks = allTasks.filter(task => task.status === status);
      console.log(`Board - ${status} tasks:`, tasks.length, tasks.map(t => t.title));
      return tasks;
    };

    const handleTaskPress = (task: TaskDetail) => {
      // Navigate to task details screen
      navigation.navigate('TaskDetail' as never, { taskId: task._id } as never);
    };

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.boardContainer}
        contentContainerStyle={styles.boardContent}
      >
        {boardColumns.map(column => (
          <View key={column.id} style={styles.column}>
            <View style={[styles.columnHeader, { backgroundColor: column.color + '20' }]}>
              <Text style={[styles.columnTitle, { color: column.color }]}>
                {column.title}
              </Text>
              <Text style={[styles.columnCount, { color: column.color }]}>
                {getTasksForColumn(column.status).length}
              </Text>
            </View>
            
            <ScrollView style={styles.columnContent}>
              {getTasksForColumn(column.status).map(task => (
                <TouchableOpacity 
                  key={task._id} 
                  style={styles.taskCard}
                  onPress={() => handleTaskPress(task)}
                >
                  <View style={styles.taskCardTop}>
                    <Text style={styles.taskTitle} numberOfLines={2}>
                      {task.title}
                    </Text>
                    <TouchableOpacity style={styles.taskMenuButton}>
                      <Ionicons name="ellipsis-vertical" size={16} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.taskCardBody}>
                    <View style={styles.taskAssigneeRow}>
                      <Ionicons name="person-outline" size={14} color="#6b7280" />
                      {task.assignedTo && task.assignedTo.length > 0 ? (
                        <View style={styles.assigneeContainer}>
                          {task.assignedTo.slice(0, 1).map((user) => (
                            <View key={user._id} style={styles.assigneeAvatarSmall}>
                              {user.profileImage ? (
                                <Image
                                  source={{ uri: user.profileImage }}
                                  style={styles.assigneeAvatarImage}
                                />
                              ) : (
                                <Text style={styles.assigneeInitials}>
                                  {getInitials(user.firstName, user.lastName)}
                      </Text>
                              )}
                    </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noAssigneeText}>Unassigned</Text>
                      )}
                  </View>
                  
                    <View style={styles.taskDateRow}>
                      <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                      <Text style={styles.dueDateText}>
                        {formatDateShort(task.dueDate)}
                  </Text>
                    </View>
                    
                    <View style={styles.taskPriorityRow}>
                      <Ionicons name="flag-outline" size={14} color="#f59e0b" />
                      <Text style={styles.priorityText}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </Text>
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.taskProjectRow}
                      onPress={(e) => {
                        e.stopPropagation();
                        console.log('🔍 [TasksScreen Board] Project name clicked');
                        const projectId = typeof task.projectId === 'object' ? task.projectId?._id : task.projectId;
                        console.log('🔍 [TasksScreen Board] Project ID:', projectId);
                        console.log('🔍 [TasksScreen Board] Project ID type:', typeof projectId);
                        console.log('🔍 [TasksScreen Board] navigationRef.isReady():', navigationRef.isReady());
                        console.log('🔍 [TasksScreen Board] navigationRef.current:', navigationRef.current);
                        if (navigationRef.current) {
                          console.log('🔍 [TasksScreen Board] Current route name:', navigationRef.current.getCurrentRoute()?.name);
                          console.log('🔍 [TasksScreen Board] Navigation state:', JSON.stringify(navigationRef.current.getState(), null, 2));
                        }
                        
                        if (projectId && navigationRef.isReady()) {
                          console.log('🔍 [TasksScreen Board] Attempting navigation to ProjectDetail');
                          
                          try {
                            // Navigate directly to ProjectDetail in drawer (works for both Employee and PM)
                            navigationRef.navigate('ProjectDetail' as never, { projectId } as never);
                            console.log('🔍 [TasksScreen Board] Navigation call completed');
                          } catch (error) {
                            console.error('🔍 [TasksScreen Board] Navigation error:', error);
                            // Fallback: try navigating through MainTabs for PM users
                            try {
                              navigationRef.navigate('MainTabs' as never, {
                                screen: 'ProjectsTab',
                                params: {
                                  screen: 'ProjectDetail',
                                  params: { projectId }
                                }
                              } as never);
                              console.log('🔍 [TasksScreen Board] Fallback navigation completed');
                            } catch (fallbackError) {
                              console.error('🔍 [TasksScreen Board] Fallback navigation error:', fallbackError);
                            }
                          }
                        } else {
                          console.warn('🔍 [TasksScreen Board] Navigation skipped - projectId:', projectId, 'isReady:', navigationRef.isReady());
                        }
                      }}
                      disabled={!task.projectId || (typeof task.projectId === 'object' && !task.projectId._id)}
                    >
                      <View style={styles.projectDot} />
                      <Text style={[styles.projectName, (typeof task.projectId === 'object' ? task.projectId?._id : task.projectId) && styles.projectLink]} numberOfLines={1}>
                        {typeof task.projectId === 'object' ? task.projectId?.name : 'No Project'}
                            </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
              
              {getTasksForColumn(column.status).length === 0 && (
                <View style={styles.emptyColumn}>
                  <Text style={styles.emptyColumnText}>No tasks</Text>
                </View>
              )}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    );
  };

  // Time filter options
  const timeFilterOptions = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
    { label: 'All Time', value: 'all' },
  ];

  // Function to get date params for /task/getAll based on time filter
  // Web contract:
  // - timePeriod: 'all'  -> no startDate/endDate
  // - timePeriod: 'custom' + startDate/endDate (ISO) for other ranges
  const getListDateParams = () => {
    if (timeFilter === 'all') {
      return {
        timePeriod: 'all',
      };
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    switch (timeFilter) {
      case 'today': {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      }
      case 'week': {
        const current = new Date(now); // avoid mutating now
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
        startDate = new Date(current.getFullYear(), current.getMonth(), diff);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59, 999);
        break;
      }
      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      }
      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      }
      default: {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      }
    }
    
    return {
      timePeriod: 'custom',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      if (!currentUser?.organization) return;

      const dateParams = getListDateParams();

      const params = {
        organizationId: currentUser.organization,
        // Active/Completed tab mapping, as on web PM/tasks
        status: activeTab === 'Active' ? 'active' : 'completed',
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit,
        isBug: 'false', // This screen shows normal tasks; align with web isBug flag
        ...dateParams,
      };

      console.log('API Request Params:', JSON.stringify(params, null, 2));

      const response = await callApi({
        method: 'GET',
        url: '/task/getAll',
        params
      });

      console.log('API Response:', JSON.stringify(response, null, 2));

      // Web contract: { success, data: { tasks, pagination } }
      const success = (response as any)?.success;
      const dataWrapper = (response as any)?.data;
      const tasksArray: TaskDetail[] = Array.isArray(dataWrapper?.tasks) ? dataWrapper.tasks : [];
      const paginationData = dataWrapper?.pagination || {};

      console.log('Tasks Data:', tasksArray);
      console.log('Tasks Count:', tasksArray.length);

      if (success) {
        setAllTasks(tasksArray);
        setPagination({
          page: paginationData.page || 1,
          limit: paginationData.limit || 10,
          total: paginationData.total || 0,
        });
      } else {
        Alert.alert('Error', 'Failed to fetch tasks');
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      Alert.alert('Error', 'Failed to fetch tasks');
    }
  };

  // Filter tasks based on active tab
  const filteredTasks = useMemo(() => {
    if (activeTab === 'Completed') {
      return allTasks.filter(task => task.status === 'completed');
    } else {
      return allTasks.filter(task => task.status !== 'completed');
    }
  }, [allTasks, activeTab]);

  // Fetch bugs
  const fetchBugs = async () => {
    try {
      if (!currentUser?.organization) return;

      setBugsLoading(true);
      const dateParams = getListDateParams();

      const params = {
        organizationId: currentUser.organization,
        status: bugsActiveTab === 'Active' ? 'active' : 'completed',
        search: bugsSearchQuery,
        page: 1,
        limit: 100,
        isBug: 'true', // Fetch bugs
        ...dateParams,
      };

      const response = await callApi({
        method: 'GET',
        url: '/task/getAll',
        params
      });

      const success = (response as any)?.success;
      const dataWrapper = (response as any)?.data;
      const bugsArray: TaskDetail[] = Array.isArray(dataWrapper?.tasks) ? dataWrapper.tasks : [];

      if (success) {
        setBugs(bugsArray);
      }
    } catch (err) {
      console.error('Failed to fetch bugs:', err);
    } finally {
      setBugsLoading(false);
    }
  };

  // Filter bugs based on active tab
  const filteredBugs = useMemo(() => {
    let filtered = bugs;
    
    if (bugsActiveTab === 'Completed') {
      filtered = filtered.filter(bug => bug.status === 'completed');
    } else {
      filtered = filtered.filter(bug => bug.status !== 'completed');
    }
    
    if (bugsSelectedStatus !== 'All Statuses') {
      filtered = filtered.filter(bug => bug.status === bugsSelectedStatus.toLowerCase().replace(' ', '_'));
    }
    
    if (bugsSearchQuery) {
      filtered = filtered.filter(bug => 
        bug.title?.toLowerCase().includes(bugsSearchQuery.toLowerCase()) ||
        (typeof bug.projectId === 'object' ? bug.projectId?.name : '').toLowerCase().includes(bugsSearchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [bugs, bugsActiveTab, bugsSelectedStatus, bugsSearchQuery]);

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('Fetching stats with time filter:', timeFilter);
        
        const response = await callApi({
          method: "GET",
          url: `/task/stats`,
          params: {
            organizationId: currentUser?.organization,
            timePeriod: timeFilter
          }
        });
        
        console.log('Stats API Response:', response);
        console.log('Stats Data:', response?.data);
        
        if (response?.success) {
          setStats(response.data);
        } else {
          Alert.alert('Error', 'Failed to fetch task statistics');
        }
      } catch (err) {
        console.error('Error fetching task stats', err);
        Alert.alert('Error', 'Failed to fetch task statistics');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.organization) {
      fetchStats();
      fetchTasks();
      fetchBugs();
    }
  }, [currentUser?.organization, timeFilter, refreshTrigger, searchQuery, pagination.page, activeTab, bugsActiveTab, bugsSearchQuery]);

  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    setShowDropdown(false);
    setLoading(true);
    setPagination({...pagination, page: 1});
  };

  // Prepare dynamic stats data
  const dynamicStats: StatItem[] = [
    { id: '1', label: 'Total', value: stats?.total || 0, color: '#ff6b00' },
    { id: '2', label: 'Completed', value: stats?.completed || 0, color: '#41d16a' },
    { id: '3', label: 'High Priority', value: stats?.highPriority || 0, color: '#ffb020' },
    { id: '4', label: 'Overdue', value: stats?.overdue || 0, color: '#ff4d4f' },
  ];

  // Prepare dynamic pie data
  const dynamicPieData: PieDataItem[] = [
    {
      name: 'High',
      population: stats?.priority?.high || 0,
      color: '#ff4d4f',
      legendFontColor: '#8E8E93',
      legendFontSize: 12,
    },
    {
      name: 'Medium',
      population: stats?.priority?.medium || 0,
      color: '#ffb020',
      legendFontColor: '#8E8E93',
      legendFontSize: 12,
    },
    {
      name: 'Low',
      population: stats?.priority?.low || 0,
      color: '#fbd6a2',
      legendFontColor: '#8E8E93',
      legendFontSize: 12,
    },
  ];

  // Calculate completion percentage
  const completionPercentage = stats?.completionRate || 0;
  // If completionRate is already a decimal (0.33), use it directly; if it's a percentage (33), divide by 100
  const actualPercentage = completionPercentage > 1 ? completionPercentage / 100 : completionPercentage;
  const completionLabel = `${Math.round(actualPercentage * 100)}%`;

  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: '#fff',
      backgroundGradientTo: '#fff',
      color: () => '#2b2b2b',
      labelColor: () => '#8E8E93',
      decimalPlaces: 0,
    }),
    []
  );

  const renderStatItem: ListRenderItem<StatItem> = ({ item }) => (
    <View style={[styles.statBox, { backgroundColor: item.color + '20' }]}>
      <Text style={[styles.statNumber, { color: item.color }]}>{item.value}</Text>
      <Text style={styles.statLabel}>{item.label}</Text>
    </View>
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return '#ff4d4f';
      case 'medium':
        return '#ffb020';
      case 'low':
        return '#41d16a';
      default:
        return '#666';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return '#4cb3ff';
      case 'completed':
        return '#41d16a';
      case 'blocked':
        return '#ff4d4f';
      case 'in_review':
        return '#9b59b6';
      case 'todo':
      default:
        return '#ffb020';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatDateShort = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getCurrentMonthYear = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getInitials = (firstName?: string, lastName?: string, fullName?: string) => {
    if (fullName) {
      return fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    return '??';
  };

  const renderTaskItem: ListRenderItem<TaskDetail> = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.tableRow}
      onPress={() => navigation.navigate('TaskDetail' as never, { taskId: item._id } as never)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkboxColumn, { width: 50 }]}>
        <View style={styles.checkbox} />
      </View>
      <Text style={[styles.tableCell, { width: 50 }]}>{index + 1}</Text>
      <Text style={[styles.tableCell, { width: 140 }]} numberOfLines={1}>
        {item.projectId?.name || 'N/A'}
      </Text>
      <Text style={[styles.tableCell, { width: 200, fontWeight: '500' }]} numberOfLines={1}>
        {item.title}
      </Text>
      <View style={[styles.assignedColumn, { width: 120 }]}>
        {item.assignedTo && item.assignedTo.length > 0 ? (
          <View style={styles.avatarContainer}>
            {item.assignedTo.slice(0, 1).map((member) => (
              <View key={member._id} style={styles.avatar}>
                {member.profileImage ? (
                  <Image source={{ uri: member.profileImage }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>
                    {getInitials(member.firstName, member.lastName)}
      </Text>
                )}
    </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noAssignee}>Unassigned</Text>
        )}
      </View>
      <Text style={[styles.tableCell, { width: 110 }]}>{formatDateShort(item.startDate)}</Text>
      <Text style={[styles.tableCell, { width: 110 }]}>{formatDateShort(item.dueDate)}</Text>
      <View style={[styles.priorityColumn, { width: 90 }]}>
        <PriorityBadge priority={item.priority} variant="outlined" />
      </View>
      <View style={[styles.statusColumn, { width: 100 }]}>
        <StatusBadge status={item.status} size="small" />
      </View>
      <View style={[styles.actionsColumn, { width: 100 }]}>
        <TouchableOpacity style={styles.statusActionButton}>
          <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
          <Text style={styles.statusActionText}>Status</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setPagination({...pagination, page: 1});
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPagination({...pagination, page: 1});
  };

  const handleLoadMore = () => {
    if (allTasks.length < pagination.total && pagination.page * pagination.limit < pagination.total) {
      setPagination({...pagination, page: pagination.page + 1});
    }
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
    setPagination({...pagination, page: 1});
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Loading task statistics...</Text>
      </View>
    );
  }

  // Calculate KPI stats for board view
  const kpiStats = {
    totalTasks: stats?.total || 0,
    completedTasks: stats?.completed || 0,
    openTasks: (stats?.total || 0) - (stats?.completed || 0),
    completionRate: stats?.completionRate || 0,
    atRisk: (stats?.overdue || 0) + (stats?.highPriority || 0),
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Task Management Title */}
        <View style={styles.taskManagementHeader}>
          <Text style={styles.taskManagementTitle}>Task Management</Text>
        </View>
        
        {/* KPI Cards Section - Only show in board view */}
        {viewMode === 'board' && (
          <View style={styles.kpiCardsContainer}>
            <View style={styles.kpiCard}>
              <View style={styles.kpiIconContainer}>
                <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
              </View>
              <View style={styles.kpiContent}>
                <Text style={styles.kpiTitle}>Total Tasks</Text>
                <Text style={styles.kpiDescription}>In the selected time range</Text>
                <Text style={styles.kpiValue}>{kpiStats.totalTasks}</Text>
                <Text style={styles.kpiBreakdown}>
                  {kpiStats.openTasks} open • {kpiStats.completedTasks} completed
                </Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconContainer, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              </View>
              <View style={styles.kpiContent}>
                <Text style={styles.kpiTitle}>Completion Rate</Text>
                <Text style={styles.kpiDescription}>Share of tasks that are finished</Text>
                <Text style={styles.kpiValue}>{kpiStats.completionRate.toFixed(1)}%</Text>
                <Text style={styles.kpiBreakdown}>
                  {kpiStats.completedTasks} of {kpiStats.totalTasks} completed
              </Text>
              </View>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIconContainer, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="alert-triangle" size={24} color="#EF4444" />
              </View>
              <View style={styles.kpiContent}>
                <Text style={styles.kpiTitle}>At Risk</Text>
                <Text style={styles.kpiDescription}>Overdue and high-priority items</Text>
                <Text style={styles.kpiValue}>{kpiStats.atRisk}</Text>
                <Text style={styles.kpiBreakdown}>
                  Overdue • {stats?.highPriority || 0} high priority
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>Tasks</Text>
          
          {/* Tabs */}
          <View style={styles.tabsRow}>
              <TouchableOpacity 
              style={[styles.tab, activeTab === 'Active' && styles.tabActive]} 
              onPress={() => handleTabChange('Active')}
              >
              <Text style={[styles.tabText, activeTab === 'Active' && styles.tabTextActive]}>Active</Text>
            </TouchableOpacity>
                    <TouchableOpacity
              style={[styles.tab, activeTab === 'Completed' && styles.tabActive]} 
              onPress={() => handleTabChange('Completed')}
            >
              <Text style={[styles.tabText, activeTab === 'Completed' && styles.tabTextActive]}>Completed</Text>
                    </TouchableOpacity>
                </View>

          {/* Filters Row */}
          <View style={styles.filtersRow}>
            {/* Date Navigation */}
            <View style={styles.dateNavigation}>
            <TouchableOpacity 
                style={styles.dateNavButton}
                onPress={() => navigateMonth('prev')}
              >
                <Ionicons name="chevron-back" size={20} color="#111827" />
            </TouchableOpacity>
              <Text style={styles.dateText}>{getCurrentMonthYear()}</Text>
              <TouchableOpacity 
                style={styles.dateNavButton}
                onPress={() => navigateMonth('next')}
              >
                <Ionicons name="chevron-forward" size={20} color="#111827" />
                    </TouchableOpacity>
                </View>

            {/* Status Filter - Only in list view */}
            {viewMode === 'list' && (
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>{selectedStatus}</Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput 
                placeholder="Search tasks" 
                placeholderTextColor="#9CA3AF" 
                style={styles.searchInput} 
                value={searchQuery}
                onChangeText={handleSearch}
          />
        </View>

            {/* Month Dropdown - Only in list view */}
            {viewMode === 'list' && (
              <TouchableOpacity style={styles.monthDropdown}>
                <Text style={styles.filterDropdownText}>{selectedMonth}</Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
            )}

            {/* Export Button - Only in list view */}
            {viewMode === 'list' && (
              <TouchableOpacity style={styles.exportButton}>
                <Ionicons name="download-outline" size={18} color="#10b981" />
                <Text style={styles.exportButtonText}>Export All</Text>
              </TouchableOpacity>
            )}
                </View>
              </View>

        {/* Backlog/Notes Section - Only show in board view */}
        {viewMode === 'board' && (
        <View style={styles.backlogSection}>
          <View style={styles.backlogHeader}>
            <View style={styles.backlogTabs}>
              <TouchableOpacity 
                style={[styles.backlogTab, backlogTab === 'Backlog' && styles.backlogTabActive]} 
                onPress={() => setBacklogTab('Backlog')}
              >
                <Text style={[styles.backlogTabText, backlogTab === 'Backlog' && styles.backlogTabTextActive]}>
                  Backlog
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.backlogTab, backlogTab === 'Notes' && styles.backlogTabActive]} 
                onPress={() => setBacklogTab('Notes')}
              >
                <Text style={[styles.backlogTabText, backlogTab === 'Notes' && styles.backlogTabTextActive]}>
                  Notes
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.backlogHeaderRight}>
              <TouchableOpacity 
                style={styles.sprintDropdown}
                onPress={() => setShowSprintDropdown(!showSprintDropdown)}
              >
                <Text style={styles.sprintDropdownText} numberOfLines={1}>{selectedSprint}</Text>
                <Ionicons name={showSprintDropdown ? "chevron-up" : "chevron-down"} size={14} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.normalSprintsButton}
                onPress={() => {}}
              >
                <Text style={styles.normalSprintsButtonText} numberOfLines={1}>{sprintType}</Text>
              </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.createTaskButtonBoard}
                  onPress={() => navigation.navigate('CreateTask')}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.createTaskButtonBoardText}>Create Task</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Sprint Dropdown Modal */}
          <Modal
            visible={showSprintDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowSprintDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowSprintDropdown(false)}
            >
              <View style={styles.sprintDropdownModal}>
                <TouchableOpacity
                  style={styles.sprintDropdownItem}
                  onPress={() => {
                    setSelectedSprint('All Active Sprints');
                    setShowSprintDropdown(false);
                  }}
                >
                  <Text style={styles.sprintDropdownItemText}>All Active Sprints</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sprintDropdownItem}
                  onPress={() => {
                    setSelectedSprint('Completed Sprints');
                    setShowSprintDropdown(false);
                  }}
                >
                  <Text style={styles.sprintDropdownItemText}>Completed Sprints</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.sprintDropdownItem}
                  onPress={() => {
                    setSelectedSprint('All Sprints');
                    setShowSprintDropdown(false);
                  }}
                >
                  <Text style={styles.sprintDropdownItemText}>All Sprints</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
          
          {backlogTab === 'Backlog' && (
            <>
              <View style={styles.searchBarContainer}>
                <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchBarIcon} />
          <TextInput 
                  placeholder="Search tasks..." 
                  placeholderTextColor="#9CA3AF" 
                  style={styles.searchBarInput} 
            value={searchQuery}
            onChangeText={handleSearch}
          />
              </View>
              <View style={styles.backlogBoardContainer}>
                {renderBoardView()}
              </View>
            </>
          )}
          
          {backlogTab === 'Notes' && (
            <View style={styles.notesContent}>
              <TouchableOpacity style={styles.addNoteCard}>
                <Ionicons name="add" size={32} color="#6b7280" />
          </TouchableOpacity>
              <View style={styles.notesListArea}>
                <Text style={styles.emptyNotesText}>No notes yet. Click the + button to add a note.</Text>
              </View>
            </View>
          )}
        </View>
        )}

        {/* Tasks Table Section - Show after backlog in board view */}
        {viewMode === 'board' && (
          <View style={styles.tasksTableSection}>
            <Text style={styles.sectionTitle}>Tasks</Text>
            <View style={styles.tableWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                style={styles.tableScrollContainer}
                contentContainerStyle={styles.tableScrollContent}
              >
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <View style={[styles.checkboxColumn, { width: 50 }]}>
                      <View style={styles.checkboxHeader} />
                    </View>
                    <Text style={[styles.tableHeaderCell, { width: 60, marginRight: 8 }]}>NO#</Text>
                    <Text style={[styles.tableHeaderCell, { width: 160, marginRight: 8 }]}>PROJECT</Text>
                    <Text style={[styles.tableHeaderCell, { width: 240, marginRight: 8 }]}>TITLE</Text>
                    <Text style={[styles.tableHeaderCell, { width: 150, marginRight: 8 }]}>ASSIGNEE</Text>
                    <Text style={[styles.tableHeaderCell, { width: 130, marginRight: 8 }]}>START</Text>
                    <Text style={[styles.tableHeaderCell, { width: 130, marginRight: 8 }]}>DUE</Text>
                    <Text style={[styles.tableHeaderCell, { width: 110, marginRight: 8 }]}>PRIORITY</Text>
                    <Text style={[styles.tableHeaderCell, { width: 120, marginRight: 8 }]}>STATUS</Text>
                    <Text style={[styles.tableHeaderCell, { width: 120, marginRight: 8 }]}>ACTIONS</Text>
                  </View>
                  {filteredTasks.length > 0 ? (
                    filteredTasks.slice(0, 10).map((item, index) => (
                      <TouchableOpacity 
                        key={item._id}
                        style={styles.tableRow}
                        onPress={() => navigation.navigate('TaskDetail' as never, { taskId: item._id } as never)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkboxColumn, { width: 50 }]}>
                          <View style={styles.checkbox} />
                        </View>
                        <Text style={[styles.tableCell, { width: 60, marginRight: 8 }]}>{index + 1}</Text>
                        <TouchableOpacity 
                          style={{ width: 160, marginRight: 8, justifyContent: 'center' }}
                          onPress={(e) => {
                            e.stopPropagation();
                            const projectId = typeof item.projectId === 'object' ? item.projectId?._id : item.projectId;
                            if (projectId && navigationRef.isReady()) {
                              navigationRef.navigate('ProjectDetail' as never, { projectId } as never);
                            }
                          }}
                        >
                          <Text style={[
                            styles.tableCell, 
                            (typeof item.projectId === 'object' ? item.projectId?._id : item.projectId) && styles.projectLink
                          ]} numberOfLines={1}>
                            {typeof item.projectId === 'object' ? item.projectId?.name : 'N/A'}
                          </Text>
                        </TouchableOpacity>
                        <Text style={[styles.tableCell, { width: 240, fontWeight: '500', marginRight: 8 }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={[styles.assignedColumn, { width: 150, marginRight: 8 }]}>
                          {item.assignedTo && item.assignedTo.length > 0 ? (
                            <View style={styles.avatarContainer}>
                              {item.assignedTo.slice(0, 1).map((member) => (
                                <View key={member._id} style={styles.avatar}>
                                  {member.profileImage ? (
                                    <Image source={{ uri: member.profileImage }} style={styles.avatarImage} />
                                  ) : (
                                    <Text style={styles.avatarText}>
                                      {getInitials(member.firstName, member.lastName)}
                                    </Text>
                                  )}
                                </View>
                              ))}
                            </View>
                          ) : (
                            <Text style={styles.noAssignee}>Unassigned</Text>
                          )}
                        </View>
                        <Text style={[styles.tableCell, { width: 130, marginRight: 8 }]}>{formatDateShort(item.startDate)}</Text>
                        <Text style={[styles.tableCell, { width: 130, marginRight: 8 }]}>{formatDateShort(item.dueDate)}</Text>
                        <View style={[styles.priorityColumn, { width: 110, marginRight: 8 }]}>
                          <PriorityBadge 
                            priority={item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} 
                            variant="outlined" 
                          />
                        </View>
                        <View style={[styles.statusColumn, { width: 100 }]}>
                          <StatusBadge 
                            status={item.status.replace('_', ' ')} 
                            size="small" 
                          />
                        </View>
                        <View style={[styles.actionsColumn, { width: 100 }]}>
                          <TouchableOpacity style={styles.statusActionButton}>
                            <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                            <Text style={styles.statusActionText}>Status</Text>
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No tasks available</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Bugs Table Section */}
        <View style={styles.bugsTableSection}>
          <Text style={styles.sectionTitle}>Bugs</Text>
          
          {/* Bugs Tabs and Filters */}
          <View style={styles.bugsHeader}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, bugsActiveTab === 'Active' && styles.activeTab]}
                onPress={() => setBugsActiveTab('Active')}
              >
                <Text style={[styles.tabText, bugsActiveTab === 'Active' && styles.activeTabText]}>Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, bugsActiveTab === 'Completed' && styles.activeTab]}
                onPress={() => setBugsActiveTab('Completed')}
              >
                <Text style={[styles.tabText, bugsActiveTab === 'Completed' && styles.activeTabText]}>Completed</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.bugsFilters}>
              <View style={styles.dateNavigation}>
                <TouchableOpacity onPress={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setCurrentDate(newDate);
                }}>
                  <Ionicons name="chevron-back" size={20} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.dateText}>
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => {
                  const newDate = new Date(currentDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setCurrentDate(newDate);
                }}>
                  <Ionicons name="chevron-forward" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>{bugsSelectedStatus}</Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
              
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search bugs"
                  value={bugsSearchQuery}
                  onChangeText={setBugsSearchQuery}
                  placeholderTextColor="#9ca3af"
                />
              </View>
              
              <TouchableOpacity style={styles.filterDropdown}>
                <Text style={styles.filterDropdownText}>{bugsSelectedMonth}</Text>
                <Ionicons name="chevron-down" size={16} color="#6b7280" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.exportButton}>
                <Text style={styles.exportButtonText}>Export All</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Bugs Table */}
          <View style={styles.tableWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={true}
              style={styles.tableScrollContainer}
              contentContainerStyle={styles.tableScrollContent}
            >
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: 60, marginRight: 8 }]}>NO#</Text>
                  <Text style={[styles.tableHeaderCell, { width: 160, marginRight: 8 }]}>PROJECT</Text>
                  <Text style={[styles.tableHeaderCell, { width: 240, marginRight: 8 }]}>TITLE</Text>
                  <Text style={[styles.tableHeaderCell, { width: 130, marginRight: 8 }]}>START</Text>
                  <Text style={[styles.tableHeaderCell, { width: 130, marginRight: 8 }]}>DUE</Text>
                  <Text style={[styles.tableHeaderCell, { width: 110, marginRight: 8 }]}>PRIORITY</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120, marginRight: 8 }]}>STATUS</Text>
                  <Text style={[styles.tableHeaderCell, { width: 150, marginRight: 8 }]}>ACTUAL RESULT</Text>
                  <Text style={[styles.tableHeaderCell, { width: 150, marginRight: 8 }]}>EXPECTED RESULT</Text>
                  <Text style={[styles.tableHeaderCell, { width: 100, marginRight: 8 }]}>LINK</Text>
                  <Text style={[styles.tableHeaderCell, { width: 100, marginRight: 8 }]}>PICTURE</Text>
                  <Text style={[styles.tableHeaderCell, { width: 120, marginRight: 8 }]}>ACTIONS</Text>
                </View>
                {bugsLoading ? (
                  <View style={styles.emptyState}>
                    <ActivityIndicator size="small" color="#3b82f6" />
                  </View>
                ) : filteredBugs.length > 0 ? (
                  filteredBugs.map((item, index) => (
                    <TouchableOpacity 
                      key={item._id}
                      style={styles.tableRow}
                      onPress={() => navigation.navigate('TaskDetail' as never, { taskId: item._id } as never)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tableCell, { width: 60, marginRight: 8 }]}>{index + 1}</Text>
                      <TouchableOpacity 
                        style={{ width: 160, marginRight: 8, justifyContent: 'center' }}
                        onPress={(e) => {
                          e.stopPropagation();
                          const projectId = typeof item.projectId === 'object' ? item.projectId?._id : item.projectId;
                          if (projectId && navigationRef.isReady()) {
                            navigationRef.navigate('ProjectDetail' as never, { projectId } as never);
                          }
                        }}
                      >
                        <Text style={[
                          styles.tableCell, 
                          (typeof item.projectId === 'object' ? item.projectId?._id : item.projectId) && styles.projectLink
                        ]} numberOfLines={1}>
                          {typeof item.projectId === 'object' ? item.projectId?.name : 'N/A'}
                        </Text>
                      </TouchableOpacity>
                      <Text style={[styles.tableCell, { width: 240, fontWeight: '500', marginRight: 8 }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[styles.tableCell, { width: 130, marginRight: 8 }]}>{formatDateShort(item.startDate)}</Text>
                      <Text style={[styles.tableCell, { width: 130, marginRight: 8 }]}>{formatDateShort(item.dueDate)}</Text>
                      <View style={[styles.priorityColumn, { width: 110, marginRight: 8 }]}>
                        <PriorityBadge 
                          priority={item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} 
                          variant="outlined" 
                        />
                      </View>
                      <View style={[styles.statusColumn, { width: 100 }]}>
                        <StatusBadge 
                          status={item.status.replace('_', ' ')} 
                          size="small" 
                        />
                      </View>
                      <Text style={[styles.tableCell, { width: 150, marginRight: 8, color: '#6b7280' }]}>-</Text>
                      <Text style={[styles.tableCell, { width: 150, marginRight: 8, color: '#6b7280' }]}>-</Text>
                      <Text style={[styles.tableCell, { width: 100, marginRight: 8, color: '#6b7280' }]}>-</Text>
                      <Text style={[styles.tableCell, { width: 100, marginRight: 8, color: '#6b7280' }]}>-</Text>
                      <View style={[styles.actionsColumn, { width: 100 }]}>
                        <TouchableOpacity style={styles.statusActionButton}>
                          <Ionicons name="checkmark-circle" size={18} color="#3b82f6" />
                          <Text style={styles.statusActionText}>Status</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No bugs found</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // Task Management Header
  taskManagementHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  taskManagementTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  
  // New header styles
  // KPI Cards Styles
  kpiCardsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  kpiCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  kpiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiContent: {
    flex: 1,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  kpiDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  kpiBreakdown: {
    fontSize: 12,
    color: '#6B7280',
  },
  // Header Section
  headerSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff6b00',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f1f1f',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 100,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dropdownItemSelected: {
    backgroundColor: '#fff5eb',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#ff6b00',
    fontWeight: '600',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 10,
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#ff6b00',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadMoreContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },

  statsContainer: {
    height: 100,
    marginVertical: 8,
  },
  statsList: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statBox: { 
    alignItems: 'center', 
    justifyContent: 'center',
    width: width / 4 - 8,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
    padding: 8,
  },
  statNumber: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 12, color: '#7a7a7a', marginTop: 2 },

  band: {
    marginHorizontal: 12,
    borderRadius: 14,
    padding: 10,
    marginTop: 6,
  },
  chartRow: { flexDirection: 'row', gap: 10 },
  chartCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    minHeight: 200,
    justifyContent: 'center',
  },
  cardTitle: { fontWeight: '700', color: '#ff6b00', marginBottom: 6, textAlign: 'center' },

  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  compactLegendRow: {
    gap: 8,
    marginTop: 6,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { 
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500'
  },

  // Backlog/Notes Section
  backlogSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    width: '100%',
  },
  backlogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  backlogTabs: {
    flexDirection: 'row',
    gap: 0,
    flex: 1,
    minWidth: 150,
  },
  backlogTab: {
    paddingBottom: 12,
    paddingHorizontal: 12,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  backlogTabActive: {
    borderBottomColor: '#3b82f6',
  },
  backlogTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  backlogTabTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  backlogHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  sprintDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 140,
    flexShrink: 0,
  },
  sprintDropdownText: {
    fontSize: 12,
    color: '#374151',
    marginRight: 6,
  },
  normalSprintsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    flexShrink: 0,
  },
  normalSprintsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    height: 40,
    marginTop: 12,
    marginBottom: 8,
  },
  createTaskButtonBoard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flexShrink: 0,
  },
  createTaskButtonBoardText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  searchBarIcon: {
    marginRight: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  notesContent: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
    minHeight: 150,
    width: '100%',
  },
  addNoteCard: {
    width: 70,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    flexShrink: 0,
  },
  notesListArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 150,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyNotesText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  backlogBoardContainer: {
    marginTop: 16,
    height: 500,
    width: '100%',
  },
  sprintDropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  sprintDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sprintDropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },

  // Tasks Section Header
  tasksSectionHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tasksHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  tasksHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateNavButton: {
    padding: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 140,
    textAlign: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    paddingBottom: 12,
    paddingHorizontal: 16,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#ef4444',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#ef4444',
    fontWeight: '600',
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 100,
    flexShrink: 0,
  },
  filterDropdownText: {
    fontSize: 12,
    color: '#374151',
    marginRight: 6,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    height: 40,
    minWidth: 150,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
  },
  monthDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    minWidth: 80,
    flexShrink: 0,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#10b981',
    borderRadius: 8,
    gap: 4,
    flexShrink: 0,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  // Table styles
  tableWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tableScrollContainer: {
    flex: 1,
  },
  tableScrollContent: {
    paddingBottom: 20,
  },
  tableContainer: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 30,
    minWidth: Math.max(width - 32, 1000),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
    minHeight: 60,
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'left',
    paddingHorizontal: 8,
  },
  checkboxColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxHeader: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  assignedColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  noAssignee: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  priorityColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    gap: 4,
  },
  statusActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  boardContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  boardContent: {
    paddingBottom: 20,
  },
  column: {
    width: 280,
    marginRight: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    overflow: 'hidden',
  },
  columnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  columnCount: {
    fontSize: 14,
    fontWeight: '700',
  },
  columnContent: {
    maxHeight: 500,
    padding: 12,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2b2b2b',
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  projectName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  projectLink: {
    color: '#f97316',
    textDecorationLine: 'underline',
  },
  taskCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dueDate: {
    fontSize: 11,
    color: '#888',
  },
  assigneeContainer: {
    flexDirection: 'row',
  },
  assigneeAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreAssignees: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  moreAssigneesText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  emptyColumn: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyColumnText: {
    fontSize: 14,
    color: '#999',
  },
  // Added style for board view container with padding
  boardViewContainer: {
    paddingTop: 16,
    marginBottom: 30,
  },
  backlogBoardContainer: {
    marginTop: 16,
    height: 500,
    width: '100%',
  },
  taskCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskMenuButton: {
    padding: 4,
  },
  taskCardBody: {
    gap: 8,
  },
  taskAssigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assigneeAvatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  assigneeAvatarImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  assigneeInitials: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  noAssigneeText: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  taskDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dueDateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskPriorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskProjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  projectDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6b7280',
  },
  // Tasks Table Section
  tasksTableSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  // Bugs Table Section
  bugsTableSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  bugsHeader: {
    marginBottom: 16,
  },
  bugsFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    minWidth: 120,
    textAlign: 'center',
  },
  exportButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});