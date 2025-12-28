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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';
import Svg, { Circle } from 'react-native-svg';
import { exportToXlsx } from '../utills/utills';

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
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Filter states
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Get unique positions for filter dropdown
  const uniquePositions = Array.from(new Set(employees.map(emp => emp.position).filter(Boolean)));

  // Apply filters
  const filteredEmployees = employees.filter(employee => {
    // Search filter
    const matchesSearch = 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Gender filter
    const matchesGender = 
      filterGender === 'all' || 
      employee.gender?.toLowerCase() === filterGender.toLowerCase();
    
    // Position filter
    const matchesPosition = 
      filterPosition === 'all' || 
      employee.position === filterPosition;
    
    return matchesSearch && matchesGender && matchesPosition;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterGender, filterPosition]);

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

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
  };

  const renderDonutChart = (malePercentage: number, femalePercentage: number) => {
    const size = 120;
    const stroke = 20;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    
    // Normalize percentages to ensure they sum to 100%
    const total = malePercentage + femalePercentage;
    const normalizedMale = total > 0 ? (malePercentage / total) * 100 : 0;
    const normalizedFemale = total > 0 ? (femalePercentage / total) * 100 : 0;
    
    // Convert percentages to decimals (0-1)
    const maleProgress = normalizedMale / 100;
    const femaleProgress = normalizedFemale / 100;
    
    // Calculate dash arrays - each segment takes up its percentage of the circumference
    const maleDash = circumference * maleProgress;
    const femaleDash = circumference * femaleProgress;
    
    return (
      <View style={styles.donutChartWrapper}>
        <Svg width={size} height={size} style={styles.donutSvg}>
          {/* Background track (gray) */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Male segment (blue) - starts at top (rotation -90) */}
          {normalizedMale > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#3B82F6"
              strokeWidth={stroke}
              strokeDasharray={`${maleDash} ${circumference}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              originX={size / 2}
              originY={size / 2}
            />
          )}
          {/* Female segment (pink) - starts where male ends */}
          {normalizedFemale > 0 && (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#EC4899"
              strokeWidth={stroke}
              strokeDasharray={`${femaleDash} ${circumference}`}
              strokeDashoffset={-maleDash}
              strokeLinecap="round"
              fill="none"
              rotation="-90"
              originX={size / 2}
              originY={size / 2}
            />
          )}
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutTotal}>Total</Text>
          <Text style={styles.donutPercent}>100%</Text>
        </View>
      </View>
    );
  };

  const renderEmployeeRow = (employee: Employee, index: number) => {
    const isSelected = selectedEmployees.has(employee.id);
    return (
    <View key={employee.id} style={styles.employeeRow}>
      <TouchableOpacity 
        style={styles.employeeCheckbox}
        onPress={() => toggleEmployeeSelection(employee.id)}
      >
        <Icon 
          name={isSelected ? "check-box" : "check-box-outline-blank"} 
          size={20} 
          color={isSelected ? "#FF6B35" : "#666"} 
        />
      </TouchableOpacity>
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
  };

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
        <TouchableOpacity onPress={() => {
          try {
            (navigation as any).navigate('PayrollScreen');
          } catch (error) {
            safeNavigate('Payroll');
          }
        }}>
          {renderDashboardCard('Total Payroll', `Rs ${(stats?.totalPayroll || 0).toLocaleString()}K`, stats?.payrollGrowth || 0, '#2196F3', 'account-balance-wallet')}
        </TouchableOpacity>
      </View>


      {/* Employee Structure */}
      <View style={styles.structureCard}>
        <Text style={styles.structureTitle}>Employee Structure</Text>
        <View style={styles.donutChartContainer}>
          {renderDonutChart(
            stats?.genderStats?.malePercentage || 0,
            stats?.genderStats?.femalePercentage || 0
          )}
        </View>
          <View style={styles.genderStats}>
          <View style={styles.genderItem}>
            <Text style={styles.genderLabel}>Male</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats?.genderStats?.malePercentage || 0}%`, backgroundColor: '#3B82F6' }]} />
            </View>
            <Text style={styles.genderPercent}>{stats?.genderStats?.malePercentage || 0}%</Text>
          </View>
          <View style={styles.genderItem}>
            <Text style={styles.genderLabel}>Female</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${stats?.genderStats?.femalePercentage || 0}%`, backgroundColor: '#EC4899' }]} />
            </View>
            <Text style={styles.genderPercent}>{stats?.genderStats?.femalePercentage || 0}%</Text>
          </View>
        </View>
      </View>

      {/* Employee Table */}
          <View style={styles.employeeCard}>
        {/* Header with title and action buttons */}
        <View style={styles.employeeHeader}>
          <Text style={styles.employeeCardTitle}>Employees</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.exportButton} 
              onPress={async () => {
                try {
                  // Export selected employees or all if none selected
                  const employeesToExport = selectedEmployees.size > 0
                    ? filteredEmployees.filter(emp => selectedEmployees.has(emp.id))
                    : filteredEmployees;
                  
                  if (employeesToExport.length === 0) {
                    Alert.alert('No Data', 'No employees to export');
                    return;
                  }

                  await exportToXlsx({
                    filename: `employees-dashboard-${new Date().toISOString().split('T')[0]}`,
                    columns: [
                      { key: 'sr', header: 'SR#' },
                      { key: 'name', header: 'NAME' },
                      { key: 'email', header: 'EMAIL' },
                      { key: 'position', header: 'POSITION' },
                      { key: 'contact', header: 'CONTACT' },
                      { key: 'joiningDate', header: 'JOINING DATE' },
                      { key: 'gender', header: 'GENDER' },
                    ],
                    rows: employeesToExport.map((emp, idx) => ({
                      sr: idx + 1,
                      name: emp.name,
                      email: emp.email,
                      position: emp.position,
                      contact: emp.contact,
                      joiningDate: emp.joiningDate,
                      gender: emp.gender,
                    })),
                  });
                } catch (error) {
                  console.error('Failed to export employees from dashboard:', error);
                  Alert.alert('Error', 'Failed to export employees. Please try again.');
                }
              }}
            >
              <Icon name="download" size={16} color="white" />
              <Text style={styles.exportText}>Export {selectedEmployees.size > 0 ? `${selectedEmployees.size} Selected` : 'All'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => (navigation as any).navigate('CreateEmployee', { redirectTo: 'HREmployees' })}
            >
              <Icon name="add" size={16} color="white" />
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search and Filters */}
        <View style={styles.employeeActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Icon name="filter-list" size={20} color="#666" />
            {(filterGender !== 'all' || filterPosition !== 'all') && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {(filterGender !== 'all' ? 1 : 0) + (filterPosition !== 'all' ? 1 : 0)}
                </Text>
              </View>
            )}
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
              <Text style={[styles.headerText, styles.headerSr]}>SR#</Text>
              <Text style={[styles.headerText, styles.headerName]}>NAME</Text>
              <Text style={[styles.headerText, styles.headerEmail]}>EMAIL</Text>
              <Text style={[styles.headerText, styles.headerPosition]}>POSITION</Text>
              <Text style={[styles.headerText, styles.headerContact]}>CONTACT</Text>
              <Text style={[styles.headerText, styles.headerDate]}>JOINING DATE</Text>
              <Text style={[styles.headerText, styles.headerGender]}>GENDER</Text>
            </View>

            {/* Employee Rows - Vertical ScrollView for rows */}
            <ScrollView 
              vertical={true}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              style={styles.employeeRowsScroll}
            >
              {paginatedEmployees.map((employee, index) => renderEmployeeRow(employee, startIndex + index))}
              {paginatedEmployees.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No employees found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <Icon name="chevron-left" size={20} color={currentPage === 1 ? '#ccc' : '#FF6B35'} />
              <Text style={[styles.paginationText, currentPage === 1 && styles.paginationTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>

            <View style={styles.paginationInfo}>
              <Text style={styles.paginationInfoText}>
                Page {currentPage} of {totalPages}
              </Text>
              <Text style={styles.paginationCountText}>
                Showing {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
              onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.paginationText, currentPage === totalPages && styles.paginationTextDisabled]}>
                Next
              </Text>
              <Icon name="chevron-right" size={20} color={currentPage === totalPages ? '#ccc' : '#FF6B35'} />
            </TouchableOpacity>
          </View>
        )}
      </View>

        {/* Filter Modal */}
        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Employees</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Gender Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Gender</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filterGender === 'all' && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterGender('all')}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterGender === 'all' && styles.filterOptionTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filterGender === 'male' && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterGender('male')}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterGender === 'male' && styles.filterOptionTextActive,
                      ]}
                    >
                      Male
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.filterOption,
                      filterGender === 'female' && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilterGender('female')}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterGender === 'female' && styles.filterOptionTextActive,
                      ]}
                    >
                      Female
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Position Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Position</Text>
                <ScrollView style={styles.positionFilterScroll} nestedScrollEnabled={true}>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        filterPosition === 'all' && styles.filterOptionActive,
                      ]}
                      onPress={() => setFilterPosition('all')}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          filterPosition === 'all' && styles.filterOptionTextActive,
                        ]}
                      >
                        All
                      </Text>
                    </TouchableOpacity>
                    {uniquePositions.map((position) => (
                      <TouchableOpacity
                        key={position}
                        style={[
                          styles.filterOption,
                          filterPosition === position && styles.filterOptionActive,
                        ]}
                        onPress={() => setFilterPosition(position)}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            filterPosition === position && styles.filterOptionTextActive,
                          ]}
                        >
                          {position}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.clearButton]}
                  onPress={() => {
                    setFilterGender('all');
                    setFilterPosition('all');
                  }}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.applyButton]}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  donutChartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  donutChartWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  donutSvg: {
    position: 'absolute',
  },
  donutCenter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
    color: '#333',
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
    minWidth: 1000,
  },
  headerCheckbox: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'left',
  },
  headerSr: {
    width: 50,
    paddingLeft: 4,
  },
  headerName: {
    width: 200,
    paddingLeft: 8,
  },
  headerEmail: {
    width: 200,
    paddingLeft: 8,
  },
  headerPosition: {
    width: 150,
    paddingLeft: 8,
  },
  headerContact: {
    width: 130,
    paddingLeft: 8,
  },
  headerDate: {
    width: 130,
    paddingLeft: 8,
  },
  headerGender: {
    width: 100,
    paddingLeft: 8,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 60,
    minWidth: 1000,
  },
  employeeCheckbox: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
  },
  employeeSr: {
    fontSize: 12,
    color: '#666',
    width: 50,
    textAlign: 'left',
    paddingLeft: 4,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 200,
    paddingLeft: 8,
  },
  employeeAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    flexShrink: 0,
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
    width: 200,
    textAlign: 'left',
    paddingLeft: 8,
  },
  employeePosition: {
    fontSize: 12,
    color: '#666',
    width: 150,
    textAlign: 'left',
    paddingLeft: 8,
  },
  employeeContact: {
    fontSize: 12,
    color: '#666',
    width: 130,
    textAlign: 'left',
    paddingLeft: 8,
  },
  employeeDate: {
    fontSize: 12,
    color: '#666',
    width: 130,
    textAlign: 'left',
    paddingLeft: 8,
  },
  employeeGender: {
    fontSize: 12,
    color: '#666',
    width: 100,
    textAlign: 'left',
    paddingLeft: 8,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionFilterScroll: {
    maxHeight: 150,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#FF6B35',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOptionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#F5F5F5',
  },
  applyButton: {
    backgroundColor: '#FF6B35',
  },
  clearButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F9FA',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF6B35',
    gap: 4,
  },
  paginationButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#F5F5F5',
  },
  paginationText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  paginationTextDisabled: {
    color: '#ccc',
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  paginationCountText: {
    fontSize: 12,
    color: '#666',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
  },
});

export default HRDashboardScreen;