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
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalEmployees: number;
  totalEmployeesChange: number;
  attendanceRate: number;
  totalPayroll: number;
  activeEmployees: number;
  attendanceGrowth: number;
  payrollGrowth: number;
  genderStats: {
    male: number;
    female: number;
    other: number;
    malePercentage: number;
    femalePercentage: number;
    otherPercentage: number;
  };
  departmentSalaryData: Array<{
    department: string;
    totalSalary: number;
    employees: number;
  }>;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  contact: string;
  joiningDate: string;
  gender: string;
  avatar?: string;
}

const HRDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees from API
      const employeesResponse = await callApi({
        method: 'GET',
        url: '/employee',
      });
      
      // Handle different response structures
      let employeesData = [];
      if (Array.isArray(employeesResponse)) {
        employeesData = employeesResponse;
      } else if (employeesResponse && Array.isArray(employeesResponse.data)) {
        employeesData = employeesResponse.data;
      } else if (employeesResponse && employeesResponse.data && Array.isArray(employeesResponse.data.data)) {
        employeesData = employeesResponse.data.data;
      } else if (employeesResponse && employeesResponse.data) {
        employeesData = employeesResponse.data;
      }
      
      console.log('HR Dashboard - Employee API Response:', employeesResponse);
      console.log('HR Dashboard - Parsed Employees Data:', employeesData);
      console.log('HR Dashboard - Number of employees:', employeesData.length);
      
      // Map API response to Employee interface
      const mappedEmployees: Employee[] = employeesData.map((emp: any) => {
        const formatDate = (dateString: string) => {
          if (!dateString) return 'N/A';
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            return date.toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });
          } catch {
            return 'Invalid Date';
          }
        };
        
        return {
          id: emp._id || emp.id || '',
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.name || emp.fullName || 'N/A',
          email: emp.email || 'N/A',
          position: emp.position || emp.designation || 'N/A',
          contact: emp.contactNumber || emp.contact || emp.phone || 'N/A',
          joiningDate: formatDate(emp.hireDate || emp.joiningDate || emp.createdAt),
          gender: emp.gender || 'N/A',
          avatar: emp.avatar || emp.profilePicture,
        };
      });
      
      setEmployees(mappedEmployees);
      
      // Mock stats for now - can be replaced with actual API call later
      const mockStats: DashboardStats = {
        totalEmployees: mappedEmployees.length,
        totalEmployeesChange: 25,
        attendanceRate: 88,
        totalPayroll: 457230,
        activeEmployees: mappedEmployees.length,
        attendanceGrowth: -11,
        payrollGrowth: 100,
        genderStats: {
          male: mappedEmployees.filter(e => e.gender?.toLowerCase() === 'male').length,
          female: mappedEmployees.filter(e => e.gender?.toLowerCase() === 'female').length,
          other: mappedEmployees.filter(e => !['male', 'female'].includes(e.gender?.toLowerCase() || '')).length,
          malePercentage: mappedEmployees.length > 0 
            ? Math.round((mappedEmployees.filter(e => e.gender?.toLowerCase() === 'male').length / mappedEmployees.length) * 100)
            : 0,
          femalePercentage: mappedEmployees.length > 0
            ? Math.round((mappedEmployees.filter(e => e.gender?.toLowerCase() === 'female').length / mappedEmployees.length) * 100)
            : 0,
          otherPercentage: mappedEmployees.length > 0
            ? Math.round((mappedEmployees.filter(e => !['male', 'female'].includes(e.gender?.toLowerCase() || '')).length / mappedEmployees.length) * 100)
            : 0,
        },
        departmentSalaryData: [
          { department: 'General Department', totalSalary: 190000, employees: 5 },
          { department: 'Development', totalSalary: 260000, employees: 5 },
        ],
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const renderDashboardCard = (
    title: string,
    value: string | number,
    change: number,
    color: string,
    icon: string
  ) => (
    <View style={styles.dashboardCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <View style={styles.cardIcon}>
          <Icon name={icon} size={24} color={color} />
        </View>
      </View>
      <Text style={styles.cardValue}>{value}</Text>
      <View style={styles.cardChange}>
        <Icon 
          name={change >= 0 ? 'trending-up' : 'trending-down'} 
          size={16} 
          color={change >= 0 ? '#4CAF50' : '#F44336'} 
        />
        <Text style={[styles.changeText, { color: change >= 0 ? '#4CAF50' : '#F44336' }]}>
          {Math.abs(change)}%
        </Text>
      </View>
      <Text style={styles.cardTimeframe}>Last 30 days</Text>
    </View>
  );

  const renderEmployeeRow = (employee: Employee, index: number) => (
    <View key={employee.id} style={styles.employeeRow}>
      <View style={styles.employeeCheckbox}>
        <Icon name="check-box-outline-blank" size={20} color="#666" />
      </View>
      <Text style={styles.employeeSr}>{index + 1}</Text>
      <View style={styles.employeeInfo}>
        <View style={styles.employeeAvatar}>
          <Text style={styles.avatarText}>
            {employee.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        <Text style={styles.employeeName}>{employee.name}</Text>
      </View>
      <Text style={styles.employeeEmail}>{employee.email}</Text>
      <Text style={styles.employeePosition}>{employee.position}</Text>
      <Text style={styles.employeeContact}>{employee.contact}</Text>
      <Text style={styles.employeeDate}>{employee.joiningDate}</Text>
      <Text style={styles.employeeGender}>{employee.gender}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>

      {/* Dashboard Cards */}
      <View style={styles.dashboardGrid}>
        <TouchableOpacity onPress={() => safeNavigate('HREmployees')}>
          {renderDashboardCard('Total Employees', stats?.totalEmployees || 0, stats?.totalEmployeesChange || 0, '#FF6B35', 'people')}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => safeNavigate('HREmployees')}>
          {renderDashboardCard('Active Employees', stats?.activeEmployees || 0, stats?.totalEmployeesChange || 0, '#4CAF50', 'person')}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => safeNavigate('HRAttendance')}>
          {renderDashboardCard('Attendance Rate', `${stats?.attendanceRate || 0}%`, stats?.attendanceGrowth || 0, '#9C27B0', 'schedule')}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => safeNavigate('Payroll')}>
          {renderDashboardCard('Total Payroll', `Rs ${(stats?.totalPayroll || 0).toLocaleString()}K`, stats?.payrollGrowth || 0, '#2196F3', 'account-balance-wallet')}
        </TouchableOpacity>
      </View>


      {/* Employee Structure */}
      <View style={styles.structureCard}>
        <Text style={styles.structureTitle}>Employee Structure</Text>
        <View style={styles.donutChart}>
          <View style={styles.donutCenter}>
            <Text style={styles.donutTotal}>Total</Text>
            <Text style={styles.donutPercent}>100%</Text>
          </View>
        </View>
        <View style={styles.genderStats}>
          <View style={styles.genderItem}>
            <Text style={styles.genderLabel}>Male</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats?.genderStats?.malePercentage || 70}%`, backgroundColor: '#3B82F6' }]} />
            </View>
            <Text style={styles.genderPercent}>{stats?.genderStats?.malePercentage || 70}%</Text>
          </View>
          <View style={styles.genderItem}>
            <Text style={styles.genderLabel}>Female</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats?.genderStats?.femalePercentage || 30}%`, backgroundColor: '#EC4899' }]} />
            </View>
            <Text style={styles.genderPercent}>{stats?.genderStats?.femalePercentage || 30}%</Text>
          </View>
        </View>
      </View>

      {/* Employee Table */}
      <View style={styles.employeeCard}>
        {/* Header with title and action buttons */}
        <View style={styles.employeeHeader}>
          <Text style={styles.employeeCardTitle}>Employees</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.exportButton} onPress={() => Alert.alert('Export', 'Export functionality will be implemented')}>
              <Icon name="download" size={16} color="white" />
              <Text style={styles.exportText}>Export All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={() => (navigation as any).navigate('CreateEmployee')}>
              <Icon name="add" size={16} color="white" />
              <Text style={styles.addText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search and Filter */}
        <View style={styles.employeeActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-list" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Table Container */}
        <ScrollView 
          horizontal={true} 
          showsHorizontalScrollIndicator={true}
          style={styles.tableScrollContainer}
          nestedScrollEnabled={true}
        >
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={styles.headerCheckbox}>
                <Icon name="check-box-outline-blank" size={20} color="#666" />
              </View>
              <Text style={styles.headerText}>SR#</Text>
              <Text style={styles.headerText}>NAME</Text>
              <Text style={styles.headerText}>EMAIL</Text>
              <Text style={styles.headerText}>POSITION</Text>
              <Text style={styles.headerText}>CONTACT</Text>
              <Text style={styles.headerText}>JOINING DATE</Text>
              <Text style={styles.headerText}>GENDER</Text>
            </View>

            {/* Employee Rows - Vertical ScrollView for rows */}
            <ScrollView 
              vertical={true}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              style={styles.employeeRowsScroll}
            >
              {filteredEmployees.map((employee, index) => renderEmployeeRow(employee, index))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
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
    color: '#666',
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between',
  },
  dashboardCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  cardTimeframe: {
    fontSize: 12,
    color: '#999',
  },
  structureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  structureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  donutChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  donutCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutTotal: {
    fontSize: 12,
    color: '#999',
  },
  donutPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  genderStats: {
    marginTop: 16,
  },
  genderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  genderLabel: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  genderPercent: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },
  employeeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  employeeCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableScrollContainer: {
    maxHeight: 400, // Limit height so vertical scroll is needed
  },
  tableContainer: {
    minWidth: 1000, // Increased width to prevent overlapping
  },
  employeeRowsScroll: {
    maxHeight: 350, // Allow vertical scrolling for employee rows
  },
  employeeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 12,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  exportText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  headerCheckbox: {
    width: 30,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    width: 120,
    textAlign: 'center',
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 60,
  },
  employeeCheckbox: {
    width: 30,
    alignItems: 'center',
  },
  employeeSr: {
    fontSize: 12,
    color: '#666',
    width: 30,
    textAlign: 'center',
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 180,
    marginLeft: 8,
  },
  employeeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  employeeName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  employeeEmail: {
    fontSize: 12,
    color: '#666',
    width: 150,
    textAlign: 'center',
  },
  employeePosition: {
    fontSize: 12,
    color: '#666',
    width: 120,
    textAlign: 'center',
  },
  employeeContact: {
    fontSize: 12,
    color: '#666',
    width: 120,
    textAlign: 'center',
  },
  employeeDate: {
    fontSize: 12,
    color: '#666',
    width: 120,
    textAlign: 'center',
  },
  employeeGender: {
    fontSize: 12,
    color: '#666',
    width: 100,
    textAlign: 'center',
  },
});

export default HRDashboardScreen;