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
import { exportToXlsx } from '../utills/utills';

const { width } = Dimensions.get('window');

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'allTime', label: 'All Time' }
];

const statusOptions = ['All Statuses', 'To Do', 'In Progress', 'In Review', 'Completed', 'Blocked'];
const monthOptions = ['Month', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'Active' | 'Completed'>('Active');
  const [boardTab, setBoardTab] = useState<'Backlog' | 'Notes'>('Backlog');
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Task table filters similar to PM web
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedMonth, setSelectedMonth] = useState('Month');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<'status' | 'priority' | 'dueDate' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Bugs state (per-employee view)
  const [bugs, setBugs] = useState<any[]>([]);
  const [bugsLoading, setBugsLoading] = useState(false);
  const [bugsActiveTab, setBugsActiveTab] = useState<'Active' | 'Completed'>('Active');
  const [bugsSearchQuery, setBugsSearchQuery] = useState('');
  const [bugsSelectedStatus, setBugsSelectedStatus] = useState('All Statuses');
  const [bugsSelectedMonth, setBugsSelectedMonth] = useState('Month');
  const [showBugsStatusDropdown, setShowBugsStatusDropdown] = useState(false);
  const [showBugsMonthDropdown, setShowBugsMonthDropdown] = useState(false);

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
    const filtered = tasks.filter((task: any) => {
      const search = searchQuery.toLowerCase();
      const status = (task.status || '').toLowerCase();

      // Status filter
      if (selectedStatus !== 'All Statuses') {
        const normalized = selectedStatus.toLowerCase().replace(' ', '_');
        if (status !== normalized) return false;
      }

      // Month filter (by dueDate)
      if (selectedMonth !== 'Month' && task.dueDate) {
        const monthIndex = new Date(task.dueDate).getMonth(); // 0-11
        const monthName = monthOptions[monthIndex + 1]; // shift by 1 because first is 'Month'
        if (monthName !== selectedMonth) return false;
      }

      // Text search
      if (!search) return true;

      return (
        task.title?.toLowerCase().includes(search) ||
        (typeof task.projectId === 'object'
          ? task.projectId?.name?.toLowerCase().includes(search)
          : task.project?.toLowerCase().includes(search)) ||
        task.description?.toLowerCase().includes(search) ||
        task.priority?.toLowerCase().includes(search) ||
        status.includes(search)
      );
    });
    setFilteredTasks(filtered);
  }, [tasks, searchQuery, selectedStatus, selectedMonth]);

  // Visible tasks based on Active / Completed tab
  // IMPORTANT: Status filter should NOT affect Completed tab - it should show all completed tasks
  let visibleTasks = filteredTasks.filter((task: any) => {
    const status = (task.status || '').toLowerCase();
    if (activeTab === 'Completed') {
      // Completed tab: Show all completed tasks regardless of status filter
      return status === 'completed';
    }
    // Active tab: Apply status filter to non-completed tasks
    if (selectedStatus !== 'All Statuses') {
      const normalized = selectedStatus.toLowerCase().replace(' ', '_');
      return status !== 'completed' && status === normalized;
    }
    // Active tab → everything that is not completed
    return status !== 'completed';
  });

  // Apply sorting
  if (sortField) {
    visibleTasks = [...visibleTasks].sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'status':
          aValue = (a.status || '').toLowerCase();
          bValue = (b.status || '').toLowerCase();
          break;
        case 'priority':
          const priorityOrder: any = { 'high': 3, 'medium': 2, 'low': 1 };
          aValue = priorityOrder[(a.priority || '').toLowerCase()] || 0;
          bValue = priorityOrder[(b.priority || '').toLowerCase()] || 0;
          break;
        case 'dueDate':
          aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Selection helpers for checkboxes
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId],
    );
  };

  const toggleAllTasksSelection = () => {
    if (visibleTasks.length > 0 && selectedTasks.length === visibleTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(visibleTasks.map((t: any) => t._id).filter(Boolean));
    }
  };

  // Update task status (used when moving cards between backlog columns)
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      // Find the task to check current status
      const currentTask = tasks.find((t: any) => t._id === taskId);
      const currentStatus = (currentTask?.status || '').toLowerCase().replace(' ', '_');
      const normalizedNewStatus = newStatus.toLowerCase().replace(' ', '_');
      
      // Don't update if status hasn't changed
      if (currentStatus === normalizedNewStatus) {
        return; // Silently return, don't show success message
      }

      await callApi({
        method: 'PATCH',
        url: `/task/${taskId}/status`,
        data: { status: newStatus },
      });

      // Update local tasks state
      setTasks(prev =>
        prev.map(task =>
          (task as any)._id === taskId ? { ...(task as any), status: newStatus } : task,
        ),
      );

      Alert.alert('Success', 'Task status updated successfully');
    } catch (error: any) {
      console.error('Error updating task status:', error);
      const errorMessage =
        error?.response?.data?.message || error?.message || 'Failed to update task status';
      Alert.alert('Error', errorMessage);
    }
  };

  const openMoveStatusMenu = (task: any) => {
    if (!task?._id) {
      return;
    }
    Alert.alert('Move Task', 'Select the column to move this task to:', [
      { text: 'To Do', onPress: () => handleStatusChange(task._id, 'todo') },
      { text: 'In Progress', onPress: () => handleStatusChange(task._id, 'in_progress') },
      { text: 'In Review', onPress: () => handleStatusChange(task._id, 'in_review') },
      { text: 'Completed', onPress: () => handleStatusChange(task._id, 'completed') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Bugs: fetch and filter similar to PM TasksScreen, but scoped by organization
  const fetchBugs = async () => {
    try {
      if (!currentUser?.organization) return;

      setBugsLoading(true);

      // Month filter for bugs
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      if (bugsSelectedMonth !== 'Month') {
        const monthIndex = monthOptions.indexOf(bugsSelectedMonth) - 1;
        if (monthIndex >= 0) {
          startDate = new Date(now.getFullYear(), monthIndex, 1);
          endDate = new Date(now.getFullYear(), monthIndex + 1, 0, 23, 59, 59, 999);
        }
      }

      const params: any = {
        organizationId: currentUser.organization,
        status: bugsActiveTab === 'Active' ? 'active' : 'completed',
        search: bugsSearchQuery,
        page: 1,
        limit: 50,
        isBug: 'true',
      };

      if (startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }

      const response = await callApi({
        method: 'GET',
        url: '/task/getAll',
        params,
      });

      const success = (response as any)?.success;
      const dataWrapper = (response as any)?.data;
      const bugsArray: any[] = Array.isArray(dataWrapper?.tasks) ? dataWrapper.tasks : [];

      if (success) {
        setBugs(bugsArray);
      } else {
        setBugs([]);
      }
    } catch (err) {
      console.error('Failed to fetch bugs (employee):', err);
    } finally {
      setBugsLoading(false);
    }
  };

  useEffect(() => {
    fetchBugs();
  }, [currentUser?.organization, bugsActiveTab, bugsSearchQuery, bugsSelectedMonth]);

  const filteredBugs = bugs.filter((bug: any) => {
    if (bugsSelectedStatus !== 'All Statuses') {
      const normalized = bugsSelectedStatus.toLowerCase().replace(' ', '_');
      if ((bug.status || '').toLowerCase() !== normalized) return false;
    }
    if (!bugsSearchQuery) return true;
    const s = bugsSearchQuery.toLowerCase();
    return (
      bug.title?.toLowerCase().includes(s) ||
      (typeof bug.projectId === 'object'
        ? bug.projectId?.name?.toLowerCase().includes(s)
        : (bug.projectId || '').toString().toLowerCase().includes(s))
    );
  });

  const handleExportBugs = async () => {
    try {
      if (!filteredBugs.length) {
        Alert.alert('Info', 'No bugs to export');
        return;
      }

      const rows = filteredBugs.map((bug: any, index: number) => ({
        no: index + 1,
        project:
          typeof bug.projectId === 'object'
            ? bug.projectId?.name || 'N/A'
            : bug.project || 'N/A',
        title: bug.title || 'N/A',
        startDate: bug.startDate || '',
        dueDate: bug.dueDate || '',
        priority: bug.priority || 'N/A',
        status: bug.status || 'N/A',
      }));

      await exportToXlsx({
        filename: `employee-bugs-${new Date().toISOString().split('T')[0]}`,
        columns: [
          { key: 'no', header: 'NO#' },
          { key: 'project', header: 'PROJECT' },
          { key: 'title', header: 'TITLE' },
          { key: 'startDate', header: 'START' },
          { key: 'dueDate', header: 'DUE' },
          { key: 'priority', header: 'PRIORITY' },
          { key: 'status', header: 'STATUS' },
        ],
        rows,
      });

      Alert.alert('Success', 'Bugs exported successfully');
    } catch (error: any) {
      console.error('Error exporting bugs:', error);
      Alert.alert('Error', error?.message || 'Failed to export bugs');
    }
  };

  // Simple Kanban-style grouping for backlog board (uses all filtered tasks)
  const boardBuckets = {
    todo: [] as any[],
    in_progress: [] as any[],
    in_review: [] as any[],
    completed: [] as any[],
  };

  filteredTasks.forEach((task: any) => {
    const status = (task.status || '').toLowerCase();
    if (status === 'completed') {
      boardBuckets.completed.push(task);
    } else if (status === 'in_review') {
      boardBuckets.in_review.push(task);
    } else if (status === 'in_progress') {
      boardBuckets.in_progress.push(task);
    } else {
      boardBuckets.todo.push(task);
    }
  });

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

      {/* Backlog / Notes board (web-style) */}
      <View style={styles.boardSection}>
        <View style={styles.boardHeader}>
          <View style={styles.boardTabs}>
            <TouchableOpacity
              style={[styles.boardTab, boardTab === 'Backlog' && styles.boardTabActive]}
              onPress={() => setBoardTab('Backlog')}
            >
              <Text style={[styles.boardTabText, boardTab === 'Backlog' && styles.boardTabTextActive]}>
                Backlog
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.boardTab, boardTab === 'Notes' && styles.boardTabActive]}
              onPress={() => setBoardTab('Notes')}
            >
              <Text style={[styles.boardTabText, boardTab === 'Notes' && styles.boardTabTextActive]}>
                Notes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {boardTab === 'Backlog' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.boardScroll}
            contentContainerStyle={styles.boardColumnsContainer}
          >
            {/* To Do */}
            <View style={styles.boardColumn}>
              <Text style={styles.boardColumnTitle}>To Do {boardBuckets.todo.length > 0 ? `(${boardBuckets.todo.length})` : ''}</Text>
              <View style={styles.boardDropArea}>
                {boardBuckets.todo.length === 0 ? (
                  <Text style={styles.boardEmptyText}>Drop tasks here</Text>
                ) : (
                  boardBuckets.todo.map((task: any) => (
                    <TouchableOpacity
                      key={task._id}
                      style={styles.boardCard}
                      activeOpacity={0.8}
                      onLongPress={() => openMoveStatusMenu(task)}
                      onPress={() => {
                        if (task._id && navigation) {
                          (navigation as any).navigate('TaskDetail', { taskId: task._id });
                        }
                      }}
                    >
                      <Text style={styles.boardCardTitle} numberOfLines={2}>
                        {task.title || 'Untitled Task'}
                      </Text>
                      <Text style={styles.boardCardProject} numberOfLines={1}>
                        {typeof task.projectId === 'object' ? task.projectId?.name || 'N/A' : task.project || 'N/A'}
                      </Text>
                      <Text style={styles.boardCardMeta}>
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* In Progress */}
            <View style={styles.boardColumn}>
              <Text style={styles.boardColumnTitle}>In Progress {boardBuckets.in_progress.length > 0 ? `(${boardBuckets.in_progress.length})` : ''}</Text>
              <View style={styles.boardDropArea}>
                {boardBuckets.in_progress.length === 0 ? (
                  <Text style={styles.boardEmptyText}>Drop tasks here</Text>
                ) : (
                  boardBuckets.in_progress.map((task: any) => (
                    <TouchableOpacity
                      key={task._id}
                      style={styles.boardCard}
                      activeOpacity={0.8}
                      onLongPress={() => openMoveStatusMenu(task)}
                      onPress={() => {
                        if (task._id && navigation) {
                          (navigation as any).navigate('TaskDetail', { taskId: task._id });
                        }
                      }}
                    >
                      <Text style={styles.boardCardTitle} numberOfLines={2}>
                        {task.title || 'Untitled Task'}
                      </Text>
                      <Text style={styles.boardCardProject} numberOfLines={1}>
                        {typeof task.projectId === 'object' ? task.projectId?.name || 'N/A' : task.project || 'N/A'}
                      </Text>
                      <Text style={styles.boardCardMeta}>
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* In Review */}
            <View style={styles.boardColumn}>
              <Text style={styles.boardColumnTitle}>In Review {boardBuckets.in_review.length > 0 ? `(${boardBuckets.in_review.length})` : ''}</Text>
              <View style={styles.boardDropArea}>
                {boardBuckets.in_review.length === 0 ? (
                  <Text style={styles.boardEmptyText}>Drop tasks here</Text>
                ) : (
                  boardBuckets.in_review.map((task: any) => (
                    <TouchableOpacity
                      key={task._id}
                      style={styles.boardCard}
                      activeOpacity={0.8}
                      onLongPress={() => openMoveStatusMenu(task)}
                      onPress={() => {
                        if (task._id && navigation) {
                          (navigation as any).navigate('TaskDetail', { taskId: task._id });
                        }
                      }}
                    >
                      <Text style={styles.boardCardTitle} numberOfLines={2}>
                        {task.title || 'Untitled Task'}
                      </Text>
                      <Text style={styles.boardCardProject} numberOfLines={1}>
                        {typeof task.projectId === 'object' ? task.projectId?.name || 'N/A' : task.project || 'N/A'}
                      </Text>
                      <Text style={styles.boardCardMeta}>
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* Completed */}
            <View style={styles.boardColumn}>
              <Text style={styles.boardColumnTitle}>Completed {boardBuckets.completed.length > 0 ? `(${boardBuckets.completed.length})` : ''}</Text>
              <View style={styles.boardDropArea}>
                {boardBuckets.completed.length === 0 ? (
                  <Text style={styles.boardEmptyText}>Drop tasks here</Text>
                ) : (
                  boardBuckets.completed.map((task: any) => (
                    <TouchableOpacity
                      key={task._id}
                      style={styles.boardCard}
                      activeOpacity={0.8}
                      onLongPress={() => openMoveStatusMenu(task)}
                      onPress={() => {
                        if (task._id && navigation) {
                          (navigation as any).navigate('TaskDetail', { taskId: task._id });
                        }
                      }}
                    >
                      <Text style={styles.boardCardTitle} numberOfLines={2}>
                        {task.title || 'Untitled Task'}
                      </Text>
                      <Text style={styles.boardCardProject} numberOfLines={1}>
                        {typeof task.projectId === 'object' ? task.projectId?.name || 'N/A' : task.project || 'N/A'}
                      </Text>
                      <Text style={styles.boardCardMeta}>
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>
          </ScrollView>
        ) : (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <Text style={styles.notesTitle}>Notes</Text>
              <TouchableOpacity
                style={styles.addNoteButton}
                onPress={() => setShowNoteModal(true)}
              >
                <Icon name="plus" size={16} color="#FFFFFF" />
                <Text style={styles.addNoteButtonText}>Add Note</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.notesList}>
              {notes.length === 0 ? (
                <View style={styles.notesEmpty}>
                  <Text style={styles.notesEmptyText}>No notes yet. Add your first note!</Text>
                </View>
              ) : (
                notes.map((note, index) => (
                  <View key={index} style={styles.noteItem}>
                    <Text style={styles.noteText}>{note}</Text>
                    <TouchableOpacity
                      style={styles.deleteNoteButton}
                      onPress={() => {
                        setNotes(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <Icon name="trash" size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
            
            {/* Add Note Modal */}
            <Modal
              visible={showNoteModal}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowNoteModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add Note</Text>
                    <TouchableOpacity onPress={() => setShowNoteModal(false)}>
                      <Icon name="close" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.noteInput}
                    placeholder="Enter your note..."
                    placeholderTextColor="#9CA3AF"
                    value={newNote}
                    onChangeText={setNewNote}
                    multiline
                    numberOfLines={4}
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => {
                        setShowNoteModal(false);
                        setNewNote('');
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.saveButton]}
                      onPress={() => {
                        if (newNote.trim()) {
                          setNotes(prev => [...prev, newNote.trim()]);
                          setNewNote('');
                          setShowNoteModal(false);
                        }
                      }}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
            </View>
            </Modal>
          </View>
        )}
      </View>

      {/* Task Overview Section */}
      <View style={styles.taskOverviewCard}>
        <View style={styles.taskOverviewHeader}>
          <Text style={styles.taskOverviewTitle}>Tasks</Text>

          {/* Active / Completed tabs (desktop-style) */}
          <View style={styles.tasksTabs}>
            <TouchableOpacity
              style={[
                styles.tasksTab,
                activeTab === 'Active' && styles.tasksTabActive,
              ]}
              onPress={() => setActiveTab('Active')}
            >
              <Text
                style={[
                  styles.tasksTabText,
                  activeTab === 'Active' && styles.tasksTabTextActive,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tasksTab,
                activeTab === 'Completed' && styles.tasksTabActive,
              ]}
              onPress={() => setActiveTab('Completed')}
            >
              <Text
                style={[
                  styles.tasksTabText,
                  activeTab === 'Completed' && styles.tasksTabTextActive,
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.exportButton}
            onPress={async () => {
              try {
                if (!visibleTasks.length) {
                  Alert.alert('Info', 'No tasks to export');
                  return;
                }

                const rows = visibleTasks.map((task: any, index: number) => ({
                  no: index + 1,
                  project: typeof task.projectId === 'object' ? task.projectId?.name || 'N/A' : task.project || 'N/A',
                  title: task.title || 'N/A',
                  description: task.description || 'N/A',
                  priority: task.priority || 'N/A',
                  status: task.status || 'N/A',
                  startDate: task.startDate ? new Date(task.startDate).toLocaleDateString() : '',
                  dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
                }));

                await exportToXlsx({
                  filename: `employee-tasks-${new Date().toISOString().split('T')[0]}`,
                  columns: [
                    { key: 'no', header: 'NO#' },
                    { key: 'project', header: 'PROJECT' },
                    { key: 'title', header: 'TITLE' },
                    { key: 'description', header: 'DESCRIPTION' },
                    { key: 'priority', header: 'PRIORITY' },
                    { key: 'status', header: 'STATUS' },
                    { key: 'startDate', header: 'START DATE' },
                    { key: 'dueDate', header: 'DUE DATE' },
                  ],
                  rows,
                });

                Alert.alert('Success', 'Tasks exported successfully');
              } catch (error: any) {
                console.error('Error exporting tasks:', error);
                Alert.alert('Error', error?.message || 'Failed to export tasks');
              }
            }}
          >
            <Icon name="download" size={14} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>Export All</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search and Filter Bar (month + status + search) */}
        <View style={styles.searchFilterBar}>
          {/* First row: Month + All Statuses */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setShowMonthDropdown(true)}
            >
              <Text style={styles.filterDropdownText}>{selectedMonth}</Text>
              <MaterialIcons name="arrow-drop-down" size={18} color="#6B7280" style={styles.filterDropdownIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setShowStatusDropdown(true)}
            >
              <Text style={styles.filterDropdownText}>{selectedStatus}</Text>
              <MaterialIcons name="arrow-drop-down" size={18} color="#6B7280" style={styles.filterDropdownIcon} />
            </TouchableOpacity>
          </View>

          {/* Second row: Search bar full width */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
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
                  <TouchableOpacity
                    style={styles.checkboxColumn}
                    onPress={toggleAllTasksSelection}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, selectedTasks.length === visibleTasks.length && visibleTasks.length > 0 && styles.checkboxChecked]} />
                  </TouchableOpacity>
                  <Text style={[styles.tableHeaderText, styles.projectHeader]}>PROJECT</Text>
                  <View style={styles.sortableColumn}>
                    <Text style={[styles.tableHeaderText, styles.taskHeader]}>TASK</Text>
                  </View>
                  <Text style={[styles.tableHeaderText, styles.descriptionHeader]}>DESCRIPTION</Text>
                  <TouchableOpacity
                    style={styles.sortableColumn}
                    onPress={() => {
                      if (sortField === 'priority') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('priority');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <Text style={[styles.tableHeaderText, styles.priorityHeader]}>PRIORITY</Text>
                    {sortField === 'priority' ? (
                      <Icon 
                        name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} 
                        size={10} 
                        color="#FF6B35" 
                      />
                    ) : (
                      <Icon name="chevron-up" size={10} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sortableColumn}
                    onPress={() => {
                      if (sortField === 'status') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('status');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <Text style={[styles.tableHeaderText, styles.statusHeader]}>STATUS</Text>
                    {sortField === 'status' ? (
                      <Icon 
                        name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} 
                        size={10} 
                        color="#FF6B35" 
                      />
                    ) : (
                      <Icon name="chevron-up" size={10} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.sortableColumn}
                    onPress={() => {
                      if (sortField === 'dueDate') {
                        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('dueDate');
                        setSortDirection('asc');
                      }
                    }}
                  >
                    <Text style={[styles.tableHeaderText, styles.dueDateHeader]}>DUE DATE</Text>
                    {sortField === 'dueDate' ? (
                      <Icon 
                        name={sortDirection === 'asc' ? 'chevron-up' : 'chevron-down'} 
                        size={10} 
                        color="#FF6B35" 
                      />
                    ) : (
                      <Icon name="chevron-up" size={10} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
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
                  ) : visibleTasks.length > 0 ? (
                    visibleTasks.map((task: any, index: number) => (
                      <TaskRow
                        key={task._id || index}
                        task={task}
                        navigation={navigation}
                        isSelected={selectedTasks.includes(task._id)}
                        onToggleSelect={() => toggleTaskSelection(task._id)}
                      />
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
                  <Text style={styles.paginationText}>
                    Showing {visibleTasks.length > 0 ? 1 : 0} to {visibleTasks.length} of {visibleTasks.length} entries
                  </Text>
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

      {/* Bugs Section (below tasks table, matching Tasks layout) */}
      <View style={styles.taskOverviewCard}>
        <View style={styles.taskOverviewHeader}>
          <Text style={styles.taskOverviewTitle}>Bugs</Text>

          {/* Active / Completed tabs in header, same as Tasks */}
          <View style={styles.tasksTabs}>
            <TouchableOpacity
              style={[
                styles.tasksTab,
                bugsActiveTab === 'Active' && styles.tasksTabActive,
              ]}
              onPress={() => setBugsActiveTab('Active')}
            >
              <Text
                style={[
                  styles.tasksTabText,
                  bugsActiveTab === 'Active' && styles.tasksTabTextActive,
                ]}
              >
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tasksTab,
                bugsActiveTab === 'Completed' && styles.tasksTabActive,
              ]}
              onPress={() => setBugsActiveTab('Completed')}
            >
              <Text
                style={[
                  styles.tasksTabText,
                  bugsActiveTab === 'Completed' && styles.tasksTabTextActive,
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bugs filters row: first line Month + All Statuses, second line search + Export */}
        <View style={styles.searchFilterBar}>
          {/* First row: Month + All Statuses */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setShowBugsMonthDropdown(true)}
            >
              <Text style={styles.filterDropdownText}>{bugsSelectedMonth}</Text>
              <MaterialIcons
                name="arrow-drop-down"
                size={18}
                color="#6B7280"
                style={styles.filterDropdownIcon}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterDropdown}
              onPress={() => setShowBugsStatusDropdown(true)}
            >
              <Text style={styles.filterDropdownText}>{bugsSelectedStatus}</Text>
              <MaterialIcons
                name="arrow-drop-down"
                size={18}
                color="#6B7280"
                style={styles.filterDropdownIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Second row: search + Export All */}
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', gap: 8 }}>
            <View style={[styles.searchContainer, { flex: 1 }]}>
              <Icon name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search bugs"
                placeholderTextColor="#9CA3AF"
                value={bugsSearchQuery}
                onChangeText={setBugsSearchQuery}
              />
            </View>

            <TouchableOpacity style={styles.exportButton} onPress={handleExportBugs}>
              <Icon name="download" size={14} color="#FFFFFF" />
              <Text style={styles.exportButtonText}>Export All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tasks Status Dropdown Modal */}
        <Modal
          visible={showStatusDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStatusDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowStatusDropdown(false)}
          >
            <View style={styles.dropdownMenu} onStartShouldSetResponder={() => true}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.dropdownItem,
                    selectedStatus === status && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedStatus(status);
                    setShowStatusDropdown(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedStatus === status && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Tasks Month Dropdown Modal */}
        <Modal
          visible={showMonthDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowMonthDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowMonthDropdown(false)}
          >
            <View style={styles.dropdownMenu} onStartShouldSetResponder={() => true}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                style={{ maxHeight: 300 }}
              >
                {monthOptions.map((month) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.dropdownItem,
                      selectedMonth === month && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedMonth(month);
                      setShowMonthDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedMonth === month && styles.dropdownItemTextSelected,
                        { textAlign: 'center' }, // Center text in month dropdown
                      ]}
                    >
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Bugs Status Dropdown Modal */}
        {showBugsStatusDropdown && (
          <Modal
            visible={showBugsStatusDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowBugsStatusDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowBugsStatusDropdown(false)}
            >
              <View style={styles.dropdownMenu}>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.dropdownItem,
                      bugsSelectedStatus === status && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setBugsSelectedStatus(status);
                      setShowBugsStatusDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        bugsSelectedStatus === status && styles.dropdownItemTextSelected,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Bugs Month Dropdown Modal */}
        {showBugsMonthDropdown && (
          <Modal
            visible={showBugsMonthDropdown}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowBugsMonthDropdown(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowBugsMonthDropdown(false)}
            >
              <View style={styles.dropdownMenu}>
                <ScrollView
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  {monthOptions.map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.dropdownItem,
                        bugsSelectedMonth === month && styles.dropdownItemSelected,
                      ]}
                      onPress={() => {
                        setBugsSelectedMonth(month);
                        setShowBugsMonthDropdown(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownItemText,
                          bugsSelectedMonth === month && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {/* Bugs Table */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={styles.tableScrollContainer}
          contentContainerStyle={styles.tableContentContainer}
        >
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: 60, marginRight: 8 }]}>NO#</Text>
              <Text style={[styles.tableHeaderText, { width: 160, marginRight: 8 }]}>PROJECT</Text>
              <Text style={[styles.tableHeaderText, { width: 240, marginRight: 8 }]}>TITLE</Text>
              <Text style={[styles.tableHeaderText, { width: 130, marginRight: 8 }]}>START</Text>
              <Text style={[styles.tableHeaderText, { width: 130, marginRight: 8 }]}>DUE</Text>
              <Text style={[styles.tableHeaderText, { width: 110, marginRight: 8 }]}>
                PRIORITY
              </Text>
              <Text style={[styles.tableHeaderText, { width: 120, marginRight: 8 }]}>
                STATUS
              </Text>
            </View>
            {bugsLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="small" color="#f97316" />
              </View>
            ) : filteredBugs.length > 0 ? (
              filteredBugs.map((bug: any, index: number) => (
                <View key={bug._id || index} style={styles.taskRow}>
                  <Text style={[styles.dueDateCell, { width: 60, textAlign: 'left' }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.projectCell, { width: 160 }]} numberOfLines={1}>
                    {typeof bug.projectId === 'object'
                      ? bug.projectId?.name || 'N/A'
                      : bug.project || 'N/A'}
                  </Text>
                  <Text style={[styles.taskCell, { width: 240 }]} numberOfLines={1}>
                    {bug.title || 'N/A'}
                  </Text>
                  <Text style={[styles.dueDateCell, { width: 130 }]}>
                    {bug.startDate
                      ? new Date(bug.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </Text>
                  <Text style={[styles.dueDateCell, { width: 130 }]}>
                    {bug.dueDate
                      ? new Date(bug.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </Text>
                  <View style={[styles.priorityColumn, { width: 110 }]}>
                    <View style={[styles.priorityBadge, { backgroundColor: '#6B7280' }]}>
                      <Text style={styles.priorityText}>
                        {bug.priority
                          ? bug.priority.charAt(0).toUpperCase() + bug.priority.slice(1)
                          : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusColumn, { width: 120 }]}>
                    <View style={[styles.statusBadge, { backgroundColor: '#3B82F6' }]}>
                      <Text style={styles.statusText}>{bug.status || 'N/A'}</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No bugs found</Text>
              </View>
            )}
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
                  selectedPeriod.key === period.key && styles.modalItemSelected,
                ]}
                onPress={() => {
                  setSelectedPeriod(period);
                  setShowPeriodModal(false);
                }}
              >
                <Text
                  style={[
                  styles.modalItemText,
                    selectedPeriod.key === period.key && styles.modalItemTextSelected,
                  ]}
                >
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

    function TaskRow({ task, navigation, isSelected, onToggleSelect }) {
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
          <TouchableOpacity
            style={styles.checkboxColumn}
            onPress={(e) => {
              e.stopPropagation();
              if (onToggleSelect) {
                onToggleSelect();
              }
            }}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.taskCheckbox,
                isSelected && styles.checkboxChecked,
              ]}
            />
          </TouchableOpacity>
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
    flexDirection: 'column',
    alignItems: 'flex-start',
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

  // Tasks tabs (Active / Completed) aligned with header like web
  tasksTabs: {
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    padding: 2,
    marginRight: 12,
  },
  tasksTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tasksTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  tasksTabText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  tasksTabTextActive: {
    color: '#1E293B',
    fontWeight: '600',
  },

  // Board (Backlog) styles
  boardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  boardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  boardTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  boardTab: {
    marginRight: 16,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  boardTabActive: {
    borderBottomColor: '#3B82F6',
  },
  boardTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  boardTabTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  boardScroll: {
    marginTop: 8,
  },
  boardColumnsContainer: {
    paddingVertical: 8,
    paddingRight: 4,
  },
  boardColumn: {
    width: 220,
    marginRight: 12,
  },
  boardColumnTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  boardDropArea: {
    minHeight: 140,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 8,
    backgroundColor: '#F9FAFB',
  },
  boardEmptyText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 24,
  },
  boardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  boardCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  boardCardProject: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  boardCardMeta: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  notesContainer: {
    padding: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F97316',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notesList: {
    maxHeight: 400,
  },
  notesEmpty: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  noteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F97316',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    marginRight: 8,
  },
  deleteNoteButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: width * 0.9,
    maxWidth: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#F97316',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notesPlaceholder: {
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  notesPlaceholderText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  notesCard: {
    width: 80,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesPlus: {
    fontSize: 32,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Generic pill-style dropdown for Month / All Statuses
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    minWidth: 120,
    justifyContent: 'space-between',
  },
  filterDropdownText: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  filterDropdownIcon: {
    marginLeft: 8,
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
  checkboxChecked: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
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
  // Lightweight dropdown menu for Month / Status filters
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    width: '90%',
    maxWidth: 340,
    maxHeight: 320,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  dropdownItemSelected: {
    backgroundColor: '#FFE7D3',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#C2410C',
    fontWeight: '600',
  },
});