import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import { fetchOrgQueries } from '../Services/queries';
import { OrgQuery } from '../types/queries';
import useAxios from '../hooks/useAxios';

const PAGE_SIZE = 10;

const statusColors: Record<string, { bg: string; text: string }> = {
  Pending: { bg: '#FEF3C7', text: '#92400E' },
  Noted: { bg: '#FEE2E2', text: '#B91C1C' },
  Solved: { bg: '#DCFCE7', text: '#166534' },
};

const statusOptions = ['All', 'Pending', 'Noted', 'Solved'];

const HrQueriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.user.token) || '';
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { callApi } = useAxios();
  
  // Get user role
  const userRole = (currentUser as any)?.role || '';
  const isHR = userRole === 'HR' || userRole === 'hr';
  const isOrgAdmin = ['ORG_ADMIN', 'OrgAdmin', 'org_admin', 'Org Admin', 'ORGADMIN', 'orgadmin', 'ORG'].includes(userRole.toString());
  
  // Helper function to check if query can be deleted
  const canDeleteQuery = (query: OrgQuery): { canDelete: boolean; reason?: string } => {
    // HR and OrgAdmin cannot delete queries
    if (isHR || isOrgAdmin) {
      return { 
        canDelete: false, 
        reason: 'HR and Organization Admin users cannot delete queries. You can only mark them as "Solved".' 
      };
    }
    
    // Check if status is "Pending"
    if (query.status !== 'Pending') {
      return { 
        canDelete: false, 
        reason: `Cannot delete query. Only queries with status "Pending" can be deleted. Current status: "${query.status || 'Unknown'}".` 
      };
    }
    
    // Check user role - only EMP and PM can delete
    const isEMP = userRole === 'EMP' || userRole === 'emp' || userRole === 'Employee' || userRole === 'employee';
    const isPM = userRole === 'PM' || userRole === 'pm';
    
    if (!isEMP && !isPM) {
      return { 
        canDelete: false, 
        reason: `Your role (${userRole}) does not have permission to delete queries. Only Employees (EMP) and Project Managers (PM) can delete queries.` 
      };
    }
    
    // Note: Creator check is handled by the API, but we can add a client-side check if needed
    // For HR screen, we typically don't show delete for queries created by others anyway
    
    return { canDelete: true };
  };

  const [records, setRecords] = useState<OrgQuery[]>([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const updateQueryStatus = async (queryId: string, newStatus: string) => {
    try {
      // Validate status value (only Pending, Noted, Solved are allowed)
      const validStatuses = ['Pending', 'Noted', 'Solved'];
      if (!validStatuses.includes(newStatus)) {
        Alert.alert('Error', `Invalid status. Allowed values: ${validStatuses.join(', ')}`);
        return;
      }
      
      // Use PATCH method as per API documentation: PATCH /query/:id/status
      await callApi({
        method: 'PATCH',
        url: `/query/${queryId}/status`,
        data: { status: newStatus },
      });
      
      Alert.alert('Success', 'Query status updated successfully');
      fetchRecords();
    } catch (error: any) {
      console.error('Update query status error:', error);
      const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.error ||
                           error?.message ||
                           'Failed to update query status';
      Alert.alert('Error', errorMessage);
    }
  };

  const addComment = async (queryId: string, comment: string) => {
    try {
      // Use 'text' field as per API documentation: POST /query/:id/comment with body { text: string }
      await callApi({
        method: 'POST',
        url: `/query/${queryId}/comment`,
        data: { text: comment.trim() },
      });
      Alert.alert('Success', 'Comment added successfully');
      fetchRecords();
    } catch (error: any) {
      console.error('Add comment error:', error);
      const errorMessage = error?.response?.data?.message || 
                           error?.response?.data?.error ||
                           error?.message ||
                           'Failed to add comment';
      Alert.alert('Error', errorMessage);
    }
  };

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

  // Refresh records when screen comes into focus (e.g., when navigating back from detail screen)
  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [fetchRecords])
  );

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
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <View>
            <Text style={styles.sectionTitle}>Queries</Text>
            <Text style={styles.sectionCaption}>
              Review employee queries, track their resolution status, and follow up promptly.
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
          <View style={{ minWidth: 940 }}>
            <View style={styles.tableHead}>
              <Text style={[styles.headCell, { width: 240 }]}>SUBJECT</Text>
              <Text style={[styles.headCell, { width: 220 }]}>EMPLOYEE NAME</Text>
              <Text style={[styles.headCell, { width: 200 }]}>DESIGNATION</Text>
              <Text style={[styles.headCell, { width: 140 }]}>STATUS</Text>
              <Text style={[styles.headCell, { width: 140 }]}>CREATED ON</Text>
              <Text style={[styles.headCell, { width: 120 }]}>ACTIONS</Text>
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
                  <TouchableOpacity 
                    style={styles.tableRowContent}
                    onPress={() => {
                      // Navigate to query detail screen and ensure back returns here
                      (navigation as any).navigate('QueryDetail', {
                        queryId: record._id,
                        query: record,
                        redirectTo: 'HRQueries',
                      });
                    }}
                    activeOpacity={0.7}
                  >
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
                  </TouchableOpacity>
                  <View style={[styles.cell, { width: 120, flexDirection: 'row', gap: 8 }]}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => {
                        (navigation as any).navigate('QueryDetail', {
                          queryId: record._id,
                          query: record,
                          redirectTo: 'HRQueries',
                        });
                      }}
                    >
                      <Feather name="edit" size={16} color="#3B82F6" />
                    </TouchableOpacity>
                    {(() => {
                      const deleteCheck = canDeleteQuery(record);
                      if (!deleteCheck.canDelete) {
                        // Hide delete button for HR/OrgAdmin or show disabled state
                        if (isHR || isOrgAdmin) {
                          return null; // Don't show delete button for HR/OrgAdmin
                        }
                        // For other roles, show disabled button with tooltip
                        return (
                          <TouchableOpacity
                            style={[styles.actionButton, styles.actionButtonDisabled]}
                            onPress={() => {
                              Alert.alert(
                                'Cannot Delete Query',
                                deleteCheck.reason || 'This query cannot be deleted.',
                                [{ text: 'OK', style: 'default' }]
                              );
                            }}
                          >
                            <Feather name="trash-2" size={16} color="#9CA3AF" />
                          </TouchableOpacity>
                        );
                      }
                      
                      // Show active delete button
                      return (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => {
                            Alert.alert(
                              'Delete Query',
                              'Are you sure you want to delete this query? This action cannot be undone.',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    try {
                                      if (!token) {
                                        Alert.alert('Error', 'Authentication token is missing. Please login again.');
                                        return;
                                      }
                                      
                                      // Double-check status before deletion
                                      if (record.status !== 'Pending') {
                                        Alert.alert(
                                          'Cannot Delete',
                                          `This query cannot be deleted because its status is "${record.status}". Only queries with status "Pending" can be deleted.`
                                        );
                                        return;
                                      }
                                      
                                      const response = await callApi({
                                        method: 'DELETE',
                                        url: `/query/${record._id}`,
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                        },
                                      });
                                      
                                      // Check if deletion was successful
                                      const isSuccess = response?.success !== false && 
                                                       (response?.message || 
                                                        response?.data?.message || 
                                                        response?.status !== 'error');
                                      
                                      if (isSuccess || response === undefined) {
                                        // Remove from local state immediately
                                        setRecords(prev => prev.filter(r => r._id !== record._id));
                                        setRecordsTotal(prev => Math.max(0, prev - 1));
                                        
                                        // Refresh the list to ensure consistency
                                        await fetchRecords();
                                        
                                        Alert.alert('Success', 'Query deleted successfully');
                                      } else {
                                        throw new Error(response?.message || 'Delete operation failed');
                                      }
                                    } catch (error: any) {
                                      console.error('Delete query error:', error);
                                      let errorMessage = 'Failed to delete query';
                                      
                                      if (error?.response?.status === 403) {
                                        const apiMessage = error?.response?.data?.message || error?.response?.data?.error;
                                        if (apiMessage) {
                                          errorMessage = apiMessage;
                                        } else {
                                          errorMessage = 'You do not have permission to delete this query. Only queries with status "Pending" can be deleted, and only by the creator with EMP or PM role.';
                                        }
                                      } else {
                                        errorMessage = error?.response?.data?.message || 
                                                       error?.response?.data?.error ||
                                                       error?.message ||
                                                       'Failed to delete query';
                                      }
                                      
                                      Alert.alert('Error', errorMessage);
                                    }
                                  },
                                },
                              ]
                            );
                          }}
                        >
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      );
                    })()}
                  </View>
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
  tableRowContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  cell: { fontSize: 13, color: '#374151' },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  loadingRow: { paddingVertical: 40, alignItems: 'center' },
  emptyRow: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  footerText: { color: '#6B7280', fontSize: 12, flexShrink: 1 },
  pagination: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FB923C',
    minWidth: 60,
    alignItems: 'center',
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



