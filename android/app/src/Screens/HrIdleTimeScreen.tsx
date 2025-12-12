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
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import {
  deleteIdleTimeRecord,
  fetchIdleTimeMetrics,
  fetchIdleTimePresets,
  fetchIdleTimes,
} from '../Services/idleTime';
import { IdleTimeMetrics, IdleTimePreset, IdleTimeRecord } from '../types/idleTime';
import IdleMetricCard from '../components/IdleMetricCard';
import IdleTimeChart, { IdleChartPoint } from '../components/IdleTimeChart';
import IdleTimePresetsCard from '../components/IdleTimePresetsCard';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const HrIdleTimeScreen: React.FC = () => {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.user.token) || '';

  const [metrics, setMetrics] = useState<IdleTimeMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const [records, setRecords] = useState<IdleTimeRecord[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [presets, setPresets] = useState<IdleTimePreset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);

  const [chartData, setChartData] = useState<IdleChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  const fetchMetrics = useCallback(async () => {
    if (!token) return;
    setMetricsLoading(true);
    try {
      const data = await fetchIdleTimeMetrics(token);
      if (data) setMetrics(data);
    } catch (error) {
      console.log('Idle metrics error', error);
    } finally {
      setMetricsLoading(false);
    }
  }, [token]);

  const fetchPresets = useCallback(async () => {
    if (!token) return;
    setPresetsLoading(true);
    try {
      const data = await fetchIdleTimePresets(token);
      setPresets(data || []);
    } catch (error) {
      console.log('Idle presets error', error);
    } finally {
      setPresetsLoading(false);
    }
  }, [token]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setRecordsLoading(true);
    try {
      const response = await fetchIdleTimes({
        page,
        limit: pageSize,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        token,
      });
      setRecords(response.data || []);
      setRecordsTotal(response.total || 0);
    } catch (error) {
      console.log('Idle records error', error);
    } finally {
      setRecordsLoading(false);
    }
  }, [token, page, pageSize, search, startDate, endDate]);

  const fetchChart = useCallback(async () => {
    if (!token) return;
    setChartLoading(true);
    try {
      const response = await fetchIdleTimes({
        page: 1,
        limit: 500,
        search: search.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        token,
      });

      const aggregate = new Map<string, number>();
      response.data?.forEach(record => {
        const firstName = record.employeeId?.firstName || '';
        const lastName = record.employeeId?.lastName || '';
        const fullName =
          record.employeeId?.fullName ||
          [firstName, lastName].filter(Boolean).join(' ') ||
          'Unknown Employee';

        const [sh, sm] = (record.startTime || '00:00').split(':').map(Number);
        const [eh, em] = (record.endTime || '00:00').split(':').map(Number);
        const duration = Math.max(0, eh * 60 + em - (sh * 60 + sm)) / 60;

        aggregate.set(fullName, (aggregate.get(fullName) || 0) + duration);
      });

      const formatted = Array.from(aggregate.entries()).map(([label, value]) => ({
        label,
        value: Number(value.toFixed(2)),
      }));

      setChartData(formatted);
    } catch (error) {
      console.log('Idle chart error', error);
    } finally {
      setChartLoading(false);
    }
  }, [token, search, startDate, endDate]);

  useEffect(() => {
    fetchMetrics();
    fetchPresets();
  }, [fetchMetrics, fetchPresets]);

  useEffect(() => {
    fetchRecords();
    fetchChart();
  }, [fetchRecords, fetchChart]);

  const handleDelete = async (recordId: string) => {
    if (!token) return;
    try {
      const success = await deleteIdleTimeRecord(recordId, token);
      if (success) {
        fetchRecords();
        fetchChart();
      }
    } catch (error) {
      console.log('Delete idle record error', error);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(recordsTotal / pageSize)), [recordsTotal, pageSize]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <IdleMetricCard
            title="Total Records"
            value={metrics?.totalRecords ?? 0}
            loading={metricsLoading}
            icon={<Feather name="bar-chart-2" size={20} color="#FB923C" />}
          />
        </View>
        <View style={styles.metricCard}>
          <IdleMetricCard
            title="Total Idle Hours"
            value={`${metrics?.totalHours ?? 0} hrs`}
            loading={metricsLoading}
            icon={<Feather name="clock" size={20} color="#FB923C" />}
          />
        </View>
        <View style={styles.metricCard}>
          <IdleMetricCard
            title="Avg Hours / Employee"
            value={`${metrics?.avgPerEmployee ?? 0} hrs`}
            loading={metricsLoading}
            icon={<Feather name="users" size={20} color="#FB923C" />}
          />
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>
            {startDate && endDate
              ? `Idle Hours by Employee (${startDate} → ${endDate})`
              : 'Idle Hours by Employee (Last 7 Days)'}
          </Text>
          <Text style={styles.sectionCaption}>Track cumulative idle hours for each employee across the selected range.</Text>
        </View>
        {chartLoading ? (
          <View style={styles.chartLoading}>
            <ActivityIndicator color="#FB923C" />
          </View>
        ) : (
          <IdleTimeChart title="" data={chartData} />
        )}
      </View>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitle}>Idle Time Records</Text>
            <TouchableOpacity 
              style={styles.addIdleTimeButton}
              onPress={() => (navigation as any).navigate('AddIdleTime')}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.addIdleTimeText}>Add Idle Time</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerActions}>
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
        </View>

        {showFilters && (
          <View style={styles.filterPanel}>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>Start Date</Text>
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={text => {
                  setStartDate(text);
                  setPage(1);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={styles.filterField}>
              <Text style={styles.filterLabel}>End Date</Text>
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={text => {
                  setEndDate(text);
                  setPage(1);
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setStartDate('');
                setEndDate('');
                setPage(1);
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 820 }}>
            <View style={styles.tableHead}>
              <Text style={[styles.headCell, { width: 220 }]}>EMPLOYEE</Text>
              <Text style={[styles.headCell, { width: 140 }]}>DATE</Text>
              <Text style={[styles.headCell, { width: 120 }]}>START</Text>
              <Text style={[styles.headCell, { width: 120 }]}>END</Text>
              <Text style={[styles.headCell, { width: 260 }]}>REASON</Text>
              <Text style={[styles.headCell, { width: 100 }]}>ACTIONS</Text>
            </View>
            {recordsLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FB923C" />
              </View>
            ) : records.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No idle time records found</Text>
              </View>
            ) : (
              records.map(record => (
                <View key={record._id} style={styles.tableRow}>
                  <Text style={[styles.cell, { width: 220 }]} numberOfLines={1}>
                    {record.employeeId?.fullName ||
                      [record.employeeId?.firstName, record.employeeId?.lastName].filter(Boolean).join(' ') ||
                      'N/A'}
                  </Text>
                  <Text style={[styles.cell, { width: 140 }]}>{formatDate(record.date)}</Text>
                  <Text style={[styles.cell, { width: 120 }]}>{record.startTime || '-'}</Text>
                  <Text style={[styles.cell, { width: 120 }]}>{record.endTime || '-'}</Text>
                  <Text style={[styles.cell, { width: 260 }]} numberOfLines={1}>
                    {record.reason || '-'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.cell, styles.deleteCell, { width: 100 }]}
                    onPress={() => handleDelete(record._id)}
                  >
                    <Feather name="trash-2" size={16} color="#EF4444" />
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.tableFooter}>
          <Text style={styles.footerText}>
            Showing {(records.length && (page - 1) * pageSize + 1) || 0}-
            {(page - 1) * pageSize + records.length} of {recordsTotal} entries
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
              Page {page} of {totalPages}
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

      <Text style={styles.sectionTitle}>Idle Time Presets</Text>
      {presetsLoading ? (
        <View style={styles.chartLoading}>
          <ActivityIndicator color="#FB923C" />
        </View>
      ) : (
        <IdleTimePresetsCard data={presets} />
      )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 18, paddingBottom: 32 },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flexBasis: '32%',
    minWidth: 200,
    flexGrow: 1,
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
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    width: 180,
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FB923C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIdleTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FB923C',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addIdleTimeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  filterPanel: {
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    gap: 12,
  },
  filterField: { width: 160 },
  filterLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 6 },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#111827',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FB923C',
  },
  clearText: { color: '#FB923C', fontWeight: '600' },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  headCell: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cell: { fontSize: 13, color: '#374151' },
  deleteCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteText: { color: '#EF4444', fontWeight: '600' },
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
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 20,
    gap: 12,
  },
  chartHeader: {
    gap: 6,
  },
  sectionCaption: {
    fontSize: 13,
    color: '#6B7280',
  },
  chartLoading: { paddingVertical: 20, alignItems: 'center' },
});

export default HrIdleTimeScreen;


