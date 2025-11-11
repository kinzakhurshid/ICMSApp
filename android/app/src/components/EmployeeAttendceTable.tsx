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
  const employeeId = currentUser?.id;

  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

  const fetchData = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await callApi({
        method: 'GET',
        url: '/attendance/employee',
        params: {
          page: 1,
          limit: 50,
          sortBy: '-date',
        },
      });

      setData(res?.data || []);
      
      // Check today's record
      const today = new Date().toISOString().split('T')[0];
      const todayRec = res?.data?.find(
        (r: AttendanceRecord) => new Date(r.date).toISOString().split('T')[0] === today
      );
      setTodayRecord(todayRec || null);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

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
          <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
            <Text style={styles.buttonText}>Check-in</Text>
          </TouchableOpacity>
        ) : !todayRecord.checkOut ? (
          <TouchableOpacity style={styles.checkOutButton} onPress={handleCheckOut}>
            <Text style={styles.buttonText}>Check-out</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.serialCell]}>Sr#</Text>
            <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
            <Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
            <Text style={[styles.headerCell, styles.timeCell]}>Time In</Text>
            <Text style={[styles.headerCell, styles.timeCell]}>Time Out</Text>
            <Text style={[styles.headerCell, styles.arrivalCell]}>Arrival Status</Text>
          </View>

          {/* Table Rows */}
          {data.map((record, index) => {
            const statusColor = getStatusColor(record.status);
            const arrivalColor = getArrivalStatusColor(record.arrivalStatus || '');
            
            return (
              <View key={record._id} style={styles.tableRow}>
                <Text style={[styles.cell, styles.serialCell]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.dateCell]}>
                  {new Date(record.date).toLocaleDateString()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                  <Text style={[styles.statusText, { color: statusColor.text }]}>
                    {record.status}
                  </Text>
                </View>
                <Text style={[styles.cell, styles.timeCell]}>
                  {record.checkIn ? formatTimeForDisplay(record.checkIn) : '-'}
                </Text>
                <Text style={[styles.cell, styles.timeCell]}>
                  {record.checkOut ? formatTimeForDisplay(record.checkOut) : '-'}
                </Text>
                <View style={[styles.arrivalBadge, { backgroundColor: arrivalColor.bg }]}>
                  <Text style={[styles.arrivalText, { color: arrivalColor.text }]}>
                    {record.arrivalStatus || '-'}
                  </Text>
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
  checkInButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  checkOutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
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
  timeCell: {
    width: 70,
    paddingHorizontal: 8,
  },
  arrivalCell: {
    width: 100,
    paddingHorizontal: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
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
    marginHorizontal: 8,
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
});

export default EmployeeAttendanceTable;