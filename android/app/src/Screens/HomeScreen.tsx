import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { BarChart } from 'react-native-chart-kit';
import useAxios from '../hooks/useAxios';
import { useSelector } from "react-redux";
import { RootState } from "../states/store";
import dayjs from 'dayjs';
import AppHeader from '../components/AppHeader';

type Mode = "day" | "week" | "month" | "year";

interface GraphStatsResponse {
  projects: {
    startDate: string;
    endDate: string;
    // other project fields if needed
  }[];
}

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

interface User {
  name: string;
  organization: string;
  avatar?: string;
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

const DashboardUI = ({ navigation }: { navigation: any }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const { callApi } = useAxios();
  const [loading, setLoading] = useState({
    cards: true,
    graph: true,
    tasks: true
  });
  const [dashbStats, setDashStats] = useState<DashboardStatsResponse>();
  const [graphStats, setGraphStats] = useState<GraphStatsResponse>();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<Mode>('week');
  const [referenceDate, setReferenceDate] = useState(dayjs());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0
  });

  useEffect(() => {
    fetchDashboardStats();
    fetchGraphStats();
    fetchTasks();
  }, [mode, referenceDate]);

  useEffect(() => {
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      fetchTasks();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(prev => ({ ...prev, cards: true }));
      const response = await callApi({
        method: "GET",
        url: `/projects/dashStats/${currentUser?.organization}`,
      });
      console.log('Dashboard Stats Response:', response);
      setDashStats(response.data);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(prev => ({ ...prev, cards: false }));
    }
  };

  const fetchGraphStats = async () => {
    try {
      setLoading(prev => ({ ...prev, graph: true }));
      const response = await callApi({
        method: "GET",
        url: `/projects/stats`,
        params: {
          mode,
          referenceDate: referenceDate.format("YYYY-MM-DD"),
          organizationId: currentUser?.organization
        }
      });
      console.log('Graph Stats Response:', response);
      setGraphStats(response);
    } catch (error) {
      console.error("Error fetching graph stats:", error);
    } finally {
      setLoading(prev => ({ ...prev, graph: false }));
    }
  };

  const getDateRange = () => {
    const now = dayjs();
    let startDate, endDate;
    
    if (mode === 'day') {
      startDate = referenceDate.startOf('day').format('YYYY-MM-DD');
      endDate = referenceDate.endOf('day').format('YYYY-MM-DD');
    } else if (mode === 'week') {
      startDate = referenceDate.startOf('week').format('YYYY-MM-DD');
      endDate = referenceDate.endOf('week').format('YYYY-MM-DD');
    } else if (mode === 'month') {
      startDate = referenceDate.startOf('month').format('YYYY-MM-DD');
      endDate = referenceDate.endOf('month').format('YYYY-MM-DD');
    } else {
      startDate = referenceDate.startOf('year').format('YYYY-MM-DD');
      endDate = referenceDate.endOf('year').format('YYYY-MM-DD');
    }
    
    return { startDate, endDate };
  };

  const fetchTasks = async () => {
    try {
      if (!currentUser?.organization) return;
      
      setLoading(prev => ({ ...prev, tasks: true }));

      const dateRange = getDateRange();

      const params = {
        organizationId: currentUser.organization,
        status: activeTab === 'active' ? 'active' : 'completed',
        search: searchQuery,
        page: pagination.page,
        limit: pagination.limit,
        ...dateRange
      };

      const response = await callApi({
        method: 'GET',
        url: '/task/getAll',
        params
      });

      if (response?.success) {
        setTasks(response.data.tasks || []);
        setPagination({
          page: response.data.pagination.page,
          limit: response.data.pagination.limit,
          total: response.data.pagination.total
        });
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  const handlePrev = () => setReferenceDate(prev => prev.subtract(1, mode));
  const handleNext = () => setReferenceDate(prev => prev.add(1, mode));

  // Generate optimized labels based on mode
  const generateLabels = () => {
    if (mode === "week") {
      return Array.from({ length: 7 }, (_, i) =>
        referenceDate.startOf("week").add(i, "day").format("ddd")
      );
    } else if (mode === "month") {
      // For month, show only every 5th day to avoid clutter
      const daysInMonth = referenceDate.daysInMonth();
      const labels = [];
      for (let i = 1; i <= daysInMonth; i += 5) {
        labels.push(`${i}`);
        // Add the last day if it's not included
        if (i + 5 > daysInMonth && i !== daysInMonth) {
          labels.push(`${daysInMonth}`);
        }
      }
      return labels;
    } else if (mode === "year") {
      return Array.from({ length: 12 }, (_, i) => dayjs().month(i).format("MMM"));
    } else {
      return [referenceDate.format("DD MMM")];
    }
  };

  // Calculate started and ended counts for the chart with optimized labels
  const calculateChartData = () => {
    const labels = generateLabels();
    const projects = graphStats?.projects || [];

    const startedCounts = labels.map(label => {
      if (mode === "month") {
        // For month, count projects started within the 5-day range
        const day = parseInt(label);
        const nextDay = day + (labels.includes(`${day + 5}`) ? 5 : (referenceDate.daysInMonth() - day + 1));
        const count = projects.filter(p => {
          const startDay = dayjs(p.startDate).date();
          return startDay >= day && startDay < nextDay;
        }).length;
        return count;
      } else {
        const count = projects.filter(p =>
          dayjs(p.startDate).format(
            mode === "year"
              ? "MMM"
              : mode === "week"
                ? "ddd"
                : "DD MMM"
          ) === label
        ).length;
        return count;
      }
    });

    const endedCounts = labels.map(label => {
      if (mode === "month") {
        // For month, count projects ended within the 5-day range
        const day = parseInt(label);
        const nextDay = day + (labels.includes(`${day + 5}`) ? 5 : (referenceDate.daysInMonth() - day + 1));
        const count = projects.filter(p => {
          const endDay = dayjs(p.endDate).date();
          return endDay >= day && endDay < nextDay;
        }).length;
        return count;
      } else {
        const count = projects.filter(p =>
          dayjs(p.endDate).format(
            mode === "year"
              ? "MMM"
              : mode === "week"
                ? "ddd"
                : "DD MMM"
          ) === label
        ).length;
        return count;
      }
    });

    return {
      labels,
      startedCounts,
      endedCounts
    };
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
      icon: <MaterialIcons name="priority-high" size={24} color="#F44336" />,
      bgColor: '#FFEBEE',
    },
    {
      id: 4,
      label: "High Priority Tasks",
      value: dashbStats?.highPriorityTasks || 0,
      icon: <FontAwesome name="exclamation-circle" size={24} color="#4CAF50" />,
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

  // Chart data
  const { labels, startedCounts, endedCounts } = calculateChartData();
  const chartData = {
    labels,
    datasets: [
      {
        data: startedCounts,
        colors: Array(labels.length).fill(
          (opacity = 1) => `rgba(59, 130, 246, ${opacity})` // blue
        )
      },
      {
        data: endedCounts,
        colors: labels.map((_, i) =>
          i % 2 === 0
            ? ((opacity = 1) => `rgba(239, 68, 68, ${opacity}`) // 🔴 red
            : ((opacity = 1) => `rgba(249, 115, 22, ${opacity})`) // 🟠 orange
        )
      }
    ]
  };

  // Calculate max value for Y axis
  const maxValue = Math.max(...startedCounts, ...endedCounts);
  const yAxisMax = Math.ceil((maxValue + 1) / 5) * 5;

  // Filtered tasks helper
  const filteredTasks = (tasks: Task[] = []) => {
    return tasks.filter(task => {
      const project = task.projectId?.name || '';
      const taskName = task.title || '';
      const assignee = task.assignedTo?.[0] ? 
        `${task.assignedTo[0].firstName} ${task.assignedTo[0].lastName}` : '';
      
      return (
        project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignee.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  };

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

  if (loading.cards || loading.graph) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AppHeader navigation={navigation} />

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
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalScroll}
        scrollEnabled={false}
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
          <Text style={styles.sectionTitle}>Monthly Tasks</Text>
          <TouchableOpacity>
            <Text style={styles.sectionActionText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter-outline" size={20} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Active ({tasks.filter(task => task.status === 'todo' || task.status === 'inProgress').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed ({tasks.filter(task => task.status === 'completed').length})
            </Text>
          </TouchableOpacity>
        </View>

        {loading.tasks ? (
          <View style={styles.loadingTasks}>
            <ActivityIndicator size="small" color="#FF5722" />
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        ) : (
          <>
            {/* Table */}
            <View style={styles.table}>
              {/* Header */}
              <View style={styles.tableHeader}>
                <Text style={[styles.headerText, { flex: 0.6 }]}>#</Text>
                <Text style={[styles.headerText, { flex: 2 }]}>Project</Text>
                <Text style={[styles.headerText, { flex: 2 }]}>Task</Text>
                <Text style={[styles.headerText, { flex: 1.5 }]}>Assignee</Text>
                <Text style={[styles.headerText, { flex: 1 }]}>Status</Text>
              </View>

              {/* Rows */}
              {filteredTasks(tasks).map((item, index) => {
                const assignee = item.assignedTo?.[0];
                const assigneeName = assignee ? `${assignee.firstName} ${assignee.lastName}` : 'Unassigned';
                
                return (
                  <View key={item._id} style={styles.tableRow}>
                    <Text style={[styles.rowText, { flex: 0.6 }]}>{index + 1}</Text>
                    <Text style={[styles.rowText, { flex: 2 }]} numberOfLines={1}>{item.projectId?.name || 'No Project'}</Text>
                    <Text style={[styles.rowText, { flex: 2 }]} numberOfLines={1}>{item.title}</Text>
                    <View style={[styles.assigneeContainer, { flex: 1.5 }]}>
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
                    <View style={[styles.statusContainer, { flex: 1 }]}>
                      <View style={[
                        styles.statusBadge,
                        item.status === 'completed' ? styles.completedBadge : 
                        item.status === 'inProgress' ? styles.inProgressBadge : styles.todoBadge
                      ]}>
                        <Text style={styles.statusText}>
                          {item.status === 'completed' ? 'Done' : 
                           item.status === 'inProgress' ? 'In Progress' : 'To Do'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {filteredTasks(tasks).length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No tasks found</Text>
                </View>
              )}
            </View>

            {/* Pagination Controls */}
            {pagination.total > pagination.limit && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, pagination.page === 1 && styles.paginationButtonDisabled]}
                  onPress={() => {
                    if (pagination.page > 1) {
                      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                      fetchTasks();
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
                  style={[styles.paginationButton, pagination.page >= Math.ceil(pagination.total / pagination.limit) && styles.paginationButtonDisabled]}
                  onPress={() => {
                    if (pagination.page < Math.ceil(pagination.total / pagination.limit)) {
                      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                      fetchTasks();
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
  );
};

const styles = StyleSheet.create({
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
  table: { backgroundColor: '#FFF', borderRadius: 12, marginHorizontal: 20, padding: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, minHeight: 200 },
  tableHeader: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#EEE', marginBottom: 10 },
  headerText: { fontSize: 13, fontWeight: '600', color: '#666', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  rowText: { fontSize: 14, color: '#333', paddingRight: 5 },
  assigneeContainer: { flexDirection: 'row', alignItems: 'center' },
  assigneeAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
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
  assigneeName: { fontSize: 14, color: '#333', maxWidth: 80 },
  statusContainer: { alignItems: 'center' },
  statusBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  todoBadge: { backgroundColor: '#FFECB3' },
  inProgressBadge: { backgroundColor: '#B3E5FC' },
  completedBadge: { backgroundColor: '#C8E6C9' },
  statusText: { 
    fontSize: 12, 
    fontWeight: '600',
    color: '#333' 
  },
  emptyState: { paddingVertical: 20, justifyContent: 'center', alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: '#999' },
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
  }
});

export default DashboardUI;