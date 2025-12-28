import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useSelector } from "react-redux";
import { RootState } from "../states/store";
import dayjs from 'dayjs';
import useAxios from '../hooks/useAxios';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface DashboardStatsResponse {
  totalProjects: number;
  projectsInProgress: number;
  highPriorityProjects: number;
  highPriorityTasks: number;
  pendingTasks: number;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage: string;
  }[];
  assignedBy: {
    _id: string;
    name: string;
  };
  projectId: {
    _id: string;
    name: string;
  };
  dueDate: string;
  startDate: string | null;
  estimatedHours: number;
  actualHours: number;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

interface CardData {
  id: number;
  label: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

type TimeFilter = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

const DashboardUI = ({ navigation }: { navigation: any }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const { callApi } = useAxios();
  const [loading, setLoading] = useState({
    cards: true,
    tasks: true
  });
  const [dashbStats, setDashStats] = useState<DashboardStatsResponse>();
  const { currentUser, token } = useSelector((state: RootState) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'in_review' | 'blocked'>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0
  });
  const [showDateFilter, setShowDateFilter] = useState(false);
  // Default to "This Year" for main PM dashboard, as requested
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDatePickerValue, setStartDatePickerValue] = useState(new Date());
  const [endDatePickerValue, setEndDatePickerValue] = useState(new Date());
  const [activeTaskCount, setActiveTaskCount] = useState(0);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);

  useEffect(() => {
    // Only fetch once we actually have an organization id
    if (!currentUser?.organization) return;
    fetchDashboardStats();
    fetchTasks();
  }, [currentUser?.organization]);

  useEffect(() => {
    // Re-fetch tasks whenever filters change AND we have an organization id
    if (!currentUser?.organization) return;

    // Reset pagination to page 1 when tab or filters change (excluding page itself)
    setPagination(prev => ({ ...prev, page: 1 }));

    const timeoutId = setTimeout(() => {
      fetchTasks();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab, statusFilter, timeFilter, customStartDate, customEndDate, currentUser?.organization]);

  // Re-fetch tasks when the page changes
  useEffect(() => {
    if (!currentUser?.organization) return;
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(prev => ({ ...prev, cards: true }));
      const response = await callApi({
        method: "GET",
        url: `/projects/dashStats/${currentUser?.organization}`,
      });
      console.log('Dashboard Stats Response:', response);

      // Support multiple possible response shapes
      const payload: any =
        response?.data?.data ??
        response?.data ??
        response;

      if (payload) {
        setDashStats({
          totalProjects: payload.totalProjects ?? payload.total_projects ?? 0,
          projectsInProgress: payload.projectsInProgress ?? payload.projects_in_progress ?? 0,
          highPriorityProjects: payload.highPriorityProjects ?? payload.high_priority_projects ?? 0,
          highPriorityTasks: payload.highPriorityTasks ?? payload.high_priority_tasks ?? 0,
          pendingTasks: payload.pendingTasks ?? payload.pending_tasks ?? 0,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(prev => ({ ...prev, cards: false }));
    }
  };

  // Build date params for /task/getAll to match web PM/tasks behavior
  const getDateRange = () => {
    // All time: backend expects timePeriod = 'all' and no dates
    if (timeFilter === 'all') {
      return {
        timePeriod: 'all',
      };
    }

    // Custom: use explicit start/end from inputs if provided
    if (timeFilter === 'custom') {
      if (!customStartDate || !customEndDate) {
        return {
          timePeriod: 'all',
        };
      }
      return {
        timePeriod: 'custom',
        startDate: new Date(customStartDate).toISOString(),
        endDate: new Date(customEndDate).toISOString(),
      };
    }

    // Relative ranges (today/week/month/year)
    const now = dayjs();
    let startDate: string;
    let endDate: string;
    
    switch (timeFilter) {
      case 'today':
        startDate = now.startOf('day').toISOString();
        endDate = now.endOf('day').toISOString();
        break;
      case 'week':
        startDate = now.startOf('week').toISOString();
        endDate = now.endOf('week').toISOString();
        break;
      case 'month':
        startDate = now.startOf('month').toISOString();
        endDate = now.endOf('month').toISOString();
        break;
      case 'year':
        startDate = now.startOf('year').toISOString();
        endDate = now.endOf('year').toISOString();
        break;
      default:
        startDate = now.startOf('month').toISOString();
        endDate = now.endOf('month').toISOString();
    }
    
    return {
      timePeriod: 'custom',
      startDate,
      endDate,
    };
  };

  const fetchTasks = async () => {
    // If we don't yet have an organization, don't stay stuck in loading state
    if (!currentUser?.organization) {
      setTasks([]);
      setLoading(prev => ({ ...prev, tasks: false }));
      return;
    }

    try {
      setLoading(prev => ({ ...prev, tasks: true }));

      // When statusFilter is applied, use a higher limit to get more tasks for client-side filtering
      // Otherwise use normal pagination limit
      const limitToUse = (activeTab === 'active' && statusFilter !== 'all') 
        ? 100  // Fetch more tasks when filtering by status so we have enough to filter client-side
        : pagination.limit;

      const params: any = {
        organizationId: currentUser.organization,
        status: activeTab === 'active' ? 'active' : 'completed',
        search: searchQuery,
        page: statusFilter !== 'all' ? 1 : pagination.page, // Always use page 1 when filtering
        limit: limitToUse,
        isBug: 'false',
        ...getDateRange(),
      };

      // Note: Status filter (todo/in_progress/etc) is handled client-side
      // because the API might not support filtering by specific status types
      // The API returns all active tasks, and we filter them by status client-side

      console.log('API Request Params:', params);

      const response = await callApi({
        method: 'GET',
        url: '/task/getAll',
        params,
      });

      // Web PM/tasks list contract:
      // { success, data: { tasks, pagination } }
      const success = (response as any)?.success;
      const dataWrapper = (response as any)?.data;
      const tasksArray = Array.isArray(dataWrapper?.tasks) ? dataWrapper.tasks : [];
      const paginationData = dataWrapper?.pagination || {};

      setTasks(success && Array.isArray(tasksArray) ? tasksArray : []);
      setPagination({
        page: paginationData.page || 1,
        limit: paginationData.limit || 10,
        total: paginationData.total || 0,
      });

      // Update counts for the current tab
      if (activeTab === 'active' && statusFilter === 'all') {
        setActiveTaskCount(paginationData.total || 0);
      } else if (activeTab === 'completed') {
        setCompletedTaskCount(paginationData.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const handleTimeFilterChange = (filter: TimeFilter) => {
    setTimeFilter(filter);
    setShowDateFilter(false);
  };

  const getTimeFilterLabel = () => {
    switch (timeFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
      case 'custom': return 'Custom Range';
      default: return 'This Month';
    }
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      if (event.type !== 'dismissed' && selectedDate) {
        const isoDate = selectedDate.toISOString().split('T')[0];
        setCustomStartDate(isoDate);
        setStartDatePickerValue(selectedDate);
        setTimeFilter('custom');
      }
    } else {
      // iOS: just update the picker value, user will confirm with Done button
      if (event.type !== 'dismissed' && selectedDate) {
        setStartDatePickerValue(selectedDate);
      }
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (event.type !== 'dismissed' && selectedDate) {
        const isoDate = selectedDate.toISOString().split('T')[0];
        setCustomEndDate(isoDate);
        setEndDatePickerValue(selectedDate);
        setTimeFilter('custom');
      }
    } else {
      // iOS: just update the picker value, user will confirm with Done button
      if (event.type !== 'dismissed' && selectedDate) {
        setEndDatePickerValue(selectedDate);
      }
    }
  };

  const applyCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setTimeFilter('custom');
      setShowDateFilter(false);
      // fetchTasks will be called by useEffect when customStartDate/customEndDate change
    } else {
      Alert.alert('Error', 'Please select both start and end dates');
    }
  };

  // Cards data
const cards: CardData[] = [
    {
      id: 1,
      label: "Total Projects",
      value: dashbStats?.totalProjects || 0,
      icon: <MaterialIcons name="folder" size={24} color="#673AB7" />,
      bgColor: '#F1F3FF',
    },
    {
      id: 2,
      label: "Projects in Progress",
      value: dashbStats?.projectsInProgress || 0,
      icon: <MaterialIcons name="work" size={24} color="#009688" />,
      bgColor: '#E8F8F6',
    },
    {
      id: 3,
      label: "High Priority Projects",
      value: dashbStats?.highPriorityProjects || 0,
      icon: <MaterialIcons name="assignment" size={24} color="#F44336" />,
      bgColor: '#FFEBEE',
    },
    {
      id: 4,
      label: "High Priority Tasks",
      value: dashbStats?.highPriorityTasks || 0,
      icon: <MaterialIcons name="description" size={24} color="#4CAF50" />,
      bgColor: '#E8F5E9',
    },
    {
      id: 5,
      label: "Pending Tasks",
      value: dashbStats?.pendingTasks || 0,
      icon: <MaterialIcons name="pending-actions" size={24} color="#FF9800" />,
      bgColor: '#FFF3E0',
    },
  ];


  // Apply client-side filtering for status filter (todo/in_progress/etc)
  // This is needed because the API might not support filtering by specific status types
  // Server-side filtering handles: active/completed tab, search, date range, pagination
  // Client-side filtering handles: specific status types (todo, in_progress, in_review, blocked)
  const visibleTasks = useMemo(() => {
    if (activeTab === 'completed') {
      // For completed tab, show all completed tasks
      return tasks;
    }
    
    // For active tab, filter by statusFilter if not 'all'
    if (statusFilter === 'all') {
      return tasks;
    }
    
    // Filter tasks by the selected status
    return tasks.filter(task => task.status === statusFilter);
  }, [tasks, activeTab, statusFilter]);

  const scrollRef = React.useRef<ScrollView>(null);
  const [scrollPosition, setScrollPosition] = React.useState(0);

  const scrollCards = (direction: 'left' | 'right') => {
    const cardWidth = Dimensions.get('window').width * 0.48 + 10;
    const newPosition = direction === 'right'
      ? Math.min(scrollPosition + cardWidth, (cards.length - 1) * cardWidth)
      : Math.max(scrollPosition - cardWidth, 0);

    setScrollPosition(newPosition);
    scrollRef.current?.scrollTo({ x: newPosition, animated: true });
  };

  if (loading.cards) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#FF5722" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.scrollControls}>
          <TouchableOpacity
            style={styles.scrollButton}
            onPress={() => scrollCards('left')}
            disabled={scrollPosition === 0}
          >
            <View style={styles.arrowCircle}>
              <Ionicons
                name="chevron-back"
                size={16}
                color={scrollPosition === 0 ? '#ccc' : '#FF5722'}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scrollButton}
            onPress={() => scrollCards('right')}
            disabled={scrollPosition >= (cards.length - 1) * (Dimensions.get('window').width * 0.48 + 10)}
          >
            <View style={styles.arrowCircle}>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={scrollPosition >= (cards.length - 1) * (Dimensions.get('window').width * 0.48 + 10) ? '#ccc' : '#FF5722'}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.horizontalScroll}
        scrollEnabled={true}
        bounces={false}
        decelerationRate="fast"
      >
        {cards.map((card) => (
          <View
            key={card.id}
            style={[
              styles.statCard,
              {
                backgroundColor: card.bgColor,
                marginRight: card.id === cards.length ? 0 : 10
              }
            ]}
          >
            <View style={styles.cardIconContainer}>
              {card.icon}
            </View>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{card.value.toString().padStart(2, '0')}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Tasks */}
      <View style={styles.taskSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tasks</Text>
          <TouchableOpacity
            onPress={() => {
              // Navigate to full Tasks list under Tasks tab
              try {
                const parent = navigation?.getParent?.();
                if (parent) {
                  parent.navigate('TasksTab', { screen: 'TaskList' });
                } else if (navigation?.navigate) {
                  // Try alternative navigation method
                  navigation.navigate('TasksTab' as never, { screen: 'TaskList' } as never);
                }
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Error', 'Unable to navigate to Tasks screen');
              }
            }}
          >
            <Text style={styles.sectionActionText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowDateFilter(true)}
          >
            <Ionicons name="filter-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Date Filter Modal */}
        <Modal
          visible={showDateFilter}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDateFilter(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              
              {/* Quick Filter Buttons */}
              <View style={styles.quickFilterContainer}>
                {(['today', 'week', 'month', 'year', 'all'] as TimeFilter[]).map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.quickFilterButton,
                      timeFilter === filter && styles.quickFilterButtonActive
                    ]}
                    onPress={() => handleTimeFilterChange(filter)}
                  >
                    <Text style={[
                      styles.quickFilterText,
                      timeFilter === filter && styles.quickFilterTextActive
                    ]}>
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Date Range */}
              <Text style={styles.customRangeTitle}>Custom Range:</Text>
              <View style={styles.customDateContainer}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <TouchableOpacity
                    style={styles.dateInputButton}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text style={[styles.dateInputText, !customStartDate && styles.dateInputPlaceholder]}>
                      {customStartDate ? dayjs(customStartDate).format('YYYY-MM-DD') : 'Select start date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <>
                      <DateTimePicker
                        value={startDatePickerValue}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleStartDateChange}
                        maximumDate={customEndDate ? new Date(customEndDate) : undefined}
                      />
                      {Platform.OS === 'ios' && (
                        <View style={styles.iosPickerButtons}>
                          <TouchableOpacity
                            style={styles.iosPickerButton}
                            onPress={() => {
                              const isoDate = startDatePickerValue.toISOString().split('T')[0];
                              setCustomStartDate(isoDate);
                              setShowStartDatePicker(false);
                              setTimeFilter('custom');
                            }}
                          >
                            <Text style={styles.iosPickerButtonText}>Done</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iosPickerButton}
                            onPress={() => setShowStartDatePicker(false)}
                          >
                            <Text style={styles.iosPickerButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <TouchableOpacity
                    style={styles.dateInputButton}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text style={[styles.dateInputText, !customEndDate && styles.dateInputPlaceholder]}>
                      {customEndDate ? dayjs(customEndDate).format('YYYY-MM-DD') : 'Select end date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#666" />
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <>
                      <DateTimePicker
                        value={endDatePickerValue}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleEndDateChange}
                        minimumDate={customStartDate ? new Date(customStartDate) : undefined}
                      />
                      {Platform.OS === 'ios' && (
                        <View style={styles.iosPickerButtons}>
                          <TouchableOpacity
                            style={styles.iosPickerButton}
                            onPress={() => {
                              const isoDate = endDatePickerValue.toISOString().split('T')[0];
                              setCustomEndDate(isoDate);
                              setShowEndDatePicker(false);
                              setTimeFilter('custom');
                            }}
                          >
                            <Text style={styles.iosPickerButtonText}>Done</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iosPickerButton}
                            onPress={() => setShowEndDatePicker(false)}
                          >
                            <Text style={styles.iosPickerButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDateFilter(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.applyButton]}
                  onPress={applyCustomDateRange}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Current Filter Display */}
        <View style={styles.currentFilterContainer}>
          <Text style={styles.currentFilterText}>
            Showing: {getTimeFilterLabel()}
          </Text>
          {(timeFilter === 'custom' && customStartDate && customEndDate) && (
            <Text style={styles.customDateText}>
              {dayjs(customStartDate).format('MMM D, YYYY')} - {dayjs(customEndDate).format('MMM D, YYYY')}
            </Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
            onPress={() => {
              setActiveTab('active');
              setStatusFilter('all');
              setPagination(prev => ({ ...prev, page: 1 })); // Reset pagination on tab change
            }}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Active ({activeTab === 'active' ? pagination.total : activeTaskCount || 0})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'completed' && styles.activeTab]}
            onPress={() => {
              setActiveTab('completed');
              setStatusFilter('all');
              setPagination(prev => ({ ...prev, page: 1 })); // Reset pagination on tab change
            }}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed ({activeTab === 'completed' ? pagination.total : completedTaskCount || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips (for Active tab) */}
        {activeTab === 'active' && (
          <View style={styles.statusFilterContainer}>
            {[
              { key: 'all', label: 'All' },
              { key: 'todo', label: 'To Do' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'in_review', label: 'In Review' },
              { key: 'blocked', label: 'Blocked' },
            ].map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.statusFilterChip,
                  statusFilter === filter.key && styles.statusFilterChipActive,
                ]}
                onPress={() => {
                  setStatusFilter(filter.key as any);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <Text
                  style={[
                    styles.statusFilterText,
                    statusFilter === filter.key && styles.statusFilterTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {loading.tasks ? (
          <View style={styles.loadingTasks}>
            <ActivityIndicator size="small" color="#FF5722" />
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        ) : (
          <>
            {/* Table */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollView}>
              <View style={styles.table}>
                {/* Header */}
                <View style={styles.tableHeader}>
                  <View style={[styles.headerCell, styles.indexCell]}>
                    <Text style={styles.headerText}>#</Text>
                  </View>
                  <View style={[styles.headerCell, styles.projectCell]}>
                    <Text style={styles.headerText}>Project</Text>
                  </View>
                  <View style={[styles.headerCell, styles.taskCell]}>
                    <Text style={styles.headerText}>Task</Text>
                  </View>
                  <View style={[styles.headerCell, styles.assigneeCell]}>
                    <Text style={styles.headerText}>Assignee</Text>
                  </View>
                  <View style={[styles.headerCell, styles.statusCell]}>
                    <Text style={styles.headerText}>Status</Text>
                  </View>
                </View>

                {/* Rows */}
                {visibleTasks.map((item, index) => {
                  const assignee = item.assignedTo?.[0];
                  const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned';
                  // Calculate index: if statusFilter is 'all', use pagination offset, otherwise use array index
                  // When filtering client-side, we show indices based on filtered results
                  const displayIndex = statusFilter === 'all' 
                    ? (pagination.page - 1) * pagination.limit + index + 1
                    : index + 1;
                  
                  return (
                    <TouchableOpacity
                      key={item._id}
                      style={styles.tableRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        // Open task detail in Tasks tab stack
                        try {
                          const parent = navigation?.getParent?.();
                          if (parent) {
                            parent.navigate('TasksTab', {
                              screen: 'TaskDetail',
                              params: { taskId: item._id },
                            });
                          } else if (navigation?.navigate) {
                            // Fallback navigation
                            navigation.navigate('TasksTab' as never, {
                              screen: 'TaskDetail',
                              params: { taskId: item._id },
                            } as never);
                          }
                        } catch (error) {
                          console.error('Navigation error:', error);
                          Alert.alert('Error', 'Unable to open task details');
                        }
                      }}
                    >
                      <View style={[styles.rowCell, styles.indexCell]}>
                        <Text style={styles.rowText}>{displayIndex}</Text>
                      </View>
                      <View style={[styles.rowCell, styles.projectCell]}>
                        <Text style={styles.rowText} numberOfLines={1}>{item.projectId?.name || 'No Project'}</Text>
                      </View>
                      <View style={[styles.rowCell, styles.taskCell]}>
                        <Text style={styles.rowText} numberOfLines={1}>{item.title}</Text>
                      </View>
                      <View style={[styles.rowCell, styles.assigneeCell]}>
                        <View style={styles.assigneeContainer}>
                          {assignee?.profileImage ? (
                            <Image
                              source={{ uri: assignee.profileImage }}
                              style={styles.assigneeAvatar}
                            />
                          ) : (
                            <View style={[styles.assigneeAvatar, styles.placeholderAvatar]}>
                              <Text style={styles.placeholderText}>
                                {assigneeName.charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.assigneeName} numberOfLines={1}>{assigneeName}</Text>
                        </View>
                      </View>
                      <View style={[styles.rowCell, styles.statusCell]}>
                        <View style={[
                          styles.statusBadge,
                          item.status === 'completed'
                            ? styles.completedBadge
                            : item.status === 'in_progress'
                            ? styles.inProgressBadge
                            : styles.todoBadge
                        ]}>
                          <Text style={styles.statusText}>
                            {item.status === 'completed' ? 'Done' : 
                              item.status === 'in_progress' ? 'In Progress' : 'To Do'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {visibleTasks.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No tasks found</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Pagination Controls */}
            {/* Only show pagination when statusFilter is 'all' because client-side filtering conflicts with pagination */}
            {statusFilter === 'all' && pagination.total > pagination.limit && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, pagination.page === 1 && styles.paginationButtonDisabled]}
                  onPress={() => {
                    if (pagination.page > 1) {
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                    }
                  }}
                  disabled={pagination.page === 1}
                >
                  <Text style={styles.paginationText}>Previous</Text>
                </TouchableOpacity>
                
                <Text style={styles.paginationInfo}>
                  Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                </Text>
                
                <TouchableOpacity
                  style={[
                    styles.paginationButton,
                    pagination.page >= Math.ceil(pagination.total / pagination.limit) &&
                      styles.paginationButtonDisabled,
                  ]}
                  onPress={() => {
                    if (pagination.page < Math.ceil(pagination.total / pagination.limit)) {
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                    }
                  }}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                >
                  <Text style={styles.paginationText}>Next</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F9F9' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333' }, 
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15, marginTop: 15 },
  sectionActionText: { color: '#FF5722', fontSize: 14, fontWeight: '600' }, 
  scrollControls: { flexDirection: 'row', alignItems: 'center' }, 
  scrollButton: { padding: 5 }, 
  arrowCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255, 87, 34, 0.1)', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  horizontalScroll: { paddingHorizontal: 20 }, 
  statCard: { width: Dimensions.get('window').width * 0.48, padding: 20, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }, 
  cardIconContainer: { width: 40, height: 40, marginBottom: 20, justifyContent: 'center', alignItems: 'center' }, 
  cardLabel: { fontSize: 14, color: '#666', marginBottom: 5 }, 
  cardValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  taskSection: { marginTop: 25, marginBottom: 30 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: 15, marginHorizontal: 20, marginBottom: 15, height: 45, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: '#333' },
  filterButton: { padding: 5, marginLeft: 10 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15 },
  tabButton: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, marginRight: 10, backgroundColor: '#EEE' },
  activeTab: { backgroundColor: '#FF5722' },
  tabText: { fontSize: 14, color: '#666' },
  activeTabText: { fontSize: 14, color: '#FFF', fontWeight: '600' },
  tableScrollView: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 200,
    maxHeight: 400,
  },
  table: {
    minWidth: Dimensions.get('window').width - 40,
  },
  tableHeader: { 
    flexDirection: 'row', 
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1, 
    borderBottomColor: '#EEE',
    backgroundColor: '#F9F9F9',
  },
  headerCell: {
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  indexCell: {
    width: 40,
    alignItems: 'center',
  },
  projectCell: {
    width: 120,
  },
  taskCell: {
    width: 150,
  },
  assigneeCell: {
    width: 120,
  },
  statusCell: {
    width: 100,
    alignItems: 'center',
  },
  headerText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#666', 
    textTransform: 'uppercase' 
  },
  tableRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1, 
    borderBottomColor: '#F5F5F5',
    minHeight: 50,
  },
  rowCell: {
    paddingHorizontal: 5,
    justifyContent: 'center',
  },
  rowText: { 
    fontSize: 14, 
    color: '#333',
  },
  assigneeContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
  },
  assigneeAvatar: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    marginRight: 8 
  },
  placeholderAvatar: { 
    backgroundColor: '#E0E0E0', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderText: { 
    color: '#888', 
    fontWeight: 'bold', 
    fontSize: 12 
  },
  assigneeName: { 
    fontSize: 14, 
    color: '#333', 
    flexShrink: 1,
  },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12,
  },
  todoBadge: { 
    backgroundColor: '#FFECB3' 
  },
  inProgressBadge: { 
    backgroundColor: '#B3E5FC' 
  },
  completedBadge: { 
    backgroundColor: '#C8E6C9' 
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  emptyState: { 
    paddingVertical: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  emptyStateText: { 
    fontSize: 14, 
    color: '#999' 
  },
  loadingTasks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    marginLeft: 10,
    color: '#666'
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 20
  },
  paginationButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#FF5722',
    borderRadius: 5
  },
  paginationButtonDisabled: {
    backgroundColor: '#ccc'
  },
  paginationText: {
    color: 'white',
    fontWeight: '600'
  },
  paginationInfo: {
    marginHorizontal: 15,
    color: '#666'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  quickFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 8,
  },
  quickFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  quickFilterButtonActive: {
    backgroundColor: '#FF5722',
  },
  quickFilterText: {
    fontSize: 12,
    color: '#666',
  },
  quickFilterTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  customRangeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  customDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    marginBottom: 5,
    color: '#666',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFF',
  },
  dateInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFF',
    minHeight: 44,
  },
  dateInputText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dateInputPlaceholder: {
    color: '#999',
  },
  iosPickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  iosPickerButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#FF5722',
  },
  iosPickerButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  applyButton: {
    backgroundColor: '#FF5722',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  currentFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  currentFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5722',
  },
  customDateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 8,
  },
  statusFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  statusFilterChipActive: {
    backgroundColor: '#FF5722',
  },
  statusFilterText: {
    fontSize: 12,
    color: '#555',
  },
  statusFilterTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default DashboardUI;