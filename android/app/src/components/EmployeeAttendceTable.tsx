import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import useAxios from '../hooks/useAxios';
import { RootState } from '../states/store';  
import { formatTimeForDisplay } from '../utills/utills';
interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: string;
}

const EmployeeAttendanceTable = () => {
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = async (pageNum: number = page) => {
    setLoading(true);
    try {
      const res = await callApi({
        method: 'GET',
        url: '/attendance/employee',
        params: {
          page: pageNum,
          limit: limit,
          sortBy: '-date',
        },
      });

      console.log('My Attendance API raw response:', JSON.stringify(res, null, 2));

      // Web contract for My Attendance:
      // { success, data: AttendanceRecord[], pagination? }
      const success = (res as any)?.success;
      const records: AttendanceRecord[] = success && Array.isArray((res as any)?.data)
        ? (res as any).data
        : Array.isArray((res as any))
          ? (res as any)
          : [];

      // Extract pagination info
      const pagination = (res as any)?.pagination;
      if (pagination) {
        setTotalPages(pagination.totalPages || Math.ceil((pagination.total || records.length) / limit));
        setTotal(pagination.total || records.length);
      } else {
        // If no pagination object, calculate from data length
        // For now, assume all records are loaded if no pagination info
        setTotalPages(1);
        setTotal(records.length);
      }

      setData(records);
      
      // Check today's record (only on first page load)
      if (pageNum === 1) {
        const today = new Date().toISOString().split('T')[0];
        const todayRec = records.find(
          (r: AttendanceRecord) => new Date(r.date).toISOString().split('T')[0] === today
        );
        setTodayRecord(todayRec || null);
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance once user is available (matches PM web behavior)
  useEffect(() => {
    if (!currentUser) return;
    fetchData(1);
  }, [currentUser]);

  // Refetch data when page changes
  useEffect(() => {
    if (!currentUser) return;
    fetchData(page);
  }, [page]);

  const handleCheckIn = async () => {
    Alert.alert(
      'Check In',
      'Please mark your attendance from Trackwise desktop application'
    );
  };

  const handleCheckOut = async () => {
    Alert.alert(
      'Check Out',
      'Please mark your attendance from Trackwise desktop application'
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return { bg: '#DCFCE7', text: '#166534' };
      case 'Absent': return { bg: '#FECACA', text: '#991B1B' };
      case 'Half-day': return { bg: '#FEF3C7', text: '#92400E' };
      default: return { bg: '#DBEAFE', text: '#1E40AF' };
    }
  };

  const getArrivalStatusColor = (status: string) => {
    switch (status) {
      case 'Late': return { bg: '#FECACA', text: '#991B1B' };
      case 'On Time': return { bg: '#DCFCE7', text: '#166534' };
      case 'Early': return { bg: '#FEF3C7', text: '#92400E' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Attendance</Text>
        {!todayRecord ? (
          // No record yet today → Check-in
          <TouchableOpacity style={styles.checkButton} onPress={handleCheckIn}>
            <Text style={styles.buttonText}>Check-in</Text>
          </TouchableOpacity>
        ) : !todayRecord.checkOut ? (
          // Checked-in, no check-out → primary action is Check-out
          <TouchableOpacity style={styles.checkButton} onPress={handleCheckOut}>
            <Text style={styles.buttonText}>Check-out</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.headerCol, styles.serialCell]}>
              <Text style={styles.headerCell}>Sr#</Text>
            </View>
            <View style={[styles.headerCol, styles.dateCell]}>
              <Text style={styles.headerCell}>Date</Text>
            </View>
            <View style={[styles.headerCol, styles.statusCell]}>
              <Text style={styles.headerCell}>Status</Text>
            </View>
            <View style={[styles.headerCol, styles.timeCell]}>
              <Text style={styles.headerCell}>Time In</Text>
            </View>
            <View style={[styles.headerCol, styles.timeCell]}>
              <Text style={styles.headerCell}>Time Out</Text>
            </View>
            <View style={[styles.headerCol, styles.arrivalCell]}>
              <Text style={styles.headerCell}>Arrival Status</Text>
            </View>
          </View>

          {/* Table Rows */}
          {data.map((record, index) => {
            const statusColor = getStatusColor(record.status);
            const arrivalColor = getArrivalStatusColor(record.arrivalStatus || '');
            const serialNumber = ((page - 1) * limit) + index + 1;
            
            return (
              <View key={record._id} style={styles.tableRow}>
                {/* Sr# */}
                <View style={[styles.rowCol, styles.serialCell]}>
                  <Text style={styles.cell}>{serialNumber}</Text>
                </View>

                {/* Date */}
                <View style={[styles.rowCol, styles.dateCell]}>
                  <Text style={styles.cell}>
                  {new Date(record.date).toLocaleDateString()}
                </Text>
                </View>

                {/* Status */}
                <View style={[styles.rowCol, styles.statusCell, styles.statusCellWrapper]}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                  <Text style={[styles.statusText, { color: statusColor.text }]}>
                    {record.status}
                  </Text>
                </View>
                </View>

                {/* Time In */}
                <View style={[styles.rowCol, styles.timeCell]}>
                  <Text style={styles.cell}>
                  {record.checkIn ? formatTimeForDisplay(record.checkIn) : '-'}
                </Text>
                </View>

                {/* Time Out */}
                <View style={[styles.rowCol, styles.timeCell]}>
                  <Text style={styles.cell}>
                  {record.checkOut ? formatTimeForDisplay(record.checkOut) : '-'}
                </Text>
                </View>

                {/* Arrival Status */}
                <View style={[styles.rowCol, styles.arrivalCell, styles.arrivalCellWrapper]}>
                <View style={[styles.arrivalBadge, { backgroundColor: arrivalColor.bg }]}>
                  <Text style={[styles.arrivalText, { color: arrivalColor.text }]}>
                    {record.arrivalStatus || '-'}
                  </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {data.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No attendance records found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Pagination */}
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationInfo}>
            Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} of {total}
          </Text>
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={() => {
                if (page > 1) {
                  setPage(page - 1);
                }
              }}
              disabled={page === 1}
            >
              <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>
            <Text style={styles.paginationPageText}>
              Page {page} of {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, page >= totalPages && styles.paginationButtonDisabled]}
              onPress={() => {
                if (page < totalPages) {
                  setPage(page + 1);
                }
              }}
              disabled={page >= totalPages}
            >
              <Text style={[styles.paginationButtonText, page >= totalPages && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  // Unified orange button style for Check-in / Check-out (PM dashboard)
  checkButton: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  table: {
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  headerCol: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  rowCol: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerCell: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  cell: {
    fontSize: 14,
    color: '#374151',
  },
  serialCell: {
    width: 50,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  dateCell: {
    width: 100,
    paddingHorizontal: 8,
  },
  statusCell: {
    width: 80,
    paddingHorizontal: 8,
  },
  statusCellWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCell: {
    width: 70,
    paddingHorizontal: 8,
  },
  arrivalCell: {
    width: 110,
    paddingHorizontal: 8,
  },
  arrivalCellWrapper: {
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  arrivalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  arrivalText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  paginationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paginationInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  paginationButton: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  paginationButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  paginationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationPageText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    minWidth: 80,
    textAlign: 'center',
  },
});

export default EmployeeAttendanceTable;