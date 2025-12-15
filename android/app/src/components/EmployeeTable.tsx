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
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import { exportToCsv } from '../utills/utills';

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
}

const EmployeeTable: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchEmployees();
  }, []);

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
      }));

      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      Alert.alert('Error', 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(empId => empId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map(emp => emp._id));
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
      await callApi({ method: 'DELETE', url: `/employee/${id}` });
      setEmployees(prev => prev.filter(emp => emp._id !== id));
      Alert.alert('Success', 'Employee deleted successfully');
    } catch (error) {
      console.error('Error deleting employee:', error);
      Alert.alert('Error', 'Failed to delete employee');
    }
  };

  const handleEditEmployee = (id: string) => {
    (navigation as any).navigate('EditEmployee', { employeeId: id });
  };

  const handleViewEmployee = (id: string) => {
    (navigation as any).navigate('EmployeeDetail', { employeeId: id });
  };

  const filteredEmployees = employees.filter(emp => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (emp.firstName || '').toLowerCase().includes(search) ||
      (emp.lastName || '').toLowerCase().includes(search) ||
      (emp.email || '').toLowerCase().includes(search) ||
      (emp.position || '').toLowerCase().includes(search)
    );
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
            style={styles.filterButton}
            onPress={() => {
              Alert.alert('Filter', 'Filter options will be available here');
            }}
          >
            <Icon name="filter-list" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              if (!employees.length) {
                Alert.alert('Export', 'No employees to export.');
                return;
              }
              exportToCsv({
                filename: 'employees.csv',
                columns: [
                  { key: 'name', header: 'Name' },
                  { key: 'email', header: 'Email' },
                  { key: 'position', header: 'Position' },
                  { key: 'contact', header: 'Contact' },
                  { key: 'joiningDate', header: 'Joining Date' },
                  { key: 'gender', header: 'Gender' },
                ],
                rows: employees.map(emp => ({
                  name: `${emp.firstName} ${emp.lastName}`,
                  email: emp.email,
                  position: emp.position,
                  contact: emp.contactNumber || emp.contact || 'N/A',
                  joiningDate: emp.hireDate || emp.joiningDate || 'N/A',
                  gender: emp.gender,
                })),
              });
            }}
          >
            <Icon name="download" size={16} color="white" />
            <Text style={styles.exportText}>Export All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => (navigation as any).navigate('CreateEmployee')}
          >
            <Icon name="add" size={16} color="white" />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

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
                  selectedIds.length === employees.length && employees.length > 0
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
            filteredEmployees.map((employee, index) => (
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

                <Text style={[styles.cellText, styles.srCol]}>{index + 1}</Text>

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
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
});

export default EmployeeTable;


