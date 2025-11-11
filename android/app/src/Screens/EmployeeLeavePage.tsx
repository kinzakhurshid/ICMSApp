import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';

// Components
import EmployeeAttendanceChart from '../components/EmployeeAttendceChart';
import EmployeeLeavesChart from '../components/EmployeeLeaveChart';
import EmployeeLeaveCalendar from '../components/EmployeeLeaveCalender';
import EmployeeAttendanceTable from '../components/EmployeeAttendceTable';
import EmployeeLeaveTable from '../components/EmployeeLeaveTable';

const EmployeeDashboardScreen = () => {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Refresh logic will be handled in individual components
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance and Leave Management</Text>
      </View>

      {/* Charts Row */}
      <View style={styles.chartsContainer}>
        <EmployeeAttendanceChart />
        <EmployeeLeavesChart />
        <EmployeeLeaveCalendar />
      </View>

      {/* Tables */}
      <View style={styles.tableContainer}>
        <EmployeeAttendanceTable />
      </View>
      
      <View style={styles.tableContainer}>
        <EmployeeLeaveTable />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  chartsContainer: {
    padding: 16,
    gap: 16,
  },
  tableContainer: {
    padding: 16,
    paddingTop: 0,
  },
});

export default EmployeeDashboardScreen;