import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day';
  profilePic?: string;
}

const AttendanceScreen: React.FC = () => {
  const { callApi } = useAxios();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  useEffect(() => {
    if (attendanceRecords.length > 0) {
      filterRecords();
    }
  }, [searchQuery, attendanceRecords]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Use mock data for now (API not ready)
      console.log("🔍 Using mock attendance data for", selectedDate);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data for demonstration
      setAttendanceRecords([
        {
          _id: '1',
          employeeId: 'emp1',
          employeeName: 'John Doe',
          date: selectedDate,
          checkIn: '09:00 AM',
          checkOut: '06:00 PM',
          status: 'Present',
          profilePic: 'https://randomuser.me/api/portraits/men/1.jpg'
        },
        {
          _id: '2',
          employeeId: 'emp2',
          employeeName: 'Jane Smith',
          date: selectedDate,
          checkIn: '09:15 AM',
          checkOut: '05:45 PM',
          status: 'Late',
          profilePic: 'https://randomuser.me/api/portraits/women/1.jpg'
        },
        {
          _id: '3',
          employeeId: 'emp3',
          employeeName: 'Mike Johnson',
          date: selectedDate,
          checkIn: '08:45 AM',
          checkOut: '06:30 PM',
          status: 'Present',
          profilePic: 'https://randomuser.me/api/portraits/men/2.jpg'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceData();
    setRefreshing(false);
  };

  const filterRecords = () => {
    if (!searchQuery.trim()) {
      setFilteredRecords(attendanceRecords);
      return;
    }

    const filtered = attendanceRecords.filter(record =>
      record.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRecords(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return '#4CAF50';
      case 'Late': return '#FF9800';
      case 'Absent': return '#F44336';
      case 'Half Day': return '#2196F3';
      default: return '#9CA3AF';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderAttendanceRow = (record: AttendanceRecord, index: number) => {
    return (
      <View key={record._id} style={styles.attendanceRow}>
        <View style={styles.checkboxColumn}>
          <TouchableOpacity style={styles.checkbox} />
        </View>
        <Text style={styles.serialNumber}>{index + 1}</Text>
        <View style={styles.employeeColumn}>
          <View style={styles.avatarContainer}>
            {record.profilePic ? (
              <Image source={{ uri: record.profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(record.employeeName)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.employeeName}>{record.employeeName}</Text>
        </View>
        <Text style={styles.dateColumn}>{record.date}</Text>
        <Text style={styles.checkInColumn}>{record.checkIn}</Text>
        <Text style={styles.checkOutColumn}>{record.checkOut}</Text>
        <View style={[styles.statusColumn, { backgroundColor: getStatusColor(record.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(record.status) }]}>
            {record.status}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
      </View>

      {/* Search and Actions Bar */}
      <View style={styles.searchActionsBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employees..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportButton}>
          <Ionicons name="download" size={16} color="white" />
          <Text style={styles.exportButtonText}>Export</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.requestButton}
          onPress={() => navigation.navigate('RequestLeave', { redirectTo: 'AttendanceMain' })}
        >
          <Ionicons name="exit-outline" size={16} color="white" />
          <Text style={styles.exportButtonText}>Request Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <TextInput
          style={styles.dateInput}
          value={selectedDate}
          onChangeText={setSelectedDate}
          placeholder="Select Date"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity style={styles.calendarButton}>
          <Ionicons name="calendar" size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Attendance Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={styles.checkboxColumn}>
            <TouchableOpacity style={styles.checkbox} />
          </View>
          <Text style={[styles.tableHeaderText, styles.serialHeader]}>SR#</Text>
          <Text style={[styles.tableHeaderText, styles.employeeHeader]}>EMPLOYEE</Text>
          <Text style={[styles.tableHeaderText, styles.dateHeader]}>DATE</Text>
          <Text style={[styles.tableHeaderText, styles.checkInHeader]}>CHECK IN</Text>
          <Text style={[styles.tableHeaderText, styles.checkOutHeader]}>CHECK OUT</Text>
          <Text style={[styles.tableHeaderText, styles.statusHeader]}>STATUS</Text>
        </View>

        <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={true}>
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record, index) => renderAttendanceRow(record, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No attendance records found</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  searchActionsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FB923C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#1F2937',
  },
  calendarButton: {
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  checkboxColumn: {
    width: 40,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  serialHeader: {
    width: 40,
    textAlign: 'center',
  },
  employeeHeader: {
    flex: 1,
    marginLeft: 16,
  },
  dateHeader: {
    flex: 1,
    marginLeft: 16,
  },
  checkInHeader: {
    flex: 1,
    marginLeft: 16,
  },
  checkOutHeader: {
    flex: 1,
    marginLeft: 16,
  },
  statusHeader: {
    flex: 1,
    marginLeft: 16,
  },
  tableBody: {
    maxHeight: 400,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  serialNumber: {
    width: 40,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  employeeColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    gap: 8,
  },
  avatarContainer: {
    width: 32,
    height: 32,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  dateColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  checkInColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  checkOutColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  statusColumn: {
    flex: 1,
    marginLeft: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 3,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default AttendanceScreen;
