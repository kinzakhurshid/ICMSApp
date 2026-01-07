import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import { exportToXlsx } from '../utills/utills';
import SearchableSelect from './SearchableSelect';

const LeaveTableSystem: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any | null>(null);

  // Mock data - replace with actual API call
  const mockLeaves = [
    {
      _id: '1',
      employee: { name: 'Mamoona Shabbir' },
      type: 'Sick',
      duration: '1 day',
      from: '2025-10-22',
      to: '2025-10-22',
      reason: 'Xyz',
      file: null,
      status: 'Approved',
    },
    {
      _id: '2',
      employee: { name: 'Fahad Ahmed' },
      type: 'Casual',
      duration: 'Second Half',
      from: '2025-10-22',
      to: '2025-10-22',
      reason: 'Due to some personal reason',
      file: null,
      status: 'Approved',
    },
    {
      _id: '3',
      employee: { name: 'Test Khan' },
      type: 'Casual',
      duration: '2 days',
      from: '2025-10-22',
      to: '2025-10-22',
      reason: 'kal ka half day chaye',
      file: null,
      status: 'Approved',
    },
    {
      _id: '4',
      employee: { name: 'Kinza Khurshid' },
      type: 'Sick',
      duration: '1 day',
      from: '2025-10-22',
      to: '2025-10-22',
      reason: 'I m having high fever from some da...',
      file: null,
      status: 'Approved',
    },
  ];

  useFocusEffect(
    React.useCallback(() => {
      loadLeaves();
    }, [])
  );

  useEffect(() => {
    loadLeaves();
  }, [page, limit, statusFilter, typeFilter]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadLeaves();
      } else {
        setPage(1); // Reset to first page when searching
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getEmployeeName = (leave: any): string => {
    // Try multiple possible locations/fields for employee name
    const emp =
      leave.employee ||
      leave.employeeId ||
      leave.EmployeeId || // API returns EmployeeId with capital E
      leave.emp ||
      leave.user ||
      {};
    const directName =
      leave.employeeName ||
      leave.employee_name ||
      leave.userName ||
      leave.username ||
      leave.name;

    const fullName =
      emp.fullName ||
      emp.full_name ||
      (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : undefined);

    return (
      emp.name ||
      fullName ||
      directName ||
      'N/A'
    );
  };

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortField: 'createdAt',
        sortOrder: 'desc',
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (typeFilter) {
        params.type = typeFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await callApi({
        method: 'GET',
        url: '/leave',
        params,
      });

      // Handle API response structure: { data: [], pagination: { total, totalPages } }
      let leavesData: any[] = [];
      if (Array.isArray(response?.data)) {
        leavesData = response.data;
        setTotal(response.pagination?.total || response.total || response.data.length);
      } else if (Array.isArray(response?.data?.data)) {
        leavesData = response.data.data;
        setTotal(response.data.pagination?.total || response.data.total || 0);
      } else if (Array.isArray(response)) {
        leavesData = response;
        setTotal(response.length);
      } else {
        leavesData = [];
        setTotal(0);
      }

      if (leavesData.length > 0) {
        console.log('Sample leave record:', JSON.stringify(leavesData[0], null, 2));
      }
      setLeaves(leavesData);
    } catch (error) {
      console.error('Error loading leaves:', error);
      setLeaves([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Search is handled by API, so we just use leaves directly
  const filteredLeaves = leaves;

  const handleSelectLeave = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(leaveId => leaveId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredLeaves.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeaves.map(leave => leave._id));
    }
  };

  const handleDeleteLeave = async (id: string) => {
    Alert.alert(
      'Delete Leave Record',
      'Are you sure you want to delete this leave record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await callApi({
                method: 'DELETE',
                url: `/leave/${id}`,
              });
              setLeaves(leaves.filter(leave => leave._id !== id));
              Alert.alert('Success', 'Leave record deleted successfully');
            } catch (error) {
              console.error('Error deleting leave:', error);
              Alert.alert('Error', 'Failed to delete leave record');
            }
          },
        },
      ]
    );
  };

  const handleApproveLeave = async (id: string) => {
    try {
      setProcessingStatus(id);
      await callApi({
        method: 'PUT',
        url: `/leave/${id}/status`,
        data: { status: 'Approved' },
      });
      setLeaves(leaves.map(leave =>
        leave._id === id ? { ...leave, status: 'Approved' } : leave
      ));
      Alert.alert('Success', 'Leave approved successfully');
    } catch (error) {
      console.error('Error approving leave:', error);
      Alert.alert('Error', 'Failed to approve leave');
    } finally {
      setProcessingStatus(null);
    }
  };

  const handleRejectLeave = async (id: string) => {
    Alert.alert(
      'Reject Leave',
      'Are you sure you want to reject this leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingStatus(id);
              await callApi({
                method: 'PUT',
                url: `/leave/${id}/status`,
                data: { status: 'Rejected' },
              });
              setLeaves(leaves.map(leave =>
                leave._id === id ? { ...leave, status: 'Rejected' } : leave
              ));
              Alert.alert('Success', 'Leave rejected successfully');
            } catch (error) {
              console.error('Error rejecting leave:', error);
              Alert.alert('Error', 'Failed to reject leave');
            } finally {
              setProcessingStatus(null);
            }
          },
        },
      ]
    );
  };

  const handleEditLeave = (leave: any) => {
    // Pass redirectTo so the edit screen knows where to go back explicitly
    (navigation as any).navigate('HREditLeave', { leaveId: leave._id, redirectTo: 'LeavesScreen' });
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      // Fetch all leaves for export
      const params: any = {
        page: 1,
        limit: 100000,
        sortField: 'createdAt',
        sortOrder: 'desc',
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (typeFilter) {
        params.type = typeFilter;
      }

      const response = await callApi({
        method: 'GET',
        url: '/leave',
        params,
      });

      let allLeaves: any[] = [];
      if (Array.isArray(response?.data)) {
        allLeaves = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        allLeaves = response.data.data;
      } else if (Array.isArray(response)) {
        allLeaves = response;
      }

      if (!allLeaves.length) {
        Alert.alert('Export', 'No leave records to export.');
        return;
      }

      await exportToXlsx({
        filename: `leaves-${new Date().toISOString().split('T')[0]}`,
        columns: [
          { key: 'sr', header: 'SR#' },
          { key: 'employeeName', header: 'Employee' },
          { key: 'type', header: 'Type' },
          { key: 'duration', header: 'Duration' },
          { key: 'from', header: 'From' },
          { key: 'to', header: 'To' },
          { key: 'reason', header: 'Reason' },
          { key: 'status', header: 'Status' },
        ],
        rows: allLeaves.map((leave, index) => ({
          sr: index + 1,
          employeeName: getEmployeeName(leave),
          type: leave.type || 'N/A',
          duration: leave.isHalfDay
            ? leave.halfDayType === 'first'
              ? 'First Half'
              : leave.halfDayType === 'second'
              ? 'Second Half'
              : 'Half Day'
            : typeof leave.duration === 'number'
            ? `${leave.duration} day${leave.duration === 1 ? '' : 's'}`
            : leave.duration || 'N/A',
          from: leave.startDate || leave.from || 'N/A',
          to: leave.endDate || leave.to || 'N/A',
          reason: leave.reason || 'N/A',
          status: leave.status || 'Pending',
        })),
      });
      Alert.alert('Success', 'Leave records exported successfully');
    } catch (error) {
      console.error('Failed to export leaves to XLSX:', error);
      Alert.alert('Export Error', 'Failed to export leave records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClick = (leave: any) => {
    setSelectedLeave(leave);
    setDetailVisible(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading leave records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Leave Records</Text>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search employees..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter-list" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Text style={styles.exportText}>Export All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => (navigation as any).navigate('HRCreateLeave', { redirectTo: 'LeavesScreen' })}
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <SearchableSelect
              label="Status"
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Rejected', label: 'Rejected' },
              ]}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              containerStyle={styles.filterSelect}
            />
            <SearchableSelect
              label="Leave Type"
              placeholder="All Types"
              options={[
                { value: '', label: 'All Types' },
                { value: 'Sick', label: 'Sick' },
                { value: 'Casual', label: 'Casual' },
                { value: 'Annual', label: 'Annual' },
                { value: 'Maternity', label: 'Maternity' },
                { value: 'Paternity', label: 'Paternity' },
                { value: 'Unpaid', label: 'Unpaid' },
              ]}
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
              containerStyle={styles.filterSelect}
            />
          </View>
        </View>
      )}

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <TouchableOpacity style={styles.checkboxHeader} onPress={handleSelectAll}>
              <Icon 
                name={selectedIds.length === filteredLeaves.length && filteredLeaves.length > 0 ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            <Text style={[styles.headerText, styles.srCol]}>#</Text>
            <Text style={[styles.headerText, styles.employeeCol]}>EMPLOYEE</Text>
            <Text style={[styles.headerText, styles.typeCol]}>TYPE</Text>
            <Text style={[styles.headerText, styles.durationCol]}>DURATION</Text>
            <Text style={[styles.headerText, styles.fromCol]}>FROM</Text>
            <Text style={[styles.headerText, styles.toCol]}>TO</Text>
            <Text style={[styles.headerText, styles.reasonCol]}>REASON</Text>
            <Text style={[styles.headerText, styles.fileCol]}>FILE</Text>
            <Text style={[styles.headerText, styles.statusCol]}>STATUS</Text>
            <Text style={[styles.headerText, styles.actionsCol]}>ACTIONS</Text>
          </View>

          {/* Table Rows */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Loading leaves...</Text>
            </View>
          ) : filteredLeaves.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No leave records found</Text>
            </View>
          ) : (
            filteredLeaves.map((leave, index) => (
              <TouchableOpacity
                key={leave._id}
                style={styles.tableRow}
                onPress={() => handleLeaveClick(leave)}
                activeOpacity={0.7}
              >
                <TouchableOpacity 
                  style={styles.checkboxCell}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleSelectLeave(leave._id);
                  }}
                >
                  <Icon 
                    name={selectedIds.includes(leave._id) ? "check-box" : "check-box-outline-blank"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                <Text style={[styles.cellText, styles.srCol]}>{(page - 1) * limit + index + 1}</Text>
                <Text style={[styles.cellText, styles.employeeCol]}>{getEmployeeName(leave)}</Text>
              <Text style={[styles.cellText, styles.typeCol]}>{leave.type || 'N/A'}</Text>
              <Text style={[styles.cellText, styles.durationCol]}>
                {leave.isHalfDay
                  ? leave.halfDayType === 'first'
                    ? 'First Half'
                    : leave.halfDayType === 'second'
                    ? 'Second Half'
                    : 'Half Day'
                  : typeof leave.duration === 'number'
                  ? `${leave.duration} day${leave.duration === 1 ? '' : 's'}`
                  : leave.duration || 'N/A'}
              </Text>
              <Text style={[styles.cellText, styles.fromCol]}>
                {formatDate(leave.startDate || leave.from)}
              </Text>
              <Text style={[styles.cellText, styles.toCol]}>
                {formatDate(leave.endDate || leave.to)}
              </Text>
              <Text style={[styles.cellText, styles.reasonCol]}>{leave.reason || 'N/A'}</Text>
              <Text style={[styles.cellText, styles.fileCol]}>{leave.file ? 'File' : '-'}</Text>
              
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        leave.status === 'Approved'
                          ? '#D4EDDA'
                          : leave.status === 'Rejected'
                          ? '#F8D7DA'
                          : '#FFF3CD',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          leave.status === 'Approved'
                            ? '#155724'
                            : leave.status === 'Rejected'
                            ? '#721C24'
                            : '#856404',
                      },
                    ]}
                  >
                    {leave.status || 'Pending'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsContainer}>
                {leave.status === 'Pending' ? (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleApproveLeave(leave._id);
                      }}
                      disabled={processingStatus === leave._id}
                    >
                      {processingStatus === leave._id ? (
                        <ActivityIndicator size="small" color="#4CAF50" />
                      ) : (
                        <Icon name="check" size={16} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRejectLeave(leave._id);
                      }}
                      disabled={processingStatus === leave._id}
                    >
                      {processingStatus === leave._id ? (
                        <ActivityIndicator size="small" color="#DC3545" />
                      ) : (
                        <Icon name="close" size={16} color="#DC3545" />
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditLeave(leave);
                      }}
                    >
                      <Icon name="edit" size={16} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteLeave(leave._id);
                      }}
                    >
                      <Icon name="delete" size={16} color="#DC3545" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableOpacity>
          ))
          )}
        </View>
      </ScrollView>

      {/* Pagination */}
      {!loading && total > 0 && (
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationInfo}>
            Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} of {total}
          </Text>
          <View style={styles.paginationButtons}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>
            <Text style={styles.paginationPageText}>
              Page {page} of {Math.ceil(total / limit) || 1}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, page >= Math.ceil(total / limit) && styles.paginationButtonDisabled]}
              onPress={() => setPage(prev => prev + 1)}
              disabled={page >= Math.ceil(total / limit) || total === 0}
            >
              <Text style={[styles.paginationButtonText, (page >= Math.ceil(total / limit) || total === 0) && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Leave Detail Modal */}
      {detailVisible && selectedLeave && (
        <Modal
          visible={detailVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setDetailVisible(false)}
        >
          <View style={styles.detailOverlay}>
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <Text style={styles.detailHeaderTitle}>Leave Details</Text>
                <TouchableOpacity onPress={() => setDetailVisible(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.detailScroll}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Employee:</Text>
                  <Text style={styles.detailValue}>{getEmployeeName(selectedLeave)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Leave Type:</Text>
                  <Text style={styles.detailValue}>{selectedLeave.type || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Start Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedLeave.startDate || selectedLeave.from)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>End Date:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedLeave.endDate || selectedLeave.to)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>
                    {selectedLeave.isHalfDay
                      ? selectedLeave.halfDayType === 'first'
                        ? 'First Half'
                        : selectedLeave.halfDayType === 'second'
                        ? 'Second Half'
                        : 'Half Day'
                      : typeof selectedLeave.duration === 'number'
                      ? `${selectedLeave.duration} day${selectedLeave.duration === 1 ? '' : 's'}`
                      : selectedLeave.duration || 'N/A'}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reason:</Text>
                  <Text style={styles.detailValue}>{selectedLeave.reason || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.detailStatusBadge, {
                    backgroundColor: selectedLeave.status === 'Approved' ? '#D4EDDA' : 
                                    selectedLeave.status === 'Rejected' ? '#F8D7DA' : '#FFF3CD'
                  }]}>
                    <Text style={[styles.detailStatusText, {
                      color: selectedLeave.status === 'Approved' ? '#155724' : 
                             selectedLeave.status === 'Rejected' ? '#721C24' : '#856404'
                    }]}>
                      {selectedLeave.status || 'Pending'}
                    </Text>
                  </View>
                </View>
                {selectedLeave.file && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Document:</Text>
                    <Text style={styles.detailValue}>File attached</Text>
                  </View>
                )}
              </ScrollView>
              <View style={styles.detailFooter}>
                <TouchableOpacity
                  style={styles.detailCloseButton}
                  onPress={() => setDetailVisible(false)}
                >
                  <Text style={styles.detailCloseText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exportText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#DC3545',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableScrollContainer: {
    maxHeight: 400,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableContainer: {
    minWidth: 1260,
    backgroundColor: 'white',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  checkboxHeader: {
    width: 40,
    alignItems: 'center',
  },
  srCol: { width: 50, alignItems: 'center' },
  employeeCol: { width: 150 },
  typeCol: { width: 100 },
  durationCol: { width: 120 },
  fromCol: { width: 120 },
  toCol: { width: 120 },
  reasonCol: { width: 200 },
  fileCol: { width: 80 },
  statusCol: { width: 100 },
  actionsCol: { width: 160 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  checkboxCell: {
    width: 40,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'center',
  },
  statusContainer: {
    width: 100,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
  approveButton: {
    backgroundColor: '#E8F5E9',
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
  },
  filtersContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  filterSelect: {
    flex: 1,
    minWidth: 150,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 4,
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
    backgroundColor: 'white',
    minWidth: 70,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationPageText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    minWidth: 100,
    textAlign: 'center',
    textAlign: 'center',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  detailScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  detailCloseButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  detailCloseText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
});

export default LeaveTableSystem;





