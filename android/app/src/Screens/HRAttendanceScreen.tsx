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
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';
import SearchableSelect from '../components/SearchableSelect';

const { width } = Dimensions.get('window');

interface AttendanceStats {
  onTime: number;
  late: number;
  absent: number;
  halfDay: number;
  onLeave: number;
}

interface AttendanceRecord {
  _id: string;
  id?: string;
  sr?: number;
  employeeName?: string;
  firstName?: string;
  lastName?: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';
  timeIn?: string;
  timeOut?: string;
  checkIn?: string;
  checkOut?: string;
  arrivalStatus?: 'On Time' | 'Late';
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const HRAttendanceScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [stats, setStats] = useState<AttendanceStats>({
    onTime: 0,
    late: 0,
    absent: 0,
    halfDay: 0,
    onLeave: 0,
  });
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedTab, setSelectedTab] = useState<'Day' | 'Week' | 'Month'>('Day');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    fetchAttendance();
  }, [selectedTab, page]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      setCustomStart(formatDate(selectedDate));
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setCustomEnd(formatDate(selectedDate));
    }
  };

  // Safe navigation function that works in both drawer and tab contexts
  const safeNavigate = (screenName: string) => {
    try {
      // Try to navigate to the screen
      navigation.navigate(screenName as never);
    } catch (error) {
      console.log('Navigation error:', error);
      // If navigation fails, show an alert
      Alert.alert('Navigation Error', `Cannot navigate to ${screenName}. Please use the drawer menu.`);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await callApi({ 
        method: "GET", 
        url: "/employee" 
      });
      setEmployees(response || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Set empty array on error
      setEmployees([]);
    }
  };

  const fetchAttendance = async () => {
    setIsFetching(true);
    try {
      console.log("🔍 Fetching attendance data...");
      
      const today = new Date();
      const startDate = new Date();

      // Overview filter (Day/Week/Month) only affects overview stats, not the list
      // The list uses customStart/customEnd or employee filter
      if (!customStart && !customEnd) {
        if (selectedTab === 'Week') startDate.setDate(today.getDate() - 7);
        else if (selectedTab === 'Month') startDate.setMonth(today.getMonth() - 1);
        else startDate.setDate(today.getDate());
      }

      // Fetch overview stats (controlled by selectedTab)
      const overviewStartDate = new Date();
      if (selectedTab === 'Week') overviewStartDate.setDate(today.getDate() - 7);
      else if (selectedTab === 'Month') overviewStartDate.setMonth(today.getMonth() - 1);
      else overviewStartDate.setDate(today.getDate());

      // Fetch overview stats separately
      const overviewResponse = await callApi({
        method: 'GET',
        url: '/attendance/date-range',
        params: {
          startDate: overviewStartDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
          page: 1,
          limit: 1, // Just to get stats
        },
      });

      // Fetch attendance list (controlled by employee filter and custom dates)
      const listResponse = await callApi({
        method: 'GET',
        url: '/attendance/date-range',
        params: {
          startDate: customStart || startDate.toISOString().split('T')[0],
          endDate: customEnd || today.toISOString().split('T')[0],
          employeeId: selectedEmployee || undefined,
          page,
          limit: 10,
        },
      });

      console.log("🔍 API Response:", listResponse);

      if (listResponse.success && listResponse.data) {
        // Use overview stats from overview response
        setStats(overviewResponse.stats || overviewResponse.data?.stats || { onTime: 0, late: 0, absent: 0, halfDay: 0, onLeave: 0 });
        setAttendanceData(listResponse.data);
        setTotalPages(listResponse.pagination?.totalPages || 1);
      } else {
        setAttendanceData([]);
        setStats(overviewResponse.stats || { onTime: 0, late: 0, absent: 0, halfDay: 0, onLeave: 0 });
      }
      setLoading(false);
    } catch (error: any) {
      console.error("❌ Error fetching attendance data:", error);
      Alert.alert("Error", "Failed to load attendance data");
      setLoading(false);
    } finally {
      setIsFetching(false);
    }
  };

  const renderAttendanceCard = (
    title: string,
    count: number,
    color: string,
    iconName: string
  ) => (
    <View style={[styles.attendanceCard, { backgroundColor: color }]}>
      <Icon name={iconName} size={24} color="#333" />
      <Text style={styles.attendanceCount}>{count}</Text>
      <Text style={styles.attendanceLabel}>{title}</Text>
    </View>
  );

  const handleDeleteAttendance = async (record: AttendanceRecord) => {
    const id = record._id || record.id;
    if (!id) return;

    Alert.alert(
      'Delete Attendance',
      'Are you sure you want to delete this attendance record?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await callApi({ method: 'DELETE', url: `/attendance/${id}` });
              Alert.alert('Success', 'Attendance record deleted');
              fetchAttendance();
            } catch (error: any) {
              console.error('Error deleting attendance:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to delete attendance record');
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const renderAttendanceRow = (record: AttendanceRecord, index: number) => {
    const employeeName = record.employeeName || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown';
    const timeIn = record.timeIn || record.checkIn || '-';
    const timeOut = record.timeOut || record.checkOut || '-';
    const arrivalStatus = record.arrivalStatus || 'Unknown';
    
    return (
      <View key={record._id || record.id || index} style={styles.attendanceRow}>
        <View style={styles.attendanceCheckbox}>
          <Icon name="check-box-outline-blank" size={20} color="#666" />
        </View>
        <Text style={styles.attendanceSr}>{index + 1}</Text>
        <Text style={styles.attendanceEmployee}>{employeeName}</Text>
        <Text style={styles.attendanceDate}>{new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text>
        <View style={[styles.statusBadge, { backgroundColor: record.status === 'Present' ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>{record.status}</Text>
        </View>
        <Text style={styles.attendanceTimeIn}>{timeIn}</Text>
        <Text style={styles.attendanceTimeOut}>{timeOut}</Text>
        <View style={[styles.arrivalBadge, { backgroundColor: arrivalStatus === 'On Time' ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.arrivalText}>{arrivalStatus}</Text>
        </View>
        <View style={styles.optionsButton}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              Alert.alert(
                'Options',
                '',
                [
                  {
                    text: 'Edit',
                    onPress: () =>
                      (navigation as any).navigate('EditAttendanceRecord', {
                        record,
                      }),
                  },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => handleDeleteAttendance(record),
                  },
                  { text: 'Cancel', style: 'cancel' },
                ],
                { cancelable: true },
              )
            }
          >
            <Icon name="more-vert" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loaderText}>Loading Attendance Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbText}>Dashboard / Attendance</Text>
      </View>

      {/* Page Title and Add Button */}
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Attendance management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (navigation as any).navigate('AddAttendanceRecord')}
        >
          <Icon name="add" size={18} color="white" />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Attendance Overview */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewTitle}>Attendance Overview</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.overviewStatsScroll}
          contentContainerStyle={styles.overviewStats}
        >
          {renderAttendanceCard('On Time', stats.onTime, '#E8F5E8', 'schedule')}
          {renderAttendanceCard('Late', stats.late, '#FFF8E1', 'schedule')}
          {renderAttendanceCard('Absent', stats.absent, '#FFEBEE', 'event-busy')}
          {renderAttendanceCard('Half Day', stats.halfDay, '#E3F2FD', 'schedule')}
        </ScrollView>
        
        {/* Time Period Selector */}
        <View style={styles.timeSelector}>
          <TouchableOpacity 
            style={[styles.timeButton, selectedTab === 'Day' && styles.timeButtonActive]}
            onPress={() => setSelectedTab('Day')}
          >
            <Text style={[styles.timeButtonText, selectedTab === 'Day' && styles.timeButtonTextActive]}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeButton, selectedTab === 'Week' && styles.timeButtonActive]}
            onPress={() => setSelectedTab('Week')}
          >
            <Text style={[styles.timeButtonText, selectedTab === 'Week' && styles.timeButtonTextActive]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.timeButton, selectedTab === 'Month' && styles.timeButtonActive]}
            onPress={() => setSelectedTab('Month')}
          >
            <Text style={[styles.timeButtonText, selectedTab === 'Month' && styles.timeButtonTextActive]}>Month</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Attendance Records */}
      <View style={styles.recordsCard}>
        <View style={styles.recordsHeader}>
          <Text style={styles.recordsTitle}>Attendance Records</Text>
          <TouchableOpacity style={styles.exportButton}>
            <Text style={styles.exportText}>Export All</Text>
          </TouchableOpacity>
        </View>
        {/* Spacer to prevent date overlap with header */}
        <View style={{ height: 12, marginBottom: 4 }} />
        
        {/* Filters Row */}
        <View style={styles.filtersContainer}>
          <View style={styles.filtersRow}>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Employee</Text>
              <SearchableSelect
                placeholder="Search employee..."
                options={[
                  { value: '', label: 'All Employees' },
                  ...employees.map((emp) => ({
                    value: emp._id,
                    label: `${emp.firstName} ${emp.lastName}`,
                  })),
                ]}
                value={selectedEmployee}
                onChange={(value) => {
                  setSelectedEmployee(value);
                  setPage(1);
                }}
                containerStyle={styles.searchableContainer}
              />
            </View>
            
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={[
                  styles.dateInputText,
                  !customStart && styles.placeholderText
                ]}>
                  {customStart ? formatDateForDisplay(customStart) : 'DD/MM/YYYY'}
                </Text>
                <Icon name="calendar-today" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={[
                  styles.dateInputText,
                  !customEnd && styles.placeholderText
                ]}>
                  {customEnd ? formatDateForDisplay(customEnd) : 'DD/MM/YYYY'}
                </Text>
                <Icon name="calendar-today" size={18} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => {
                  setPage(1);
                  fetchAttendance();
                }}
              >
                <Icon name="check" size={16} color="white" />
                <Text style={styles.applyText}>Apply</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setSelectedEmployee('');
                  setCustomStart('');
                  setCustomEnd('');
                  setPage(1);
                  fetchAttendance();
                }}
              >
                <Icon name="clear" size={16} color="#666" />
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Date Pickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
          />
        )}
        
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
          />
        )}

        {/* Scrollable Table */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.headerCheckbox}>
                <Icon name="check-box-outline-blank" size={20} color="#666" />
              </View>
              <Text style={[styles.headerText, styles.headerSr]}>#</Text>
              <Text style={[styles.headerText, styles.headerEmployee]}>EMPLOYEE</Text>
              <Text style={[styles.headerText, styles.headerDate]}>DATE</Text>
              <Text style={[styles.headerText, styles.headerStatus]}>STATUS</Text>
              <Text style={[styles.headerText, styles.headerTimeIn]}>TIME IN</Text>
              <Text style={[styles.headerText, styles.headerTimeOut]}>TIME OUT</Text>
              <Text style={[styles.headerText, styles.headerArrival]}>ARRIVAL STATUS</Text>
              <Text style={[styles.headerText, styles.headerOptions]}>ACTIONS</Text>
            </View>

            {/* Table Rows */}
            {attendanceData.map((record, index) => renderAttendanceRow(record, index))}
          </View>
        </ScrollView>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  scrollContainer: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  breadcrumb: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#666',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  overviewCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  overviewStatsScroll: {
    marginBottom: 20,
  },
  overviewStats: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 12,
  },
  attendanceCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: 90,
    width: 90,
  },
  attendanceCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  attendanceLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  timeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  timeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  recordsCard: {
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filtersContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    gap: 16,
  },
  filterGroup: {
    flex: 1,
    minWidth: 140,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  searchableContainer: {
    marginBottom: 0,
  },
  exportButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  employeeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  employeeInput: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    paddingVertical: 2,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateInputText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  placeholderText: {
    color: '#999',
  },
  applyButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  applyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  clearText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  tableScrollContainer: {
    maxHeight: 500,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableContainer: {
    minWidth: 1200,
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
  headerCheckbox: {
    width: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSr: {
    width: 40,
  },
  headerEmployee: {
    width: 180,
    textAlign: 'left',
    marginLeft: 8,
  },
  headerDate: {
    width: 100,
  },
  headerStatus: {
    width: 120,
  },
  headerTimeIn: {
    width: 140,
  },
  headerTimeOut: {
    width: 140,
  },
  headerArrival: {
    width: 160,
  },
  headerOptions: {
    width: 100,
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
  },
  attendanceCheckbox: {
    width: 40,
    alignItems: 'center',
  },
  attendanceSr: {
    fontSize: 13,
    color: '#6B7280',
    width: 50,
    textAlign: 'center',
    fontWeight: '500',
    marginRight: 10,
  },
  attendanceEmployee: {
    fontSize: 14,
    color: '#374151',
    width: 200,
    fontWeight: '600',
    marginLeft: 8,
    marginRight: 10,
  },
  attendanceDate: {
    fontSize: 13,
    color: '#6B7280',
    width: 120,
    textAlign: 'center',
    marginRight: 10,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    width: 120,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  attendanceTimeIn: {
    fontSize: 13,
    color: '#6B7280',
    width: 140,
    textAlign: 'center',
    fontWeight: '500',
  },
  attendanceTimeOut: {
    fontSize: 13,
    color: '#6B7280',
    width: 160,
    marginRight: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  arrivalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    width: 160,
    alignItems: 'center',
  },
  arrivalText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  optionsButton: {
    width: 100,
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
});

export default HRAttendanceScreen;
