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
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';
import { formatDate } from '../utills/utills';

const PAGE_SIZE = 10;

interface Accessory {
  _id: string;
  name: string;
  category: string;
  description: string;
}

interface EmployeeAccessory {
  _id: string;
  accessory: Accessory;
  conditionOnAssignment: string;
  status: 'issued' | 'returned' | 'lost';
  issuedDate: string;
}

interface EmployeeAccessoriesScreenProps {
  navigation: any;
}

const EmployeeAccessoriesScreen: React.FC<EmployeeAccessoriesScreenProps> = ({ navigation }) => {
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const [records, setRecords] = useState<EmployeeAccessory[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(true); // Start as true for initial load
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

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

      console.log('Fetching employee accessories with params:', params);
      const response = await callApi({
        method: 'GET',
        url: '/accessories/employee',
        params,
      });

      console.log('Employee accessories API response:', response);

      // Handle different response structures
      let data: EmployeeAccessory[] = [];
      let total = 0;

      if (response) {
        // Check if response has data property
        if (Array.isArray(response.data)) {
          data = response.data;
          total = response.totalItems || response.total || response.pagination?.total || data.length;
        } else if (Array.isArray(response)) {
          // Response is directly an array
          data = response;
          total = data.length;
        } else if (response.success !== false && response.data) {
          // Response has success and data
          data = Array.isArray(response.data) ? response.data : [];
          total = response.totalItems || response.total || response.pagination?.total || data.length;
        }
      }

      setRecords(data);
      setRecordsTotal(total);
      console.log('Employee accessories loaded:', data.length, 'Total:', total);
    } catch (error: any) {
      console.error('Employee accessories fetch error:', error);
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
  }, [page, search]); // Direct dependencies - fetchRecords uses these values

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

  const statusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      issued: { bg: '#DBEAFE', text: '#1D4ED8' },
      returned: { bg: '#DCFCE7', text: '#166534' },
      lost: { bg: '#FEE2E2', text: '#B91C1C' },
    };

    const config = statusConfig[status] || { bg: '#E5E7EB', text: '#374151' };
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Text style={[styles.statusText, { color: config.text }]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Text>
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
          <View>
            <Text style={styles.sectionTitle}>Employee Accessories</Text>
            <Text style={styles.sectionCaption}>
              View accessories assigned to you.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateAccessoryRequest')}
          >
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addButtonText}>Request</Text>
          </TouchableOpacity>
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
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 700 }}>
            <View style={styles.tableHead}>
              <Text style={[styles.headCell, { width: 150 }]}>NAME</Text>
              <Text style={[styles.headCell, { width: 120 }]}>CATEGORY</Text>
              <Text style={[styles.headCell, { width: 100 }]}>CONDITION</Text>
              <Text style={[styles.headCell, { width: 200 }]}>DESCRIPTION</Text>
              <Text style={[styles.headCell, { width: 100 }]}>STATUS</Text>
              <Text style={[styles.headCell, { width: 120 }]}>ISSUED DATE</Text>
            </View>
            {recordsLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FB923C" />
              </View>
            ) : records.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No accessories found.</Text>
              </View>
            ) : (
              records.map(record => (
                <View key={record._id} style={styles.tableRow}>
                  <Text style={[styles.cell, { width: 150 }]} numberOfLines={1}>
                    {record.accessory?.name || '-'}
                  </Text>
                  <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>
                    {record.accessory?.category || '-'}
                  </Text>
                  <Text style={[styles.cell, { width: 100 }]} numberOfLines={1}>
                    {record.conditionOnAssignment || '-'}
                  </Text>
                  <Text style={[styles.cell, { width: 200 }]} numberOfLines={2}>
                    {record.accessory?.description || '-'}
                  </Text>
                  <View style={[styles.cell, { width: 100 }]}>{statusBadge(record.status)}</View>
                  <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>
                    {formatDateDisplay(record.issuedDate)}
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FB923C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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

export default EmployeeAccessoriesScreen;

