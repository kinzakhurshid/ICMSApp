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
import { useNavigation } from '@react-navigation/native';
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

  // Fetch all projects for the organization (super admin view)
  const fetchProjects = useCallback(async () => {
    try {
      console.log('🔶 [OrgAdminProjects] fetchProjects: starting request');
      setLoading(true);
      setError(null);

      const startedAt = Date.now();
      const response = await callApi({
        method: 'GET',
        url: '/projects?page=1&limit=1000&search=&status=',
      });

      console.log('🔶 [OrgAdminProjects] fetchProjects: raw response', JSON.stringify(response, null, 2));

      const success = (response as any)?.success;
      let rawProjects: any[] = [];

      if (Array.isArray((response as any)?.data)) {
        console.log('🔶 [OrgAdminProjects] fetchProjects: using response.data array');
        rawProjects = (response as any).data;
      } else if (Array.isArray((response as any)?.projects)) {
        console.log('🔶 [OrgAdminProjects] fetchProjects: using response.projects array');
        rawProjects = (response as any).projects;
      } else if (Array.isArray(response as any)) {
        console.log('🔶 [OrgAdminProjects] fetchProjects: using response as array directly');
        rawProjects = response as any;
      } else {
        console.log(
          '⚠️ [OrgAdminProjects] fetchProjects: response shape not recognized, defaulting to empty list',
        );
      }

      console.log(
        '🔶 [OrgAdminProjects] fetchProjects: success flag & rawProjects length',
        success,
        Array.isArray(rawProjects) ? rawProjects.length : 'not-array',
      );

      if (rawProjects && Array.isArray(rawProjects)) {
        setProjects(rawProjects as Project[]);
      } else {
        setProjects([]);
        setError('Invalid project data received from server');
        console.log('🔴 [OrgAdminProjects] Unexpected projects API shape for OrgAdmin:', response);
      }

      console.log(
        '✅ [OrgAdminProjects] fetchProjects: finished',
        JSON.stringify(
          {
            total: Array.isArray(rawProjects) ? rawProjects.length : 0,
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
    // We intentionally leave the dependency array empty so this only runs once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Filtered list based on search + status filter
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

  // KPI data derived from current list
  const totalProjects = projects.length;
  const inProgress = projects.filter((p) => p.status === 'In Progress').length;
  const completed = projects.filter((p) => p.status === 'Completed').length;
  const notStarted = projects.filter((p) => p.status === 'Not Started').length;

  const highPriority = projects.filter((p) => p.priority === 'High' || p.priority === 'Critical').length;

  const kpiData = useMemo(
    () => [
    { title: 'Total Projects', value: totalProjects, icon: 'grid-view', color: '#6b7280' },
      { title: 'In Progress', value: inProgress, icon: 'play-circle-outline', color: '#f97316' },
      { title: 'Completed', value: completed, icon: 'check-circle', color: '#22c55e' },
      { title: 'Not Started', value: notStarted, icon: 'pause-circle-outline', color: '#9ca3af' },
      { title: 'High Priority', value: highPriority, icon: 'priority-high', color: '#ef4444' },
    ],
    [totalProjects, inProgress, completed, notStarted, highPriority],
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

      if (!filteredProjects.length) {
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
        rows: filteredProjects.map((p, index) => ({
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
        <View style={styles.arrowRow}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => scrollBy(-1)}>
            <Text style={styles.arrowText}>{'<'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => scrollBy(1)}>
            <Text style={styles.arrowText}>{'>'}</Text>
          </TouchableOpacity>
        </View>
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
              placeholder="Search by name, description or manager..."
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
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>PROJECT NAME</Text>
          <Text style={[styles.th, { flex: 1 }]}>START DATE</Text>
          <Text style={[styles.th, { flex: 1 }]}>END DATE</Text>
          <Text style={[styles.th, { flex: 1 }]}>STATUS</Text>
          <Text style={[styles.th, { flex: 1 }]}>PRIORITY</Text>
        </View>

        {/* Rows */}
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {search || statusFilter ? 'No projects match your filters.' : 'No projects available.'}
            </Text>
          </View>
        ) : (
          filteredProjects.map((p) => (
            <TouchableOpacity
              key={p._id}
              style={styles.tr}
              activeOpacity={0.7}
              onPress={() => handleProjectPress(p)}
            >
              <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={[styles.td, { flex: 1 }]}>{formatDate(p.startDate)}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{formatDate(p.endDate)}</Text>
              <View style={[styles.badge, { flex: 1 }]}>
                <StatusBadge status={p.status} size="small" />
              </View>
              <View style={[styles.badge, { flex: 1 }]}>
                <PriorityBadge priority={p.priority} variant="outlined" vertical={false} />
              </View>
            </TouchableOpacity>
          ))
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
  arrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 16, color: '#6b7280' },
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
  },
  th: { fontSize: 12, color: '#374151', fontWeight: '700' },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  td: { fontSize: 13, color: '#374151' },
  badge: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});

export default OrgAdminProjectsScreen;


