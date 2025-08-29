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
  highPriority?: number;
  priority?: {
    medium?: number;
    low?: number;
  };
  status?: {
    todo?: number;
    in_progress?: number;
    in_review?: number;
  };
  completed?: number;
  total?: number;
  incomplete?: number;
  overdue?: number;
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
  const [viewMode, setViewMode] = useState('board');
  const [stats, setStats] = useState<StatsData>({});
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('week');
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
  
  // Generate year options (current year and previous 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - i);
  }, []);

  const { currentUser } = useSelector((state: RootState) => state.user);
  const { callApi } = useAxios();

  const renderBoardView = () => {
    const boardColumns: BoardColumn[] = [
      { id: '1', title: 'To Do', status: 'todo', color: '#ffb020' },
      { id: '2', title: 'In Progress', status: 'in_progress', color: '#4cb3ff' },
      { id: '3', title: 'In Review', status: 'in_review', color: '#9b59b6' },
      { id: '4', title: 'Completed', status: 'completed', color: '#41d16a' },
      { id: '5', title: 'Blocked', status: 'blocked', color: '#ff4d4f' },
    ];

    const getTasksForColumn = (status: string) => {
      return filteredTasks.filter(task => task.status === status);
    };

    const handleTaskPress = (task: TaskDetail) => {
      // Navigate to task details screen
      navigation.navigate('TaskDetails', { taskId: task._id });
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
                  <View style={styles.taskCardHeader}>
                    <Text style={styles.taskTitle} numberOfLines={2}>
                      {task.title}
                    </Text>
                    <View style={[styles.priorityBadge, { 
                      backgroundColor: getPriorityColor(task.priority) + '20' 
                    }]}>
                      <Text style={[styles.priorityText, { 
                        color: getPriorityColor(task.priority) 
                      }]}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.projectName} numberOfLines={1}>
                    {task.projectId.name}
                  </Text>
                  
                  <View style={styles.taskCardFooter}>
                    <Text style={styles.dueDate}>
                      Due: {formatDate(task.dueDate)}
                    </Text>
                    
                    {task.assignedTo.length > 0 && (
                      <View style={styles.assigneeContainer}>
                        {task.assignedTo.slice(0, 2).map((user, index) => (
                          <Image
                            key={user._id}
                            source={{ 
                              uri: user.profileImage || 'https://via.placeholder.com/32' 
                            }}
                            style={[
                              styles.assigneeAvatar,
                              index > 0 && { marginLeft: -8 }
                            ]}
                          />
                        ))}
                        {task.assignedTo.length > 2 && (
                          <View style={styles.moreAssignees}>
                            <Text style={styles.moreAssigneesText}>
                              +{task.assignedTo.length - 2}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
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

  // Function to get date range based on time filter
  const getDateRange = () => {
    if (timeFilter === 'all') {
      return {
        timePeriod: 'custom',
        startDate: new Date(0).toISOString(),
        endDate: new Date().toISOString(),
      };
    }

    const now = new Date();
    let startDate, endDate;
    
    switch(timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        break;
      case 'week':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate = new Date(now.setDate(diff));
        endDate = new Date(now.getFullYear(), now.getMonth(), startDate.getDate() + 6, 23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }
    
    return {
      timePeriod: 'custom',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    };
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      if (!currentUser?.organization) return;

      const dateRange = getDateRange();

      const params = {
        organizationId: currentUser.organization,
        status: activeTab === 'Active' ? 'active' : 'completed', // Added status parameter
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit,
        ...dateRange
      };

      console.log('API Request Params:', JSON.stringify(params, null, 2));

      const response = await callApi({
        method: 'GET',
        url: '/task/getAll',
        params
      });

      console.log('API Response:', JSON.stringify(response, null, 2));

      if (response?.success) {
        setAllTasks(response.data.tasks);
        setPagination({
          page: response.data.pagination?.page || 1,
          limit: response.data.pagination?.limit || 10,
          total: response.data.pagination?.total || 0
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

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
         const dateRange = getDateRange();
      try {
        console.log('Fetching stats with time filter:', timeFilter);
        
        const response = await callApi({
          method: "GET",
          url: `/task/stats`,
          params: {
            timePeriod: dateRange,
            organizationId: currentUser?.organization
          }
        });
        
        console.log('Stats API Response:', response);
        
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
    }
  }, [currentUser?.organization, timeFilter, refreshTrigger, searchQuery, pagination.page, activeTab]);

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
    { id: '3', label: 'Incomplete', value: stats?.incomplete || 0, color: '#ffb020' },
    { id: '4', label: 'Overdue', value: stats?.overdue || 0, color: '#ff4d4f' },
  ];

  // Prepare dynamic pie data
  const dynamicPieData: PieDataItem[] = [
    {
      name: 'High',
      population: stats?.highPriority || 0,
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
  const completionPercentage = stats?.total ? (stats.completed || 0) / stats.total : 0;
  const completionLabel = `${Math.round(completionPercentage * 100)}%`;

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
    return new Date(dateString).toLocaleDateString();
  };

  const renderTaskItem: ListRenderItem<TaskDetail> = ({ item }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={1} ellipsizeMode="tail">
        {item.title}
      </Text>
      <Text style={[styles.tableCell, styles.priorityCell, { flex: 2 },
        { 
          backgroundColor: getPriorityColor(item.priority) + '20',
          color: getPriorityColor(item.priority)
        }]} 
        numberOfLines={1}>
        {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
      </Text>
      <Text style={[styles.tableCell, { flex: 2 },
        { 
          color: getStatusColor(item.status),
          backgroundColor: getStatusColor(item.status) + '20'
        }]} 
        numberOfLines={1}>
        {item.status.replace('_', ' ').charAt(0).toUpperCase() + item.status.replace('_', ' ').slice(1)}
      </Text>
      <Text style={[styles.tableCell, { flex: 3 }]} numberOfLines={1} ellipsizeMode="tail">
        {formatDate(item.dueDate)}
      </Text>
    </View>
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

  return (
    <View style={styles.container}>
      {/* Header with TASKS title, create button, and time filter dropdown */}
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>TASKS</Text>
        <View style={styles.headerRight}>
          {/* Create Button */}
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => navigation.navigate('CreateTask')} // Adjust to your create task screen
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
          
          {/* Year Dropdown */}
          {/* <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowYearDropdown(!showYearDropdown)}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedYear}
              </Text>
              <Ionicons 
                name={showYearDropdown ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#666" 
              />
            </TouchableOpacity>
            
            <Modal
              visible={showYearDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowYearDropdown(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowYearDropdown(false)}
              >
                <View style={styles.dropdownMenu}>
                  {yearOptions.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.dropdownItem,
                        selectedYear === year && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setSelectedYear(year);
                        setShowYearDropdown(false);
                        // You might want to trigger a data refresh with the new year filter
                      }}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        selectedYear === year && styles.dropdownItemTextSelected
                      ]}>
                        {year}
                      </Text>
                      {selectedYear === year && (
                        <Ionicons name="checkmark" size={16} color="#ff6b00" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View> */}
          
          {/* Time Filter Dropdown */}
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={styles.dropdownButtonText}>
                {timeFilterOptions.find(opt => opt.value === timeFilter)?.label || 'This Week'}
              </Text>
              <Ionicons 
                name={showDropdown ? 'chevron-up' : 'chevron-down'} 
                size={16} 
                color="#666" 
              />
            </TouchableOpacity>
            
            <Modal
              visible={showDropdown}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowDropdown(false)}
            >
              <TouchableOpacity 
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDropdown(false)}
              >
                <View style={styles.dropdownMenu}>
                  {timeFilterOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownItem,
                        timeFilter === option.value && styles.dropdownItemSelected
                      ]}
                      onPress={() => handleTimeFilterChange(option.value)}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        timeFilter === option.value && styles.dropdownItemTextSelected
                      ]}>
                        {option.label}
                      </Text>
                      {timeFilter === option.value && (
                        <Ionicons name="checkmark" size={16} color="#ff6b00" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats - Now scrollable */}
        <View style={styles.statsContainer}>
          <FlatList
            data={dynamicStats}
            renderItem={renderStatItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsList}
          />
        </View>

        {/* Orange band with charts */}
        <LinearGradient
          colors={['#ff6b00', '#ff6b00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.band}
        >
          <View style={styles.chartRow}>
            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>Task by Priority</Text>
              <View style={{ alignItems: 'center', justifyContent: 'center', height: 180 }}>
                <PieChart
                  data={dynamicPieData}
                  width={170}
                  height={120}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  hasLegend={false}
                  chartConfig={chartConfig}
                  center={[45, 0]}
                  absolute
                />
                <View style={styles.legendRow}>
                  <LegendDot color="#ff4d4f" label="High" />
                  <LegendDot color="#ffb020" label="Medium" />
                  <LegendDot color="#fbd6a2" label="Low" />
                </View>
              </View>
            </View>

            <View style={styles.chartCard}>
              <Text style={styles.cardTitle}>Task Activities</Text>
              <View style={{ alignItems: 'center', paddingTop: 8, height: 180 }}>
                <Donut progress={completionPercentage} label={completionLabel} />
                <View style={[styles.legendRow, styles.compactLegendRow]}>
                  <LegendDot color="#ff4d4f" label="Over Due" />
                  <LegendDot color="#ffb020" label="Pending" />
                  <LegendDot color="#4cb3ff" label="In Progress" />
                  <LegendDot color="#41d16a" label="Completed" />
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Search + filter */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="#8E8E93" style={{ marginHorizontal: 8 }} />
          <TextInput 
            placeholder="Search Task" 
            placeholderTextColor="#A0A0A0" 
            style={styles.searchInput} 
            value={searchQuery}
            onChangeText={handleSearch}
          />
          <TouchableOpacity style={styles.iconBtn}>
            <MaterialIcons name="tune" size={20} color="#222" />
          </TouchableOpacity>
        </View>

        {/* Tabs + view switch */}
        <View style={styles.tabsRow}>
          <View style={styles.tabPills}>
            <TouchableOpacity 
              style={[styles.pill, activeTab === 'Active' && styles.pillActive]} 
              onPress={() => handleTabChange('Active')}
            >
              <Text style={[styles.pillText, activeTab === 'Active' && styles.pillTextActive]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.pill, activeTab === 'Completed' && styles.pillActive]} 
              onPress={() => handleTabChange('Completed')}
            >
              <Text style={[styles.pillText, activeTab === 'Completed' && styles.pillTextActive]}>Completed</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.viewSwitch}>
            <TouchableOpacity 
              style={[styles.viewBtn, viewMode === 'board' && styles.viewBtnActive]} 
              onPress={() => setViewMode('board')}
            >
              <Ionicons name="albums-outline" size={16} color={viewMode === 'board' ? '#ff6b00' : '#222'} />
              <Text style={[styles.viewBtnText, { color: viewMode === 'board' ? '#ff6b00' : '#222' }]}>Board</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]} 
              onPress={() => setViewMode('list')}
            >
              <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? '#ff6b00' : '#222'} />
              <Text style={[styles.viewBtnText, { color: viewMode === 'list' ? '#ff6b00' : '#222' }]}>List</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Task Details Table or Board View with added padding */}
        {viewMode === 'list' ? (
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Task Name</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Priority</Text>
              <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { flex: 3 }]}>Due Date</Text>
            </View>
            <FlatList
              data={filteredTasks}
              renderItem={renderTaskItem}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No tasks available</Text>
                  <TouchableOpacity onPress={refreshData} style={styles.retryButton}>
                    <Text style={styles.retryButtonText}>Tap to refresh</Text>
                  </TouchableOpacity>
                </View>
              }
              ListFooterComponent={
                allTasks.length > 0 && allTasks.length < pagination.total ? (
                  <View style={styles.loadMoreContainer}>
                    <ActivityIndicator size="small" color="#FF5722" />
                    <Text style={styles.loadMoreText}>Loading more tasks...</Text>
                  </View>
                ) : null
              }
            />
          </View>
        ) : (
          <View style={styles.boardViewContainer}>
            {renderBoardView()}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  
  // New header styles
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
  legendText: { fontSize: 12 },

  searchWrap: {
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    backgroundColor: '#fff',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  iconBtn: {
    height: 32,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },

  tabsRow: {
    marginTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabPills: { flexDirection: 'row', gap: 8 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
  },
  pillActive: { backgroundColor: '#ffe4d1' },
  pillText: { color: '#5b5b5b', fontWeight: '600', fontSize: 12 },
  pillTextActive: { color: '#ff6b00' },

  viewSwitch: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 4,
    gap: 6,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  viewBtnActive: { backgroundColor: '#fff' },
  viewBtnText: { fontSize: 12, fontWeight: '600' },

  // Table styles
  tableContainer: {
    margin: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
    minHeight: 50,
  },
  tableCell: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  priorityCell: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontWeight: '600',
    overflow: 'hidden',
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
});