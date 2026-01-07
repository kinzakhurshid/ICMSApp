import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import { exportToXlsx } from '../utills/utills';
import SearchableSelect from './SearchableSelect';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  contact: string;
  contactNumber?: string;
  joiningDate: string;
  hireDate?: string;
  gender: string;
  avatar?: string;
  department?: string;
  role?: string;
  status?: string;
  jobType?: string;
  type?: string;
}

const EmployeeTable: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    department: '',
    role: '',
    gender: '',
    status: '',
    type: '',
  });
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [filters, searchTerm]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: '/employee',
      });

      let employeesData: any[] = [];
      if (Array.isArray(response)) {
        employeesData = response;
      } else if (response && Array.isArray(response.data)) {
        employeesData = response.data;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        employeesData = response.data.data;
      } else if (response && response.data) {
        employeesData = response.data;
      }

      const mappedEmployees: Employee[] = employeesData.map((emp: any) => ({
        _id: emp._id || emp.id || '',
        firstName: emp.firstName || emp.fullName?.split(' ')[0] || '',
        lastName: emp.lastName || emp.fullName?.split(' ').slice(1).join(' ') || '',
        email: emp.email || 'N/A',
        position: emp.position || emp.designation || 'N/A',
        contact: emp.contactNumber || emp.contact || emp.phone || 'N/A',
        contactNumber: emp.contactNumber || emp.contact || emp.phone,
        joiningDate: emp.hireDate || emp.joiningDate || emp.createdAt || '',
        hireDate: emp.hireDate || emp.joiningDate || emp.createdAt,
        gender: emp.gender || 'N/A',
        avatar: emp.avatar || emp.profileImage || emp.profilePicture,
        department: emp.department?.name || emp.department || 'N/A',
        role: emp.role || 'N/A',
        status: emp.status || 'Active',
        jobType: emp.jobType || emp.type || 'N/A',
        type: emp.jobType || emp.type || 'N/A',
      }));

      setEmployees(mappedEmployees);
      
      // Extract unique departments, roles, and types for filters
      const departments = [...new Set(mappedEmployees.map(emp => emp.department).filter(Boolean))] as string[];
      const roles = [...new Set(mappedEmployees.map(emp => emp.role).filter(Boolean))] as string[];
      const types = [...new Set(mappedEmployees.map(emp => emp.jobType || emp.type).filter(t => Boolean(t) && t !== 'N/A'))] as string[];
      setAvailableDepartments(departments);
      setAvailableRoles(roles);
      setAvailableTypes(types);
    } catch (error) {
      console.error('Error fetching employees:', error);
      Alert.alert('Error', 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Refresh employees when screen comes into focus (e.g., after editing)
  useFocusEffect(
    React.useCallback(() => {
      fetchEmployees();
    }, [])
  );

  const handleSelectEmployee = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (filteredEmployees.length === 0) {
      return;
    }
    if (selectedIds.length === filteredEmployees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEmployees.map(emp => emp._id));
    }
  };

  const handleDeleteEmployee = (id: string) => {
    Alert.alert(
      'Delete Employee',
      'Are you sure you want to delete this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteEmployee(id) },
      ],
    );
  };

  const deleteEmployee = async (id: string) => {
    try {
      await callApi({ method: 'DELETE', url: `/employee/deleteOne/${id}` });
      setEmployees(prev => prev.filter(emp => emp._id !== id));
      setSelectedIds(prev => prev.filter(empId => empId !== id));
      Alert.alert('Success', 'Employee deleted successfully');
      // Refresh the list
      fetchEmployees();
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete employee';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleEditEmployee = (id: string) => {
    (navigation as any).navigate('EditEmployee', { employeeId: id });
  };

  const handleViewEmployee = (id: string) => {
    (navigation as any).navigate('EmployeeDetail', { employeeId: id });
  };

  const filteredEmployees = employees.filter(emp => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        (emp.firstName || '').toLowerCase().includes(search) ||
        (emp.lastName || '').toLowerCase().includes(search) ||
        (emp.email || '').toLowerCase().includes(search) ||
        (emp.position || '').toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }
    
    // Department filter
    if (filters.department && emp.department !== filters.department) {
      return false;
    }
    
    // Role filter
    if (filters.role && emp.role !== filters.role) {
      return false;
    }
    
    // Gender filter
    if (filters.gender && emp.gender !== filters.gender) {
      return false;
    }
    
    // Status filter
    if (filters.status && emp.status !== filters.status) {
      return false;
    }
    
    // Type filter
    if (filters.type && (emp.jobType || emp.type) !== filters.type) {
      return false;
    }
    
    return true;
  });

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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Employees</Text>

        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor="#666"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <TouchableOpacity
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter-list" size={16} color={showFilters ? "#FF6B35" : "#666"} />
            <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={async () => {
              const employeesToExport = selectedIds.length > 0 
                ? employees.filter(emp => selectedIds.includes(emp._id))
                : filteredEmployees;
              
              if (!employeesToExport.length) {
                Alert.alert('Export', 'No employees to export.');
                return;
              }

              try {
                // Format dates properly for export
                const formatDateForExport = (dateString: string) => {
                  if (!dateString || dateString === 'N/A') return 'N/A';
                  try {
                    const date = new Date(dateString);
                    if (isNaN(date.getTime())) return 'N/A';
                    return date.toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    });
                  } catch {
                    return dateString;
                  }
                };

                const exportData = employeesToExport.map(emp => ({
                  name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'N/A',
                  email: emp.email || 'N/A',
                  position: emp.position || 'N/A',
                  department: emp.department || 'N/A',
                  role: emp.role || 'N/A',
                  contact: emp.contactNumber || emp.contact || 'N/A',
                  joiningDate: formatDateForExport(emp.hireDate || emp.joiningDate || ''),
                  gender: emp.gender || 'N/A',
                  status: emp.status || 'Active',
                }));

                await exportToXlsx({
                  filename: `employees_${new Date().toISOString().split('T')[0]}`,
                  columns: [
                    { key: 'name', header: 'Name' },
                    { key: 'email', header: 'Email' },
                    { key: 'position', header: 'Position' },
                    { key: 'department', header: 'Department' },
                    { key: 'role', header: 'Role' },
                    { key: 'contact', header: 'Contact' },
                    { key: 'joiningDate', header: 'Joining Date' },
                    { key: 'gender', header: 'Gender' },
                    { key: 'status', header: 'Status' },
                  ],
                  rows: exportData,
                });
                Alert.alert('Success', `Exported ${employeesToExport.length} employee(s) successfully. The file has been saved to your Downloads folder.`);
              } catch (error: any) {
                console.error('Failed to export employees to XLSX:', error);
                Alert.alert('Export Error', error?.message || 'Failed to export employees. Please try again.');
              }
            }}
          >
            <Icon name="download" size={16} color="white" />
            <Text style={styles.exportText}>Export {selectedIds.length > 0 ? `(${selectedIds.length})` : 'All'}</Text>
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

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filter Employees</Text>
          <View style={styles.filtersRow}>
            <SearchableSelect
              label="Department"
              placeholder="All Departments"
              options={[
                { value: '', label: 'All Departments' },
                ...availableDepartments.map(dept => ({
                  value: dept,
                  label: dept,
                })),
              ]}
              value={filters.department}
              onChange={(value) => {
                setFilters({ ...filters, department: value });
                setPage(1);
              }}
              containerStyle={styles.filterSelect}
            />
            
            <SearchableSelect
              label="Role"
              placeholder="All Roles"
              options={[
                { value: '', label: 'All Roles' },
                ...availableRoles.map(role => ({
                  value: role,
                  label: role,
                })),
              ]}
              value={filters.role}
              onChange={(value) => {
                setFilters({ ...filters, role: value });
                setPage(1);
              }}
              containerStyle={styles.filterSelect}
            />
            
            <SearchableSelect
              label="Gender"
              placeholder="All Genders"
              options={[
                { value: '', label: 'All Genders' },
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
              value={filters.gender}
              onChange={(value) => {
                setFilters({ ...filters, gender: value });
                setPage(1);
              }}
              containerStyle={styles.filterSelect}
            />
            
            <SearchableSelect
              label="Status"
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'On Leave', label: 'On Leave' },
              ]}
              value={filters.status}
              onChange={(value) => {
                setFilters({ ...filters, status: value });
                setPage(1);
              }}
              containerStyle={styles.filterSelect}
            />
            
            <SearchableSelect
              label="Type"
              placeholder="All Types"
              options={[
                { value: '', label: 'All Types' },
                ...availableTypes.map(type => ({
                  value: type,
                  label: type,
                })),
              ]}
              value={filters.type}
              onChange={(value) => {
                setFilters({ ...filters, type: value });
                setPage(1);
              }}
              containerStyle={styles.filterSelect}
            />
          </View>
          
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={() => {
              setFilters({ department: '', role: '', gender: '', status: '', type: '' });
              setPage(1);
            }}
          >
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Table */}
      <ScrollView
        showsVerticalScrollIndicator
        horizontal
        showsHorizontalScrollIndicator
        style={styles.tableScrollContainer}
      >
          <View style={styles.tableContainer}>
          {/* Header row */}
          <View style={styles.tableHeader}>
            <TouchableOpacity style={styles.checkboxHeader} onPress={handleSelectAll}>
              <Icon
                name={
                  selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0
                    ? 'check-box'
                    : 'check-box-outline-blank'
                }
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            <Text style={[styles.headerText, styles.srCol]}>SR#</Text>
            <Text style={[styles.headerText, styles.nameCol]}>NAME</Text>
            <Text style={[styles.headerText, styles.emailCol]}>EMAIL</Text>
            <Text style={[styles.headerText, styles.positionCol]}>POSITION</Text>
            <Text style={[styles.headerText, styles.contactCol]}>CONTACT</Text>
            <Text style={[styles.headerText, styles.joiningCol]}>JOINING DATE</Text>
            <Text style={[styles.headerText, styles.genderCol]}>GENDER</Text>
            <Text style={[styles.headerText, styles.actionsCol]}>AC</Text>
          </View>

          {/* Rows */}
          {filteredEmployees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {employees.length === 0
                  ? 'No employees found'
                  : `No employees match "${searchTerm}"`}
              </Text>
            </View>
          ) : (
            paginatedEmployees.map((employee, index) => (
              <TouchableOpacity
                key={employee._id}
                style={styles.tableRow}
                activeOpacity={0.7}
                onPress={() => handleViewEmployee(employee._id)}
              >
                <TouchableOpacity
                  style={styles.checkboxCell}
                  onPress={e => {
                    e.stopPropagation();
                    handleSelectEmployee(employee._id);
                  }}
                >
                  <Icon
                    name={
                      selectedIds.includes(employee._id)
                        ? 'check-box'
                        : 'check-box-outline-blank'
                    }
                    size={20}
                    color={selectedIds.includes(employee._id) ? '#FF6B35' : '#666'}
                  />
                </TouchableOpacity>

                <Text style={[styles.cellText, styles.srCol]}>{startIndex + index + 1}</Text>

                <View style={styles.nameCell}>
                  <View style={styles.avatarContainer}>
                    {employee.avatar ? (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>IMG</Text>
                      </View>
                    ) : (
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {getInitials(employee.firstName, employee.lastName)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.nameText}>
                    {employee.firstName} {employee.lastName}
                  </Text>
                </View>

                <Text style={[styles.cellText, styles.emailCol]}>{employee.email}</Text>
                <Text style={[styles.cellText, styles.positionCol]}>{employee.position}</Text>
                <Text style={[styles.cellText, styles.contactCol]}>
                  {employee.contactNumber || employee.contact || 'N/A'}
                </Text>
                <Text style={[styles.cellText, styles.joiningCol]}>
                  {formatDate(employee.hireDate || employee.joiningDate)}
                </Text>
                <Text style={[styles.cellText, styles.genderCol]}>{employee.gender}</Text>

                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditEmployee(employee._id)}
                  >
                    <Icon name="edit" size={16} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteEmployee(employee._id)}
                  >
                    <Icon name="delete" size={16} color="#F44336" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
      
      {/* Pagination footer */}
      {filteredEmployees.length > 0 && (
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationText}>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} employees
          </Text>
          <View style={styles.paginationButtons}>
            <TouchableOpacity
              style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
              disabled={currentPage === 1}
              onPress={() => setPage(prev => Math.max(1, prev - 1))}
            >
              <Text
                style={[
                  styles.pageButtonText,
                  currentPage === 1 && styles.pageButtonTextDisabled,
                ]}
              >
                Prev
              </Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              Page {currentPage} of {totalPages}
            </Text>
            <TouchableOpacity
              style={[
                styles.pageButton,
                currentPage === totalPages && styles.pageButtonDisabled,
              ]}
              disabled={currentPage === totalPages}
              onPress={() => setPage(prev => Math.min(totalPages, prev + 1))}
            >
              <Text
                style={[
                  styles.pageButtonText,
                  currentPage === totalPages && styles.pageButtonTextDisabled,
                ]}
              >
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
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
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
    minWidth: 280,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterButtonActive: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7ED',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#FF6B35',
  },
  filtersContainer: {
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  filterSelect: {
    flex: 1,
    minWidth: 150,
  },
  clearFiltersButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  exportButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exportText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  tableScrollContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableContainer: {
    minWidth: 1100,
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
  srCol: { width: 60 },
  nameCol: { width: 180 },
  emailCol: { width: 180 },
  positionCol: { width: 140 },
  contactCol: { width: 140 },
  joiningCol: { width: 140 },
  genderCol: { width: 100 },
  actionsCol: { width: 80 },
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
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 180,
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  actionsContainer: {
    width: 80,
    alignItems: 'center',
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
    marginVertical: 2,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  paginationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  paginationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF6B35',
    backgroundColor: 'white',
    minWidth: 70,
    alignItems: 'center',
  },
  pageButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  pageButtonTextDisabled: {
    color: '#9CA3AF',
  },
  pageIndicator: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    minWidth: 100,
    textAlign: 'center',
  },
});

export default EmployeeTable;


