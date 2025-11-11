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
  Modal
} from 'react-native';
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
  const { callApi } = useAxios();
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
        const response = await callApi({
          method: "GET",
          url: "/task/me",
          params: { 
            period: selectedPeriod.key,
            limit: 50,
            page: 1
          }
        });
        setTasks(response?.tasks || response?.data?.tasks || []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        // Set some mock data for demonstration
        setTasks([
          {
            _id: '1',
            title: 'Implement user authentication',
            description: 'Create login and registration functionality',
            priority: 'high',
            status: 'in_progress',
            dueDate: '2024-01-15',
            projectId: { name: 'Mobile App' }
          },
          {
            _id: '2',
            title: 'Design database schema',
            description: 'Create tables for users, projects, and tasks',
            priority: 'medium',
            status: 'completed',
            dueDate: '2024-01-10',
            projectId: { name: 'Backend API' }
          },
          {
            _id: '3',
            title: 'Write unit tests',
            description: 'Add test coverage for critical functions',
            priority: 'low',
            status: 'todo',
            dueDate: '2024-01-20',
            projectId: { name: 'Testing Suite' }
          },
          {
            _id: '4',
            title: 'Code review for PR #123',
            description: 'Review changes in authentication module',
            priority: 'critical',
            status: 'in_review',
            dueDate: '2024-01-12',
            projectId: { name: 'Code Review' }
          }
        ]);
      }
    };
    fetchTasks();
  }, [selectedPeriod]);

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

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#f97316" />
      <Text style={styles.loadingText}>Loading tasks...</Text>
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
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task, index) => (
                      <TaskRow key={task._id || index} task={task} />
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No tasks found</Text>
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

    function TaskRow({ task }) {
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
        <View style={styles.taskRow}>
          <View style={styles.checkboxColumn}>
            <TouchableOpacity style={styles.taskCheckbox} />
          </View>
          <Text style={[styles.taskProject, styles.projectCell]} numberOfLines={1}>
            {typeof task.projectId === 'object' ? task.projectId?.name || 'N/A' : task.project || 'N/A'}
          </Text>
          <Text style={[styles.taskTitle, styles.taskCell]} numberOfLines={1}>
            {task.title || 'Untitled Task'}
          </Text>
          <Text style={[styles.taskDescription, styles.descriptionCell]} numberOfLines={1}>
            {task.description || 'No description'}
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
    </View>
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
    minWidth: 650,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  taskListContainer: {
    maxHeight: 400,
  },
  
  // Table Styles
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  checkboxColumn: {
    width: 30,
    alignItems: 'center',
  },
  sortableColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.3,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 3,
  },
  
  // Header Column Styles
  projectHeader: {
    width: 100,
    textAlign: 'left',
  },
  taskHeader: {
    width: 120,
    textAlign: 'left',
  },
  descriptionHeader: {
    width: 150,
    textAlign: 'left',
  },
  priorityHeader: {
    width: 80,
    textAlign: 'center',
  },
  statusHeader: {
    width: 90,
    textAlign: 'center',
  },
  dueDateHeader: {
    width: 100,
    textAlign: 'center',
  },
  
  // Task Row Styles
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  taskCheckbox: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 3,
  },
  
  // Cell Styles
  projectCell: {
    width: 100,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'left',
  },
  taskCell: {
    width: 120,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '600',
    textAlign: 'left',
  },
  descriptionCell: {
    width: 150,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'left',
  },
  priorityCell: {
    width: 80,
    alignItems: 'center',
  },
  statusCell: {
    width: 90,
    alignItems: 'center',
  },
  dueDateCell: {
    width: 100,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Badge Styles
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Pagination Styles
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  paginationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  paginationPageText: {
    fontSize: 12,
    color: '#374151',
    marginHorizontal: 8,
  },
  
  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
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
  },
});