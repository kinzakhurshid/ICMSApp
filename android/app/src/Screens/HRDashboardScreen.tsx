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
import  useAxios  from '../hooks/useAxios';

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
  summaryCards: Array<{
    title: string;
    value: string | number;
    delta: string;
    percent: string;
    path: string;
  }>;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  position: string;
  contact: string;
  joiningDate: string;
  gender: string;
  profilePic?: string;
}

const HRDashboardScreen: React.FC = () => {
  const { callApi } = useAxios();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      filterEmployees();
    }
  }, [searchQuery, employees]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, employeesRes] = await Promise.all([
        callApi({ method: "GET", url: "/HR/stats" }),
        callApi({ method: "GET", url: "/HR/employees" }),
      ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }

      if (employeesRes.success) {
        setEmployees(employeesRes.data.employees || []);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const filterEmployees = () => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEmployees(filtered);
  };

  const renderSummaryCard = (card: any, index: number) => {
    const getCardColor = (index: number) => {
      const colors = ['#FF6B35', '#4CAF50', '#9C27B0', '#2196F3'];
      return colors[index % colors.length];
    };

    const getTimeframeLabel = (index: number) => {
      const labels = ['Last 30 days', 'Last 30 days', 'Last 30 days', 'September'];
      return labels[index % labels.length];
    };

    return (
      <View key={index} style={styles.summaryCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{card.title}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardMainValue}>
            <Text style={styles.cardValue}>{card.value}</Text>
            <View style={styles.cardDelta}>
              <Ionicons name="trending-up" size={16} color="#4CAF50" />
              <Text style={styles.deltaText}>{card.delta}</Text>
            </View>
          </View>
          <View style={styles.cardRight}>
            <View style={[styles.circularIndicator, { borderColor: getCardColor(index) }]}>
              <Text style={[styles.circularText, { color: getCardColor(index) }]}>
                {card.percent}
              </Text>
            </View>
            <View style={[styles.timeframeLabel, { backgroundColor: getCardColor(index) + '20' }]}>
              <Text style={[styles.timeframeText, { color: getCardColor(index) }]}>
                {getTimeframeLabel(index)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmployeeRow = (employee: Employee, index: number) => {
    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    };

    return (
      <View key={employee._id} style={styles.employeeRow}>
        <View style={styles.checkboxColumn}>
          <TouchableOpacity style={styles.checkbox} />
        </View>
        <Text style={styles.serialNumber}>{index + 1}</Text>
        <View style={styles.nameColumn}>
          <View style={styles.avatarContainer}>
            {employee.profilePic ? (
              <Image source={{ uri: employee.profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(employee.name)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.employeeName}>{employee.name}</Text>
        </View>
        <Text style={styles.emailColumn}>{employee.email}</Text>
        <Text style={styles.positionColumn}>{employee.position}</Text>
        <Text style={styles.contactColumn}>{employee.contact}</Text>
        <Text style={styles.joiningDateColumn}>{formatDate(employee.joiningDate)}</Text>
        <Text style={styles.genderColumn}>{employee.gender}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No data available</Text>
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
        <Text style={styles.headerTitle}>Employees</Text>
      </View>

      {/* Search and Actions Bar */}
      <View style={styles.searchActionsBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
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
          <Text style={styles.exportButtonText}>Export All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={16} color="white" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCardsContainer}>
        {stats.summaryCards.map((card, index) => renderSummaryCard(card, index))}
      </View>

      {/* Employee Table */}
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <View style={styles.checkboxColumn}>
            <TouchableOpacity style={styles.checkbox} />
          </View>
          <View style={styles.sortableColumn}>
            <Text style={styles.tableHeaderText}>SR#</Text>
            <Ionicons name="chevron-up" size={12} color="#9CA3AF" />
          </View>
          <View style={styles.sortableColumn}>
            <Text style={styles.tableHeaderText}>NAME</Text>
            <Ionicons name="chevron-up" size={12} color="#9CA3AF" />
          </View>
          <Text style={[styles.tableHeaderText, styles.emailHeader]}>EMAIL</Text>
          <Text style={[styles.tableHeaderText, styles.positionHeader]}>POSITION</Text>
          <Text style={[styles.tableHeaderText, styles.contactHeader]}>CONTACT</Text>
          <Text style={[styles.tableHeaderText, styles.joiningDateHeader]}>JOINING DATE</Text>
          <Text style={[styles.tableHeaderText, styles.genderHeader]}>GENDER</Text>
        </View>

        <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={true}>
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee, index) => renderEmployeeRow(employee, index))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No employees found</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
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
    paddingBottom: 20,
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
  exportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardMainValue: {
    flex: 1,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  cardDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deltaText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  cardRight: {
    alignItems: 'center',
  },
  circularIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  circularText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeframeLabel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeframeText: {
    fontSize: 10,
    fontWeight: '600',
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
  sortableColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  emailHeader: {
    flex: 1,
    marginLeft: 16,
  },
  positionHeader: {
    flex: 1,
    marginLeft: 16,
  },
  contactHeader: {
    flex: 1,
    marginLeft: 16,
  },
  joiningDateHeader: {
    flex: 1,
    marginLeft: 16,
  },
  genderHeader: {
    flex: 1,
    marginLeft: 16,
  },
  tableBody: {
    maxHeight: 400,
  },
  employeeRow: {
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
  nameColumn: {
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
  emailColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  positionColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  contactColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  joiningDateColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
  },
  genderColumn: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 16,
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

export default HRDashboardScreen;
