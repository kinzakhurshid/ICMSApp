import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';
import { formatDate } from '../utills/utills';

const PAGE_SIZE = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  'In Progress': { bg: '#DBEAFE', text: '#1D4ED8' },
  Noted: { bg: '#FEE2E2', text: '#B91C1C' },
  Solved: { bg: '#DCFCE7', text: '#166534' },
};

const statusOptions = ['All', 'Pending', 'Noted', 'Solved', 'In Progress'];

interface Query {
  _id: string;
  subject?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  lastWorkingDate?: string;
}

interface EmployeeQueriesScreenProps {
  navigation: any;
}

const EmployeeQueriesScreen: React.FC<EmployeeQueriesScreenProps> = ({ navigation }) => {
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const [records, setRecords] = useState<Query[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(true); // Start as true for initial load
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const formatDateDisplay = (value?: string) => {
    if (!value) return '-';
    try {
      return formatDate(value);
    } catch {
      return value;
    }
  };

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const params: any = {
        page,
        limit: PAGE_SIZE,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter !== 'All') {
        params.status = statusFilter;
      }

      console.log('Fetching queries with params:', params);
      const response = await callApi({
        method: 'GET',
        url: '/query',
        params,
      });

      console.log('Queries API response:', response);

      // Handle different response structures
      let data: Query[] = [];
      let total = 0;

      if (response) {
        // Check if response has data property
        if (Array.isArray(response.data)) {
          data = response.data;
          total = response.total || response.pagination?.total || response.totalItems || data.length;
        } else if (Array.isArray(response)) {
          // Response is directly an array
          data = response;
          total = data.length;
        } else if (response.success !== false && response.data) {
          // Response has success and data
          data = Array.isArray(response.data) ? response.data : [];
          total = response.total || response.pagination?.total || response.totalItems || data.length;
        }
      }

      setRecords(data);
      setRecordsTotal(total);
      console.log('Queries loaded:', data.length, 'Total:', total);
    } catch (error: any) {
      console.error('Queries fetch error:', error);
      console.error('Error details:', error?.response?.data || error?.message);
      setRecords([]);
      setRecordsTotal(0);
    } finally {
      setRecordsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]); // Direct dependencies - fetchRecords uses these values

  const onRefresh = async () => {
    setRefreshing(true);
    const currentPage = page;
    setPage(1);
    // If already on page 1, manually trigger fetch
    if (currentPage === 1) {
      await fetchRecords();
    }
    // Otherwise useEffect will trigger when page changes
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil((recordsTotal || 0) / PAGE_SIZE)), [recordsTotal]);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const statusBadge = (status?: string) => {
    if (!status) {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#E5E7EB' }]}>
          <Text style={[styles.statusText, { color: '#374151' }]}>Unknown</Text>
        </View>
      );
    }

    const stylesForStatus = statusColors[status] || { bg: '#E5E7EB', text: '#374151' };
    return (
      <View style={[styles.statusBadge, { backgroundColor: stylesForStatus.bg }]}>
        <Text style={[styles.statusText, { color: stylesForStatus.text }]}>{status}</Text>
      </View>
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.sectionTitle}>My Queries</Text>
            <Text style={styles.sectionCaption}>
              View and manage your submitted queries and complaints.
            </Text>
          </View>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.searchContainer}>
            <Feather name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              value={search}
              onChangeText={text => {
                setSearch(text);
                setPage(1);
              }}
              placeholder="Search..."
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(prev => !prev)}>
            <Feather name="filter" size={18} color="#FB923C" />
            <Text style={styles.filterText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filterPanel}>
            {statusOptions.map(option => {
              const active = (option === 'All' && statusFilter === 'All') || statusFilter === option;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => {
                    setStatusFilter(option);
                    setPage(1);
                  }}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 600 }}>
            <View style={styles.tableHead}>
              <Text style={[styles.headCell, { width: 200 }]}>SUBJECT</Text>
              <Text style={[styles.headCell, { width: 120 }]}>STATUS</Text>
              <Text style={[styles.headCell, { width: 140 }]}>CREATED ON</Text>
              <Text style={[styles.headCell, { width: 140 }]}>LAST WORKING DATE</Text>
            </View>
            {recordsLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FB923C" />
              </View>
            ) : records.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No queries found.</Text>
              </View>
            ) : (
              records.map(record => (
                <TouchableOpacity
                  key={record._id}
                  style={styles.tableRow}
                  onPress={() => {
                    // Navigate to query detail or task detail
                    // For now, navigate to CreateQuery with query data for viewing
                    // You can create a QueryDetailScreen later if needed
                    navigation.navigate('CreateQuery', { queryId: record._id, viewMode: true });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cell, { width: 200 }]} numberOfLines={1}>
                    {record.subject || '-'}
                  </Text>
                  <View style={[styles.cell, { width: 120 }]}>{statusBadge(record.status)}</View>
                  <Text style={[styles.cell, { width: 140 }]} numberOfLines={1}>
                    {formatDateDisplay(record.createdAt)}
                  </Text>
                  <Text style={[styles.cell, { width: 140 }]} numberOfLines={1}>
                    {formatDateDisplay(record.lastWorkingDate)}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.tableFooter}>
          <Text style={styles.footerText}>
            Showing {(records.length && (page - 1) * PAGE_SIZE + 1) || 0}-
            {(page - 1) * PAGE_SIZE + records.length} of {recordsTotal} entries
          </Text>
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, !canPrev && styles.pageBtnDisabled]}
              disabled={!canPrev}
              onPress={() => setPage(prev => Math.max(1, prev - 1))}
            >
              <Text style={[styles.pageBtnText, !canPrev && styles.pageBtnTextDisabled]}>Prev</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              Page {Math.min(page, totalPages)} of {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageBtn, !canNext && styles.pageBtnDisabled]}
              disabled={!canNext}
              onPress={() => setPage(prev => Math.min(totalPages, prev + 1))}
            >
              <Text style={[styles.pageBtnText, !canNext && styles.pageBtnTextDisabled]}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateQuery')}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 18, paddingBottom: 100 }, // Extra padding for FAB
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 14,
  },
  tableHeader: {
    marginBottom: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sectionCaption: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FB923C',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    minWidth: 160,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    color: '#111827',
    fontSize: 14,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FB923C',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterText: { color: '#FB923C', fontWeight: '600', fontSize: 13 },
  filterPanel: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  filterChipActive: {
    backgroundColor: '#F97316',
  },
  filterChipText: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  headCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  cell: { fontSize: 13, color: '#374151' },
  loadingRow: { paddingVertical: 40, alignItems: 'center' },
  emptyRow: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerText: { color: '#6B7280', fontSize: 12 },
  pagination: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FB923C',
  },
  pageBtnDisabled: {
    borderColor: '#E5E7EB',
  },
  pageBtnText: { color: '#FB923C', fontWeight: '600', fontSize: 13 },
  pageBtnTextDisabled: { color: '#9CA3AF' },
  pageIndicator: { fontSize: 13, color: '#111827' },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EmployeeQueriesScreen;

