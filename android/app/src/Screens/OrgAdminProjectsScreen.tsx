import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';
import ProjectKpiCard from '../components/ProjectKpiCard';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import { exportToXlsx } from '../utills/utills';
import { Project } from './ProjectScreen';

const { width } = Dimensions.get('window');

const OrgAdminProjectsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { callApi } = useAxios();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // all by default
  const [exporting, setExporting] = useState(false);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;
  
  // Stats from API
  const [stats, setStats] = useState({
    'Total Projects': 0,
    'In Progress': 0,
    'Completed': 0,
    'Not Started': 0,
    'On Hold': 0,
    'Cancelled': 0,
    'Upcoming': 0,
    'High Priority': 0,
  });

  // Fetch projects with pagination
  const fetchProjects = useCallback(async () => {
    try {
      console.log('🔶 [OrgAdminProjects] fetchProjects: starting request', { page, search, statusFilter });
      setLoading(true);
      setError(null);

      const startedAt = Date.now();
      
      // Build query string matching the API format: /projects?page=1&limit=10&search=&status=&priority=
      const searchParam = search.trim() || '';
      const statusParam = statusFilter || '';
      const priorityParam = ''; // Can be added later if priority filter is needed
      
      const url = `/projects?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(searchParam)}&status=${encodeURIComponent(statusParam)}&priority=${encodeURIComponent(priorityParam)}`;

      const response = await callApi({
        method: 'GET',
        url,
      });

      console.log('🔶 [OrgAdminProjects] fetchProjects: raw response', JSON.stringify(response, null, 2));

      const success = (response as any)?.success;
      let rawProjects: any[] = [];
      let paginationData: any = {};
      let statsData: any = {};

      // Handle different response shapes
      if ((response as any)?.data) {
        if (Array.isArray((response as any).data)) {
          rawProjects = (response as any).data;
        } else if ((response as any).data?.projects && Array.isArray((response as any).data.projects)) {
          rawProjects = (response as any).data.projects;
          paginationData = (response as any).data.pagination || {};
          statsData = (response as any).data.stats || {};
        } else if ((response as any).data?.data && Array.isArray((response as any).data.data)) {
          rawProjects = (response as any).data.data;
          paginationData = (response as any).data.pagination || {};
          statsData = (response as any).data.stats || {};
        }
      } else if (Array.isArray((response as any)?.projects)) {
        rawProjects = (response as any).projects;
      } else if (Array.isArray(response as any)) {
        rawProjects = response as any;
      }

      // Extract stats from response (preferred) or response.data.stats
      if ((response as any)?.stats) {
        statsData = (response as any).stats;
      } else if ((response as any)?.data?.stats) {
        statsData = (response as any).data.stats;
      }

      // Extract pagination info
      const total = paginationData.total || (response as any)?.pagination?.total || (response as any)?.total || rawProjects.length;
      const totalPagesCount = paginationData.totalPages || (response as any)?.pagination?.totalPages || Math.ceil(total / PAGE_SIZE) || 1;

      if (rawProjects && Array.isArray(rawProjects)) {
        setProjects(rawProjects as Project[]);
        setTotalProjects(total);
        // Ensure totalPages is at least 1 and matches the actual data
        const actualTotalPages = Math.max(1, totalPagesCount);
        setTotalPages(actualTotalPages);
        
        // Log for debugging
        console.log(`📊 Projects pagination - Page: ${page}, Total: ${total}, TotalPages: ${actualTotalPages}, Displayed: ${rawProjects.length}`);
        
        // Update stats from API response
        if (statsData && Object.keys(statsData).length > 0) {
          setStats({
            'Total Projects': total,
            'In Progress': statsData['In Progress'] || statsData['in_progress'] || 0,
            'Completed': statsData['Completed'] || statsData['completed'] || 0,
            'Not Started': statsData['Not Started'] || statsData['not_started'] || 0,
            'On Hold': statsData['On Hold'] || statsData['on_hold'] || 0,
            'Cancelled': statsData['Cancelled'] || statsData['cancelled'] || 0,
            'Upcoming': statsData['Upcoming'] || statsData['upcoming'] || 0,
            'High Priority': 0, // Calculate from projects if needed
          });
        }
      } else {
        setProjects([]);
        setTotalProjects(0);
        setTotalPages(1);
        setError('Invalid project data received from server');
        console.log('🔴 [OrgAdminProjects] Unexpected projects API shape for OrgAdmin:', response);
      }

      console.log(
        '✅ [OrgAdminProjects] fetchProjects: finished',
        JSON.stringify(
          {
            total,
            totalPages: totalPagesCount,
            currentPage: page,
            projectsCount: Array.isArray(rawProjects) ? rawProjects.length : 0,
            durationMs: Date.now() - startedAt,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      console.error('🔴 [OrgAdminProjects] Error fetching projects for OrgAdmin:', err);
      setError('Failed to load projects. Please try again.');
      setProjects([]);
    } finally {
      console.log('🔶 [OrgAdminProjects] fetchProjects: setting loading = false');
      setLoading(false);
    }
  }, [callApi]);

  useEffect(() => {
    console.log('🔁 [OrgAdminProjects] useEffect: initial mount, fetching projects');
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    // Reset to page 1 when search or status filter changes
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    // Fetch when search or status filter changes (after page reset)
    if (page === 1) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter]);

  // Refresh projects when screen comes into focus (e.g., after creating a project)
  useFocusEffect(
    useCallback(() => {
      console.log('🔁 [OrgAdminProjects] useFocusEffect: screen focused, refetching projects');
      fetchProjects();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Filtered list based on search + status filter (for current page display)
  const filteredProjects = useMemo(() => {
    const byStatus = statusFilter
      ? projects.filter((p) => (p.status || '').toLowerCase() === statusFilter.toLowerCase())
      : projects;

    if (!search.trim()) return byStatus;

    const s = search.toLowerCase();
    return byStatus.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        (p.description || '').toLowerCase().includes(s) ||
        (p.projectManager?.fullName || '').toLowerCase().includes(s),
    );
  }, [projects, search, statusFilter]);

  // KPI data derived from all projects (not just current page)
  // Note: These stats should ideally come from the API, but for now we calculate from current page
  // In a real scenario, you'd want to fetch stats separately or get them from the API response
  // Calculate High Priority from current page (or could be added to API stats)
  const highPriority = projects.filter((p) => p.priority === 'High' || p.priority === 'Critical').length;

  // Use stats from API response instead of calculating from current page
  const kpiData = useMemo(
    () => [
      { title: 'Total Projects', value: stats['Total Projects'], icon: 'folder', color: '#6b7280' },
      { title: 'In Progress', value: stats['In Progress'], icon: 'trending-up', color: '#f97316' },
      { title: 'Completed', value: stats['Completed'], icon: 'check-circle', color: '#22c55e' },
      { title: 'Not Started', value: stats['Not Started'], icon: 'schedule', color: '#9ca3af' },
      { title: 'Upcoming', value: stats['Upcoming'], icon: 'event', color: '#3b82f6' },
      { title: 'On Hold', value: stats['On Hold'], icon: 'pause-circle', color: '#f59e0b' },
      { title: 'High Priority', value: highPriority, icon: 'priority-high', color: '#ef4444' },
    ],
    [stats, highPriority],
  );

  // Horizontal KPI carousel
  const kpiScrollRef = useRef<ScrollView>(null);
  const horizontalPadding = 15;
  const gap = 12;
  const cardWidth = (width - horizontalPadding * 2 - gap) / 2;
  const step = cardWidth + gap;
  const onScroll = (e: any) => {
    (kpiScrollRef as any).current._scrollPos = e.nativeEvent.contentOffset.x;
  };
  const scrollBy = (dir: number) => {
    const current = (kpiScrollRef as any).current?._scrollPos || 0;
    const next = Math.max(0, current + (dir > 0 ? step : -step));
    kpiScrollRef.current?.scrollTo({ x: next, animated: true });
  };

  const handleAddProject = () => {
    // Pass context so CreateProjectScreen can navigate back correctly
    (navigation as any).navigate('CreateProject', { from: 'OrgProjects' });
  };

  const handleProjectPress = (project: Project) => {
    (navigation as any).navigate('ProjectDetail', { projectId: project._id });
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Fetch all projects for export (not just current page)
      // Using the same API format: /projects?page=1&limit=10&search=&status=&priority=
      const searchParam = search.trim() || '';
      const statusParam = statusFilter || '';
      const priorityParam = ''; // Can be added later if priority filter is needed
      
      const url = `/projects?page=1&limit=10000&search=${encodeURIComponent(searchParam)}&status=${encodeURIComponent(statusParam)}&priority=${encodeURIComponent(priorityParam)}`;

      const response = await callApi({
        method: 'GET',
        url,
      });

      let allProjects: any[] = [];
      if ((response as any)?.data) {
        if (Array.isArray((response as any).data)) {
          allProjects = (response as any).data;
        } else if ((response as any).data?.projects && Array.isArray((response as any).data.projects)) {
          allProjects = (response as any).data.projects;
        } else if ((response as any).data?.data && Array.isArray((response as any).data.data)) {
          allProjects = (response as any).data.data;
        }
      } else if (Array.isArray((response as any)?.projects)) {
        allProjects = (response as any).projects;
      } else if (Array.isArray(response as any)) {
        allProjects = response as any;
      }

      if (!allProjects.length) {
        Alert.alert('Export', 'No projects to export');
        return;
      }

      await exportToXlsx({
        filename: `projects-${new Date().toISOString().split('T')[0]}`,
        columns: [
          { key: 'sr', header: 'SR#' },
          { key: 'name', header: 'Project Name' },
          { key: 'manager', header: 'Project Manager' },
          { key: 'status', header: 'Status' },
          { key: 'priority', header: 'Priority' },
          { key: 'startDate', header: 'Start Date' },
          { key: 'endDate', header: 'End Date' },
          { key: 'budget', header: 'Budget' },
          { key: 'spent', header: 'Amount Spent' },
        ],
        rows: allProjects.map((p, index) => ({
          sr: index + 1,
          name: p.name,
          manager: p.projectManager?.fullName || 'N/A',
          status: p.status || 'N/A',
          priority: p.priority || 'N/A',
          startDate: formatDate(p.startDate),
          endDate: formatDate(p.endDate),
          budget: p.budget ?? '',
          spent: p.spent ?? '',
        })),
      });

      Alert.alert('Success', 'Projects exported successfully');
    } catch (err) {
      console.error('Error exporting projects:', err);
      Alert.alert('Error', 'Failed to export projects');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProjects}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* KPI row */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>Projects Overview</Text>
      </View>

      <ScrollView
        ref={kpiScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, gap }}
      >
        {kpiData.map((k) => (
          <View key={k.title} style={{ width: cardWidth }}>
            <ProjectKpiCard title={k.title} value={k.value} icon={k.icon} color={k.color} />
          </View>
        ))}
      </ScrollView>

      {/* Project list */}
      <View style={styles.listCard}>
        <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Project List</Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProject}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Project</Text>
          </TouchableOpacity>
        </View>

        {/* Search + actions */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#9CA3AF" style={{ marginRight: 6 }} />
            <TextInput
              placeholder="Search projects..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <TouchableOpacity
            style={[styles.iconBtn, statusFilter === '' && styles.iconBtnActive]}
            onPress={() => setStatusFilter('')}
          >
            <Text style={[styles.iconBtnText, statusFilter === '' && styles.iconBtnTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, statusFilter === 'Not Started' && styles.iconBtnActive]}
            onPress={() => setStatusFilter('Not Started')}
          >
            <Text
              style={[
                styles.iconBtnText,
                statusFilter === 'Not Started' && styles.iconBtnTextActive,
              ]}
            >
              Not Started
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, statusFilter === 'In Progress' && styles.iconBtnActive]}
            onPress={() => setStatusFilter('In Progress')}
          >
            <Text
              style={[
                styles.iconBtnText,
                statusFilter === 'In Progress' && styles.iconBtnTextActive,
              ]}
            >
              In Progress
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, statusFilter === 'On Hold' && styles.iconBtnActive]}
            onPress={() => setStatusFilter('On Hold')}
          >
            <Text
              style={[
                styles.iconBtnText,
                statusFilter === 'On Hold' && styles.iconBtnTextActive,
              ]}
            >
              On Hold
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, statusFilter === 'Completed' && styles.iconBtnActive]}
            onPress={() => setStatusFilter('Completed')}
          >
            <Text
              style={[
                styles.iconBtnText,
                statusFilter === 'Completed' && styles.iconBtnTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, statusFilter === 'Cancelled' && styles.iconBtnActive]}
            onPress={() => setStatusFilter('Cancelled')}
          >
            <Text
              style={[
                styles.iconBtnText,
                statusFilter === 'Cancelled' && styles.iconBtnTextActive,
              ]}
            >
              Cancelled
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.exportBtn, exporting && styles.exportBtnDisabled]}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="download" size={16} color="#fff" />
                <Text style={styles.exportText}>Export</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Table header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableHeader}>
            <Text style={[styles.th, { width: 50 }]}>SR#</Text>
            <Text style={[styles.th, { width: 180 }]}>PROJECT NAME</Text>
            <Text style={[styles.th, { width: 120 }]}>START DATE</Text>
            <Text style={[styles.th, { width: 120 }]}>END DATE</Text>
            <Text style={[styles.th, { width: 130 }]}>STATUS</Text>
            <Text style={[styles.th, { width: 100 }]}>PRIORITY</Text>
            <Text style={[styles.th, { width: 100 }]}>ACTIONS</Text>
          </View>
        </ScrollView>

        {/* Rows */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {projects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {search || statusFilter ? 'No projects match your filters.' : 'No projects available.'}
                </Text>
              </View>
            ) : (
              projects.map((p, index) => (
                <View key={p._id} style={styles.tr}>
                  <Text style={[styles.td, { width: 50 }]}>{(page - 1) * PAGE_SIZE + index + 1}</Text>
                  <TouchableOpacity
                    style={[styles.td, { width: 180 }]}
                    activeOpacity={0.7}
                    onPress={() => handleProjectPress(p)}
                  >
                    <Text style={styles.tdText} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                  <Text style={[styles.td, { width: 120 }]}>{formatDate(p.startDate)}</Text>
                  <Text style={[styles.td, { width: 120 }]}>{formatDate(p.endDate)}</Text>
                  <View style={[styles.badge, { width: 130 }]}>
                    <StatusBadge status={p.status} size="small" />
                  </View>
                  <View style={[styles.badge, { width: 100 }]}>
                    <PriorityBadge priority={p.priority} variant="outlined" vertical={false} />
                  </View>
                  <View style={[styles.actionsColumn, { width: 100 }]}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        navigation.navigate('EditProject', { projectId: p._id, from: 'OrgProjects' });
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color="#f97316" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        Alert.alert(
                          'Delete Project',
                          `Are you sure you want to delete "${p.name}"?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                try {
                                  await callApi({
                                    method: 'DELETE',
                                    url: `/projects/${p._id}`,
                                  });
                                  Alert.alert('Success', 'Project deleted successfully');
                                  fetchProjects();
                                } catch (error: any) {
                                  Alert.alert('Error', error?.response?.data?.message || 'Failed to delete project');
                                }
                              },
                            },
                          ]
                        );
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]}
              onPress={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <Ionicons name="chevron-back" size={18} color={page === 1 ? '#9CA3AF' : '#111827'} />
              <Text style={[styles.pageButtonText, page === 1 && styles.pageButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <View style={styles.pageInfo}>
              <Text style={styles.pageInfoText}>
                Page {page} of {totalPages}
              </Text>
              <Text style={styles.pageInfoSubtext}>
                Showing {projects.length > 0 ? ((page - 1) * PAGE_SIZE) + 1 : 0}-{Math.min((page - 1) * PAGE_SIZE + projects.length, totalProjects)} of {totalProjects}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.pageButton, page >= totalPages && styles.pageButtonDisabled]}
              onPress={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
            >
              <Text style={[styles.pageButtonText, page >= totalPages && styles.pageButtonTextDisabled]}>
                Next
              </Text>
              <Ionicons name="chevron-forward" size={18} color={page >= totalPages ? '#9CA3AF' : '#111827'} />
            </TouchableOpacity>
        </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f97316',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  listCard: {
    margin: 15,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    minWidth: '40%',
  },
  searchInput: {
    flex: 1,
    color: '#111827',
    fontSize: 14,
  },
  iconBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  iconBtnActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  iconBtnText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  iconBtnTextActive: {
    color: '#fff',
  },
  exportBtn: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportBtnDisabled: {
    opacity: 0.6,
  },
  exportText: { color: '#fff', marginLeft: 6, fontWeight: '600', fontSize: 12 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
    marginTop: 8,
    minWidth: 800,
  },
  th: { fontSize: 11, color: '#374151', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minWidth: 800,
  },
  td: { 
    fontSize: 13, 
    color: '#374151',
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  tdText: {
    fontSize: 13,
    color: '#374151',
  },
  badge: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  actionsColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  pageButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F9FAFB',
  },
  pageButtonText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  pageButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pageInfo: {
    alignItems: 'center',
  },
  pageInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  pageInfoSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default OrgAdminProjectsScreen;


