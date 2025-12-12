import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput,
  Dimensions,
  Modal,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'allTime', label: 'All Time' }
];

export default function EmployeeTasksScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);
  const [counts, setCounts] = useState({
    assigned: 0,
    completed: 0,
    pending: 0,
    inProgress: 0
  });
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await callApi({
          method: "GET",
          url: "/task/empstats",
          params: { period: selectedPeriod.key },
        });
        setCounts(response?.counts || {
          assigned: 0,
          completed: 0,
          pending: 0,
          inProgress: 0
        });
      } catch (err) {
        setError('Failed to load task stats');
        // Use default counts even if API fails
        setCounts({
          assigned: 0,
          completed: 0,
          pending: 0,
          inProgress: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedPeriod]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await callApi({
          method: "GET",
          url: "/task/me",
          params: { 
            period: selectedPeriod.key,
            limit: 50,
            page: 1
          }
        });
        
        console.log('Task API Response:', JSON.stringify(response, null, 2));
        console.log('Current User:', JSON.stringify(currentUser, null, 2));
        
        // Handle different response structures
        let allTasks = [];
        if (Array.isArray(response)) {
          allTasks = response;
        } else if (Array.isArray(response?.tasks)) {
          allTasks = response.tasks;
        } else if (Array.isArray(response?.data)) {
          allTasks = response.data;
        } else if (Array.isArray(response?.data?.tasks)) {
          allTasks = response.data.tasks;
        } else if (response?.tasks && Array.isArray(response.tasks)) {
          allTasks = response.tasks;
        }
        
        console.log('Parsed Tasks:', allTasks.length, allTasks);
        
        // The API /task/me should already return only current user's tasks
        // But we'll do a light filter just in case
        const currentUserId = currentUser?._id || currentUser?.id || (currentUser as any)?.employee?._id || (currentUser as any)?.employeeId;
        
        if (allTasks.length === 0) {
          console.log('No tasks returned from API');
          setTasks([]);
          setLoading(false);
          return;
        }
        
        // Since /task/me should already filter by user, we can trust the API response
        // But add a safety check if needed
        let filteredTasks = allTasks;
        if (currentUserId && allTasks.length > 0) {
          // Only filter if we see tasks that don't belong to the user
          // For now, trust the API response since /task/me should handle filtering
          filteredTasks = allTasks;
        }
        
        console.log('Final Tasks to Display:', filteredTasks.length);
        setTasks(filteredTasks);
      } catch (err: any) {
        console.error('Error fetching tasks:', err);
        console.error('Error details:', err?.response?.data || err?.message);
        setError('Failed to load tasks. Please try again.');
        setTasks([]);
        Alert.alert('Error', err?.response?.data?.message || 'Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };
    
    if (currentUser) {
      fetchTasks();
    } else {
      console.log('No current user, waiting...');
      setLoading(false);
    }
  }, [selectedPeriod, currentUser]);

  useEffect(() => {
    const filtered = tasks.filter(task =>
      task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (typeof task.projectId === 'object' ? task.projectId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) : task.project?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.priority?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.status?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTasks(filtered);
  }, [tasks, searchQuery]);

  if (loading && tasks.length === 0) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#f97316" />
      <Text style={styles.loadingText}>Loading tasks...</Text>
    </View>
  );
  
  if (error && tasks.length === 0) return (
    <View style={styles.centered}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={() => {
          setError('');
          setLoading(true);
          const fetchTasks = async () => {
            try {
              const response = await callApi({
                method: "GET",
                url: "/task/me",
                params: { 
                  period: selectedPeriod.key,
                  limit: 50,
                  page: 1
                }
              });
              let allTasks = [];
              if (Array.isArray(response)) {
                allTasks = response;
              } else if (Array.isArray(response?.tasks)) {
                allTasks = response.tasks;
              } else if (Array.isArray(response?.data)) {
                allTasks = response.data;
              } else if (Array.isArray(response?.data?.tasks)) {
                allTasks = response.data.tasks;
              }
              setTasks(allTasks);
              setError('');
            } catch (err: any) {
              setError('Failed to load tasks. Please try again.');
            } finally {
              setLoading(false);
            }
          };
          fetchTasks();
        }}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Text style={styles.header}>Task Management</Text>

      {/* Overview Card */}
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewTitle}>Overview</Text>
          <TouchableOpacity 
            style={styles.periodSelector}
            onPress={() => setShowPeriodModal(true)}
          >
            <Text style={styles.periodText}>{selectedPeriod.label}</Text>
            <Icon name="chevron-down" size={14} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Task Statistics */}
        <View style={styles.statsGrid}>
          <View style={styles.statRow}>
            <StatItem 
              label="Tasks Assigned" 
              value={counts.assigned} 
              color="#10B981"
              separatorColor="#ECFDF5"
            />
            <StatItem 
              label="Tasks Completed" 
              value={counts.completed} 
              color="#3B82F6"
              separatorColor="#EFF6FF"
            />
          </View>
          <View style={styles.statRow}>
            <StatItem 
              label="Tasks Pending" 
              value={counts.pending} 
              color="#F97316"
              separatorColor="#FFF7ED"
            />
            <StatItem 
              label="Tasks In Progress" 
              value={counts.inProgress} 
              color="#8B5CF6"
              separatorColor="#F3F4F6"
            />
          </View>
        </View>
      </View>

      {/* Task Overview Section */}
      <View style={styles.taskOverviewCard}>
        <View style={styles.taskOverviewHeader}>
          <Text style={styles.taskOverviewTitle}>Task Overview</Text>
          <TouchableOpacity style={styles.exportButton}>
            <Icon name="download" size={14} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>Export All</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search and Filter Bar */}
        <View style={styles.searchFilterBar}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>

            {/* Scrollable Table Container */}
            <ScrollView 
              horizontal={true} 
              showsHorizontalScrollIndicator={true}
              style={styles.tableScrollContainer}
              contentContainerStyle={styles.tableContentContainer}
            >
              <View style={styles.tableWrapper}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <View style={styles.checkboxColumn}>
                    <TouchableOpacity style={styles.checkbox} />
                  </View>
                  <Text style={[styles.tableHeaderText, styles.projectHeader]}>PROJECT</Text>
                  <View style={styles.sortableColumn}>
                    <Text style={[styles.tableHeaderText, styles.taskHeader]}>TASK</Text>
                    <Icon name="chevron-up" size={10} color="#9CA3AF" />
                  </View>
                  <Text style={[styles.tableHeaderText, styles.descriptionHeader]}>DESCRIPTION</Text>
                  <View style={styles.sortableColumn}>
                    <Text style={[styles.tableHeaderText, styles.priorityHeader]}>PRIORITY</Text>
                    <Icon name="chevron-up" size={10} color="#9CA3AF" />
                  </View>
                  <View style={styles.sortableColumn}>
                    <Text style={[styles.tableHeaderText, styles.statusHeader]}>STATUS</Text>
                    <Icon name="chevron-up" size={10} color="#9CA3AF" />
                  </View>
                  <View style={styles.sortableColumn}>
                    <Text style={[styles.tableHeaderText, styles.dueDateHeader]}>DUE DATE</Text>
                    <Icon name="chevron-up" size={10} color="#9CA3AF" />
                  </View>
                </View>

                {/* Scrollable Task List */}
                <ScrollView 
                  style={styles.taskListContainer}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {loading ? (
                    <View style={styles.emptyState}>
                      <ActivityIndicator size="small" color="#f97316" />
                      <Text style={styles.emptyStateText}>Loading tasks...</Text>
                    </View>
                  ) : filteredTasks.length > 0 ? (
                    filteredTasks.map((task, index) => (
                      <TaskRow key={task._id || index} task={task} navigation={navigation} />
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No tasks found</Text>
                      {error && <Text style={styles.errorTextSmall}>{error}</Text>}
                    </View>
                  )}
                </ScrollView>

                {/* Pagination */}
                <View style={styles.paginationContainer}>
                  <Text style={styles.paginationText}>Showing {filteredTasks.length > 0 ? 1 : 0} to {filteredTasks.length} of {filteredTasks.length} entries</Text>
                  <View style={styles.paginationControls}>
                    <TouchableOpacity style={styles.paginationButton}>
                      <Icon name="chevron-left" size={14} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.paginationButton}>
                      <Icon name="chevron-left" size={14} color="#6B7280" />
                    </TouchableOpacity>
                    <Text style={styles.paginationPageText}>Page 1 of 1</Text>
                    <TouchableOpacity style={styles.paginationButton}>
                      <Icon name="chevron-right" size={14} color="#6B7280" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.paginationButton}>
                      <Icon name="chevron-right" size={14} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
      </View>

      {/* Period Selection Modal */}
      <Modal
        visible={showPeriodModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPeriodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Period</Text>
            {periods.map((period) => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.modalItem,
                  selectedPeriod.key === period.key && styles.modalItemSelected
                ]}
                onPress={() => {
                  setSelectedPeriod(period);
                  setShowPeriodModal(false);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  selectedPeriod.key === period.key && styles.modalItemTextSelected
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function StatItem({ label, value, color, separatorColor }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statSeparator, { backgroundColor: separatorColor }]} />
      <Text style={styles.statValue}>{value || '0'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

    function TaskRow({ task, navigation }) {
      const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
          case 'critical': return '#DC2626';
          case 'high': return '#EF4444';
          case 'medium': return '#F59E0B';
          case 'low': return '#10B981';
          default: return '#6B7280';
        }
      };

      const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
          case 'completed': return '#10B981';
          case 'in_progress': return '#3B82F6';
          case 'in_review': return '#8B5CF6';
          case 'blocked': return '#EF4444';
          case 'todo': return '#F59E0B';
          default: return '#6B7280';
        }
      };

      const getStatusLabel = (status) => {
        const labelMap = {
          todo: 'Pending',
          in_progress: 'In Progress',
          in_review: 'In Review',
          completed: 'Completed',
          blocked: 'Blocked',
        };
        return labelMap[status?.toLowerCase()] || status || 'N/A';
      };

      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
          const date = new Date(dateString);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
          return 'N/A';
        }
      };

      return (
        <TouchableOpacity 
          style={styles.taskRow}
          onPress={() => {
            if (task._id && navigation) {
              navigation.navigate('TaskDetail', { taskId: task._id });
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.checkboxColumn}>
            <TouchableOpacity style={styles.taskCheckbox} />
          </View>
          <Text style={[styles.taskProject, styles.projectCell]} numberOfLines={2}>
            {typeof task.projectId === 'object' ? task.projectId?.name || 'N/A' : task.project || 'N/A'}
          </Text>
          <Text style={[styles.taskTitle, styles.taskCell]} numberOfLines={2}>
            {task.title || 'Untitled Task'}
          </Text>
          <Text style={[styles.taskDescription, styles.descriptionCell]} numberOfLines={2}>
            {task.description?.replace(/<[^>]*>/g, '').trim() || 'No description'}
          </Text>
          <View style={[styles.priorityColumn, styles.priorityCell]}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
              <Text style={styles.priorityText}>
                {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'N/A'}
              </Text>
            </View>
          </View>
          <View style={[styles.statusColumn, styles.statusCell]}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
              <Text style={styles.statusText}>
                {getStatusLabel(task.status)}
              </Text>
            </View>
          </View>
          <Text style={[styles.dueDate, styles.dueDateCell]} numberOfLines={1}>
            {formatDate(task.dueDate)}
          </Text>
        </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#1E293B',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  
  // Overview Card Styles
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 14,
    color: '#64748B',
    marginRight: 6,
    fontWeight: '500',
  },
  
  // Stats Grid Styles
  statsGrid: {
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  statSeparator: {
    width: 2,
    height: 32,
    marginBottom: 6,
    borderRadius: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Task Overview Card Styles
  taskOverviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskOverviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  
  // Search and Filter Styles
  searchFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  filterButton: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  
  // Export Button Styles
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
    gap: 6,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Scrollable Table Styles
  tableScrollContainer: {
    flex: 1,
    marginTop: 8,
  },
  tableContentContainer: {
    flexGrow: 1,
  },
  tableWrapper: {
    minWidth: 900,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  taskListContainer: {
    maxHeight: 500,
  },
  
  // Table Styles
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    minHeight: 50,
  },
  checkboxColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortableColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
  },
  
  // Header Column Styles
  projectHeader: {
    width: 140,
    textAlign: 'left',
    marginLeft: 8,
  },
  taskHeader: {
    width: 180,
    textAlign: 'left',
    marginLeft: 12,
  },
  descriptionHeader: {
    width: 220,
    textAlign: 'left',
    marginLeft: 12,
  },
  priorityHeader: {
    width: 110,
    textAlign: 'center',
    marginLeft: 12,
  },
  statusHeader: {
    width: 120,
    textAlign: 'center',
    marginLeft: 12,
  },
  dueDateHeader: {
    width: 130,
    textAlign: 'center',
    marginLeft: 12,
  },
  
  // Task Row Styles
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    minHeight: 64,
  },
  taskCheckbox: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
  },
  
  // Cell Styles
  projectCell: {
    width: 140,
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'left',
    marginLeft: 8,
    lineHeight: 20,
  },
  taskCell: {
    width: 180,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '700',
    textAlign: 'left',
    marginLeft: 12,
    lineHeight: 20,
  },
  descriptionCell: {
    width: 220,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'left',
    marginLeft: 12,
    lineHeight: 18,
  },
  priorityCell: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  statusCell: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  dueDateCell: {
    width: 130,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginLeft: 12,
    lineHeight: 18,
    fontWeight: '500',
  },
  
  // Badge Styles
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  paginationText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  paginationPageText: {
    fontSize: 13,
    color: '#374151',
    marginHorizontal: 12,
    fontWeight: '600',
  },
  
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 12,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: width * 0.8,
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  modalItemSelected: {
    backgroundColor: '#F97316',
  },
  modalItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  modalItemTextSelected: {
    color: '#FFFFFF',
  },
  
  // Loading Styles
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorTextSmall: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});