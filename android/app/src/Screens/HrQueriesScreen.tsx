import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import { fetchOrgQueries } from '../Services/queries';
import { OrgQuery } from '../types/queries';

const PAGE_SIZE = 10;

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  'In Progress': { bg: '#DBEAFE', text: '#1D4ED8' },
  Noted: { bg: '#FEE2E2', text: '#B91C1C' },
  Solved: { bg: '#DCFCE7', text: '#166534' },
};

const statusOptions = ['All', 'Pending', 'Noted', 'Solved', 'In Progress'];

const HrQueriesScreen: React.FC = () => {
  const token = useSelector((state: RootState) => state.user.token) || '';

  const [records, setRecords] = useState<OrgQuery[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      return d.toLocaleDateString();
    } catch {
      return value;
    }
  };

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setRecordsLoading(true);
    try {
      const response = await fetchOrgQueries({
        token,
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
      });

      setRecords(response.data || []);
      setRecordsTotal(response.total || 0);
    } catch (error) {
      console.log('Org queries fetch error', error);
    } finally {
      setRecordsLoading(false);
    }
  }, [token, page, search, statusFilter]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroInfo}>
          <Text style={styles.heroBadge}>HR Management Dashboard</Text>
          <Text style={styles.heroTitle}>Query Management</Text>
          <Text style={styles.heroSubtitle}>
            Monitor and resolve organization-wide queries with real-time tracking and status insights.
          </Text>
        </View>
        <TouchableOpacity style={styles.heroAction}>
          <Feather name="download-cloud" size={16} color="#fff" />
          <Text style={styles.heroActionText}>Download Trackwise</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <View>
            <Text style={styles.sectionTitle}>Organization Complaints</Text>
            <Text style={styles.sectionCaption}>
              Review submitted complaints, track their resolution state, and follow up promptly.
            </Text>
          </View>
        </View>

        <View style={styles.toolbar}>
          <TextInput
            value={search}
            onChangeText={text => {
              setSearch(text);
              setPage(1);
            }}
            placeholder="Search…"
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
          />
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
          <View style={{ minWidth: 820 }}>
            <View style={styles.tableHead}>
              <Text style={[styles.headCell, { width: 240 }]}>SUBJECT</Text>
              <Text style={[styles.headCell, { width: 220 }]}>EMPLOYEE NAME</Text>
              <Text style={[styles.headCell, { width: 200 }]}>DESIGNATION</Text>
              <Text style={[styles.headCell, { width: 140 }]}>STATUS</Text>
              <Text style={[styles.headCell, { width: 140 }]}>CREATED ON</Text>
            </View>
            {recordsLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FB923C" />
              </View>
            ) : records.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No complaints found.</Text>
              </View>
            ) : (
              records.map(record => (
                <View key={record._id} style={styles.tableRow}>
                  <Text style={[styles.cell, { width: 240 }]} numberOfLines={1}>
                    {record.subject || '-'}
                  </Text>
                  <Text style={[styles.cell, { width: 220 }]} numberOfLines={1}>
                    {record.employeeId?.fullName ||
                      [record.employeeId?.firstName, record.employeeId?.lastName].filter(Boolean).join(' ') ||
                      'N/A'}
                  </Text>
                  <Text style={[styles.cell, { width: 200 }]} numberOfLines={1}>
                    {record.employeeId?.position || record.employeeId?.designation || '-'}
                  </Text>
                  <View style={[styles.cell, { width: 140 }]}>{statusBadge(record.status)}</View>
                  <Text style={[styles.cell, { width: 140 }]} numberOfLines={1}>
                    {formatDate(record.createdAt)}
                  </Text>
                </View>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, gap: 18, paddingBottom: 32 },
  heroCard: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#00000030',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroInfo: {
    flex: 1,
    paddingRight: 16,
  },
  heroBadge: {
    color: '#FFE8D9',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#FFE8D9',
    lineHeight: 20,
  },
  heroAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    gap: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flexGrow: 1,
    minWidth: 160,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    color: '#111827',
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
  },
  cell: { fontSize: 13, color: '#374151' },
  loadingRow: { paddingVertical: 40, alignItems: 'center' },
  emptyRow: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  pageBtnText: { color: '#FB923C', fontWeight: '600' },
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

export default HrQueriesScreen;



