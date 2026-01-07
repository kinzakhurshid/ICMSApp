import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import { formatDate, exportToXlsx } from '../utills/utills';
import SearchableSelect from '../components/SearchableSelect';

const PAGE_SIZE = 10;

interface Department {
  _id: string;
  name: string;
  description?: string;
  admin?: {
    _id: string;
    name?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
  history?: Array<{
    date: string;
    employeeCount: number;
  }>;
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  profileImage?: string;
  hireDate?: string;
  contactNumber?: string;
  gender?: string;
  isActive?: boolean;
  status?: string;
}

const DepartmentDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { departmentId } = route.params as { departmentId: string };
  const { callApi } = useAxios();

  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    position: '',
    status: '',
  });
  
  // Add employee modal
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [addingEmployees, setAddingEmployees] = useState(false);
  const [removingEmployeeId, setRemovingEmployeeId] = useState<string | null>(null);
  
  // Available filter options
  const [availablePositions, setAvailablePositions] = useState<string[]>([]);
  const [availableGenders, setAvailableGenders] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  useEffect(() => {
    loadDepartment();
  }, [departmentId]);

  useEffect(() => {
    if (departmentId) {
      loadEmployees();
    }
  }, [departmentId, page, search, filters]);

  useEffect(() => {
    loadAllEmployeesForSelection();
  }, []);

  const loadDepartment = async () => {
    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: `/departments/${departmentId}`,
      });

      console.log('Department API response:', response);
      setDepartment(response || null);
    } catch (error: any) {
      console.error('Error loading department:', error);
      Alert.alert('Error', error?.message || 'Failed to load department');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const params: any = {
        page,
        limit: PAGE_SIZE,
      };

      if (search.trim()) {
        params.search = search.trim();
      }
      
      // Add filter params
      if (filters.gender) {
        params.gender = filters.gender;
      }
      if (filters.position) {
        params.position = filters.position;
      }
      if (filters.status) {
        params.status = filters.status;
      }

      console.log('Fetching employees with params:', params);
      const response = await callApi({
        method: 'GET',
        url: `/departments/${departmentId}/employees`,
        params,
      });

      console.log('Employees API response:', response);

      const employeesData = response?.employees || response?.data || [];
      const total = response?.total || employeesData.length;

      const mappedEmployees = Array.isArray(employeesData) ? employeesData : [];
      setEmployees(mappedEmployees);
      setTotalEmployees(total);
      
      // Extract available filter options
      const positions = [...new Set(mappedEmployees.map((e: Employee) => e.position).filter(Boolean))] as string[];
      const genders = [...new Set(mappedEmployees.map((e: Employee) => e.gender).filter(Boolean))] as string[];
      const statuses = [...new Set(mappedEmployees.map((e: Employee) => e.status).filter(Boolean))] as string[];
      setAvailablePositions(positions);
      setAvailableGenders(genders);
      setAvailableStatuses(statuses);
    } catch (error: any) {
      console.error('Error loading employees:', error);
      setEmployees([]);
      setTotalEmployees(0);
    } finally {
      setEmployeesLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDepartment();
    if (page === 1) {
      await loadEmployees();
    } else {
      setPage(1);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Department',
      `Are you sure you want to delete "${department?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDeleteConfirmed,
        },
      ]
    );
  };

  const handleDeleteConfirmed = async () => {
    if (!department || !departmentId) return;

    setDeleting(true);
    try {
      const response = await callApi({
        method: 'DELETE',
        url: `/departments/${departmentId}`,
      });

      if (response?.success !== false) {
        Alert.alert('Success', `Department "${department.name}" deleted successfully`, [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', response?.message || 'Failed to delete department');
      }
    } catch (error: any) {
      console.error('Error deleting department:', error);
      Alert.alert('Error', error?.message || 'Failed to delete department');
    } finally {
      setDeleting(false);
    }
  };

  const loadAllEmployeesForSelection = async () => {
    try {
      const response = await callApi({
        method: 'GET',
        url: '/employee',
      });
      
      const employeesData = Array.isArray(response) ? response : (response?.data || []);
      setAllEmployees(employeesData.map((emp: any) => ({
        _id: emp._id || emp.id || '',
        firstName: emp.firstName || emp.fullName?.split(' ')[0] || '',
        lastName: emp.lastName || emp.fullName?.split(' ').slice(1).join(' ') || '',
        email: emp.email || '',
        position: emp.position || emp.designation || '',
        contactNumber: emp.contactNumber || emp.contact || '',
        hireDate: emp.hireDate || emp.joiningDate || '',
        gender: emp.gender || '',
        isActive: emp.isActive !== false,
        status: emp.status || '',
      })));
    } catch (error: any) {
      console.error('Error loading all employees:', error);
    }
  };

  const handleAddEmployees = async () => {
    if (selectedEmployeeIds.length === 0) {
      Alert.alert('Error', 'Please select at least one employee');
      return;
    }

    if (!department || !departmentId) {
      Alert.alert('Error', 'Department data not loaded');
      return;
    }

    setAddingEmployees(true);
    try {
      // Employees are assigned to departments by updating each employee's department field
      // First fetch each employee's data, then update with department included
      const updatePromises = selectedEmployeeIds.map(async (employeeId) => {
        try {
          // Fetch current employee data first
          const employeeData = await callApi({
            method: 'GET',
            url: `/employee/${employeeId}`,
          });
          
          // Create FormData with all existing employee fields plus the new department
          const formData = new FormData();
          
          // Add all required fields from existing employee data
          if (employeeData.firstName) formData.append('firstName', employeeData.firstName);
          if (employeeData.lastName) formData.append('lastName', employeeData.lastName);
          if (employeeData.email) formData.append('email', employeeData.email);
          if (employeeData.contactNumber) formData.append('contactNumber', employeeData.contactNumber);
          if (employeeData.role) formData.append('role', employeeData.role);
          if (employeeData.position) formData.append('position', employeeData.position);
          if (employeeData.status) formData.append('status', employeeData.status);
          if (employeeData.hireDate) formData.append('hireDate', employeeData.hireDate);
          if (employeeData.salary) formData.append('salary', String(employeeData.salary));
          if (employeeData.gender) formData.append('gender', employeeData.gender);
          if (employeeData.city) formData.append('city', employeeData.city);
          if (employeeData.state) formData.append('state', employeeData.state);
          if (employeeData.nationality) formData.append('nationality', employeeData.nationality);
          if (employeeData.maritalStatus) formData.append('maritalStatus', employeeData.maritalStatus);
          if (employeeData.dateOfBirth) formData.append('dateOfBirth', employeeData.dateOfBirth);
          if (employeeData.taxId) formData.append('taxId', employeeData.taxId);
          
          // Add the department field (this is what we're updating)
          formData.append('department', departmentId);
          
          // Add organization if present
          if (employeeData.organization) {
            formData.append('organization', employeeData.organization);
          } else if (department?.organization) {
            formData.append('organization', department.organization);
          }
          
          // Add optional fields if they exist
          if (employeeData.emergencyContact) {
            formData.append('emergencyContact', JSON.stringify(employeeData.emergencyContact));
          }
          if (employeeData.education) {
            formData.append('education', JSON.stringify(employeeData.education));
          }
          if (employeeData.bankAccount) {
            formData.append('bankAccount', JSON.stringify(employeeData.bankAccount));
          }
          if (employeeData.skills && Array.isArray(employeeData.skills)) {
            formData.append('skills', JSON.stringify(employeeData.skills));
          }
          if (employeeData.experiences && Array.isArray(employeeData.experiences)) {
            formData.append('experiences', JSON.stringify(employeeData.experiences));
          }
          
          return callApi({
            method: 'PUT',
            url: `/employee/updateOne/${employeeId}`,
            data: formData,
          });
        } catch (fetchError: any) {
          console.error(`Error fetching employee ${employeeId}:`, fetchError);
          throw fetchError;
        }
      });

      const results = await Promise.allSettled(updatePromises);
      
      // Check for failures
      const failures = results.filter(result => result.status === 'rejected');
      const successes = results.filter(result => result.status === 'fulfilled');
      
      console.log(`Successfully updated ${successes.length} out of ${selectedEmployeeIds.length} employees`);
      
      // Helper function to refresh after adding
      const handleRefreshAfterAdd = () => {
        // Reload department first to update employee count
        loadDepartment();
        
        // Reset to page 1 and clear filters to show new employees
        // This will trigger the useEffect to reload employees with fresh data
        // Add a longer delay to ensure API has fully processed the update
        setTimeout(() => {
          setPage(1);
          setSearch('');
          setFilters({
            gender: '',
            position: '',
            status: '',
          });
          
          // Force reload employees after state updates
          setTimeout(() => {
            loadEmployees();
          }, 100);
        }, 500);
      };
      
      if (failures.length > 0) {
        console.error('Some employee updates failed:', failures);
        const errorMessages = failures.map((f: any) => f.reason?.message || f.reason?.response?.data?.error || 'Unknown error').join(', ');
        Alert.alert(
          'Partial Success', 
          `${successes.length} employees added successfully. ${failures.length} failed: ${errorMessages}`,
          [
            {
              text: 'OK',
              onPress: handleRefreshAfterAdd,
            },
          ]
        );
      } else {
        // All succeeded
        Alert.alert('Success', 'Employees added successfully', [
          {
            text: 'OK',
            onPress: handleRefreshAfterAdd,
          },
        ]);
      }
      
      // Close modal and reset selection
      setShowAddEmployeeModal(false);
      setSelectedEmployeeIds([]);
      setEmployeeSearchQuery('');
    } catch (error: any) {
      console.error('Error adding employees:', error);
      Alert.alert('Error', error?.response?.data?.error || error?.message || 'Failed to add employees');
    } finally {
      setAddingEmployees(false);
    }
  };

  const handleRemoveEmployee = async (employeeId: string) => {
    const employee = employees.find(e => e._id === employeeId);
    const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : 'this employee';
    
    Alert.alert(
      'Remove Employee',
      `Are you sure you want to remove ${employeeName} from this department?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingEmployeeId(employeeId);
            try {
              const response = await callApi({
                method: 'DELETE',
                url: `/departments/${departmentId}/employees/${employeeId}`,
              });

              if (response?.success !== false) {
                Alert.alert('Success', 'Employee removed successfully');
                loadEmployees();
                loadDepartment(); // Refresh department to update employee count
              } else {
                Alert.alert('Error', response?.message || 'Failed to remove employee');
              }
            } catch (error: any) {
              console.error('Error removing employee:', error);
              Alert.alert('Error', error?.response?.data?.error || error?.message || 'Failed to remove employee');
            } finally {
              setRemovingEmployeeId(null);
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const params: any = {
        page: 1,
        limit: 1000000,
      };

      if (search.trim()) {
        params.search = search.trim();
      }
      
      // Add filter params for export
      if (filters.gender) {
        params.gender = filters.gender;
      }
      if (filters.position) {
        params.position = filters.position;
      }
      if (filters.status) {
        params.status = filters.status;
      }

      const response = await callApi({
        method: 'GET',
        url: `/departments/${departmentId}/employees`,
        params,
      });

      const allEmployeesData = response?.employees || response?.data || [];
      
      if (!allEmployeesData || allEmployeesData.length === 0) {
        Alert.alert('Info', 'No employees to export');
        return;
      }

      // Use the XLSX export utility
      await exportToXlsx({
        filename: `${department?.name || 'Department'}_Employees_${new Date()
          .toISOString()
          .split('T')[0]}`,
        columns: [
          { key: 'sr', header: 'SR#' },
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'position', header: 'Position' },
          { key: 'contact', header: 'Contact' },
          { key: 'joiningDate', header: 'Joining Date' },
          { key: 'gender', header: 'Gender' },
        ],
        rows: allEmployeesData.map((emp: Employee, index: number) => ({
          sr: index + 1,
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          email: emp.email || '',
          position: emp.position || '',
          contact: emp.contactNumber || '',
          joiningDate: emp.hireDate ? formatDate(emp.hireDate) : '',
          gender: emp.gender || '',
        })),
      });
    } catch (error: any) {
      console.error('Error exporting employees:', error);
      Alert.alert('Error', error?.response?.data?.error || error?.message || 'Failed to export employees');
    }
  };

  const formatDateDisplay = (value?: string) => {
    if (!value) return '-';
    try {
      return formatDate(value);
    } catch {
      return value;
    }
  };

  const getAdminName = (admin?: Department['admin']) => {
    if (!admin) return 'N/A';
    if (admin.name) return admin.name;
    if (admin.firstName || admin.lastName) {
      return `${admin.firstName || ''} ${admin.lastName || ''}`.trim();
    }
    return admin.email || 'N/A';
  };

  const getEmployeeName = (emp: Employee) => {
    return `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'N/A';
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  const totalPages = Math.max(1, Math.ceil(totalEmployees / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FB923C" />
        <Text style={styles.loadingText}>Loading department...</Text>
      </View>
    );
  }

  if (!department) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Department Details</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Department not found</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Department Details</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Department Info Card */}
      <View style={styles.departmentCard}>
        <View style={styles.departmentHeader}>
          <View style={styles.departmentImageContainer}>
            {department.profilePicture ? (
              <Image source={{ uri: department.profilePicture }} style={styles.departmentImage} />
            ) : (
              <View style={styles.departmentImagePlaceholder}>
                <Ionicons name="business" size={40} color="#9CA3AF" />
              </View>
            )}
          </View>
          <View style={styles.departmentInfo}>
            <Text style={styles.departmentName}>{department.name}</Text>
            {department.description && (
              <Text style={styles.departmentDescription}>{department.description}</Text>
            )}
            <View style={styles.departmentMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="people" size={16} color="#6B7280" />
                <Text style={styles.metaText}>{totalEmployees} employees</Text>
              </View>
              {department.createdAt && (
                <View style={styles.metaItem}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>Created: {formatDateDisplay(department.createdAt)}</Text>
                </View>
              )}
              {department.admin && (
                <View style={styles.metaItem}>
                  <Ionicons name="person-outline" size={16} color="#6B7280" />
                  <Text style={styles.metaText}>Admin: {getAdminName(department.admin)}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => {
                // Navigate to edit screen
                (navigation as any).navigate('EditDepartment', { departmentId: department._id });
              }}
            >
              <Ionicons name="create-outline" size={20} color="#FB923C" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Employees Section */}
      <View style={styles.employeesCard}>
        <View style={styles.employeesHeader}>
          <Text style={styles.employeesTitle}>Employees ({totalEmployees})</Text>
          <View style={styles.employeesActions}>
            <View style={styles.employeesActionsRow}>
              <View style={styles.searchContainer}>
                <Feather name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
                <TextInput
                  value={search}
                  onChangeText={text => {
                    setSearch(text);
                    setPage(1);
                  }}
                  placeholder="Search..."
                  placeholderTextColor="#9CA3AF"
                  style={styles.searchInput}
                />
              </View>
              <TouchableOpacity
                style={[styles.filterButton, showFilters && styles.filterButtonActive]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Feather name="filter" size={16} color={showFilters ? "#fff" : "#111827"} />
                <Text style={[styles.filterButtonText, showFilters && styles.filterButtonTextActive]}>
                  Filters
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddEmployeeModal(true)}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.employeesActionsRow}>
              <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                <Feather name="download" size={16} color="#fff" />
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Filters Section */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersRow}>
              <View style={styles.filterItem}>
                <SearchableSelect
                  placeholder="Select Gender"
                  options={[
                    { value: '', label: 'All Genders' },
                    ...availableGenders.map(g => ({ value: g, label: g })),
                  ]}
                  value={filters.gender}
                  onChange={(value) => {
                    setFilters(prev => ({ ...prev, gender: value }));
                    setPage(1);
                  }}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={styles.filterItem}>
                <SearchableSelect
                  placeholder="Select Position"
                  options={[
                    { value: '', label: 'All Positions' },
                    ...availablePositions.map(p => ({ value: p, label: p })),
                  ]}
                  value={filters.position}
                  onChange={(value) => {
                    setFilters(prev => ({ ...prev, position: value }));
                    setPage(1);
                  }}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <View style={styles.filterItem}>
                <SearchableSelect
                  placeholder="Select Status"
                  options={[
                    { value: '', label: 'All Statuses' },
                    ...availableStatuses.map(s => ({ value: s, label: s })),
                  ]}
                  value={filters.status}
                  onChange={(value) => {
                    setFilters(prev => ({ ...prev, status: value }));
                    setPage(1);
                  }}
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setFilters({ gender: '', position: '', status: '' });
                  setPage(1);
                }}
              >
                <Text style={styles.clearFiltersText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 800 }}>
            <View style={styles.tableHead}>
              <Text style={[styles.headCell, { width: 50 }]}>SR#</Text>
              <Text style={[styles.headCell, { width: 150 }]}>NAME</Text>
              <Text style={[styles.headCell, { width: 180 }]}>EMAIL</Text>
              <Text style={[styles.headCell, { width: 120 }]}>POSITION</Text>
              <Text style={[styles.headCell, { width: 120 }]}>CONTACT</Text>
              <Text style={[styles.headCell, { width: 120 }]}>JOINING DATE</Text>
              <Text style={[styles.headCell, { width: 100 }]}>GENDER</Text>
              <Text style={[styles.headCell, { width: 80 }]}>ACTIONS</Text>
            </View>
            {employeesLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FB923C" />
              </View>
            ) : employees.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No employees found.</Text>
              </View>
            ) : (
              employees.map((employee, index) => (
                <View key={employee._id} style={styles.tableRow}>
                  <Text style={[styles.cell, { width: 50 }]}>
                    {(page - 1) * PAGE_SIZE + index + 1}
                  </Text>
                  <View style={[styles.cell, { width: 150, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                    {employee.profileImage ? (
                      <Image source={{ uri: employee.profileImage }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarInitials}>
                          {getInitials(employee.firstName, employee.lastName)}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.nameText} numberOfLines={1}>
                      {getEmployeeName(employee)}
                    </Text>
                  </View>
                  <Text style={[styles.cell, { width: 180 }]} numberOfLines={1}>
                    {employee.email || '-'}
                  </Text>
                  <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>
                    {employee.position || '-'}
                  </Text>
                  <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>
                    {employee.contactNumber || '-'}
                  </Text>
                  <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>
                    {formatDateDisplay(employee.hireDate)}
                  </Text>
                  <Text style={[styles.cell, { width: 100 }]} numberOfLines={1}>
                    {employee.gender ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1) : '-'}
                  </Text>
                  <View style={[styles.cell, { width: 80, flexDirection: 'row', gap: 8, justifyContent: 'center' }]}>
                    {removingEmployeeId === employee._id ? (
                      <ActivityIndicator size="small" color="#F44336" />
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleRemoveEmployee(employee._id)}
                        style={styles.deleteEmployeeButton}
                      >
                        <Icon name="delete" size={16} color="#F44336" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={styles.tableFooter}>
          <Text style={styles.footerText}>
            Showing {(employees.length && (page - 1) * PAGE_SIZE + 1) || 0}-
            {(page - 1) * PAGE_SIZE + employees.length} of {totalEmployees} entries
          </Text>
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, !canPrev && styles.pageBtnDisabled]}
              disabled={!canPrev}
              onPress={() => setPage(prev => Math.max(1, prev - 1))}
            >
              <Text style={[styles.pageBtnText, !canPrev && styles.pageBtnTextDisabled]}>Prev</Text>
            </TouchableOpacity>
            <Text style={styles.pageIndicator}>
              Page {Math.min(page, totalPages)} of {totalPages}
            </Text>
            <TouchableOpacity
              style={[styles.pageBtn, !canNext && styles.pageBtnDisabled]}
              disabled={!canNext}
              onPress={() => setPage(prev => Math.min(totalPages, prev + 1))}
            >
              <Text style={[styles.pageBtnText, !canNext && styles.pageBtnTextDisabled]}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add Employee Modal */}
      <Modal
        visible={showAddEmployeeModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAddEmployeeModal(false);
          setSelectedEmployeeIds([]);
          setEmployeeSearchQuery('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Employees to Department</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddEmployeeModal(false);
                  setSelectedEmployeeIds([]);
                  setEmployeeSearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color="#111827" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalSearchContainer}>
              <Feather name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search employees..."
                placeholderTextColor="#9CA3AF"
                value={employeeSearchQuery}
                onChangeText={setEmployeeSearchQuery}
              />
            </View>

            <ScrollView style={styles.modalEmployeeList}>
              {allEmployees
                .filter(emp => {
                  // Filter out employees already in the department
                  const isAlreadyInDept = employees.some(e => e._id === emp._id);
                  if (isAlreadyInDept) return false;
                  
                  // Filter by search query
                  if (employeeSearchQuery.trim()) {
                    const searchLower = employeeSearchQuery.toLowerCase();
                    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
                    const email = (emp.email || '').toLowerCase();
                    return fullName.includes(searchLower) || email.includes(searchLower);
                  }
                  return true;
                })
                .map(emp => {
                  const isSelected = selectedEmployeeIds.includes(emp._id);
                  return (
                    <TouchableOpacity
                      key={emp._id}
                      style={[styles.modalEmployeeItem, isSelected && styles.modalEmployeeItemSelected]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedEmployeeIds(prev => prev.filter(id => id !== emp._id));
                        } else {
                          setSelectedEmployeeIds(prev => [...prev, emp._id]);
                        }
                      }}
                    >
                      <View style={styles.modalEmployeeInfo}>
                        <Text style={styles.modalEmployeeName}>
                          {emp.firstName} {emp.lastName}
                        </Text>
                        {emp.email && <Text style={styles.modalEmployeeEmail}>{emp.email}</Text>}
                        {emp.position && <Text style={styles.modalEmployeePosition}>{emp.position}</Text>}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              {allEmployees.filter(emp => {
                const isAlreadyInDept = employees.some(e => e._id === emp._id);
                if (isAlreadyInDept) return false;
                if (employeeSearchQuery.trim()) {
                  const searchLower = employeeSearchQuery.toLowerCase();
                  const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
                  const email = (emp.email || '').toLowerCase();
                  return fullName.includes(searchLower) || email.includes(searchLower);
                }
                return true;
              }).length === 0 && (
                <View style={styles.modalEmptyState}>
                  <Text style={styles.modalEmptyText}>No employees available to add</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.modalFooterText}>
                {selectedEmployeeIds.length} employee{selectedEmployeeIds.length !== 1 ? 's' : ''} selected
              </Text>
              <View style={styles.modalFooterButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setShowAddEmployeeModal(false);
                    setSelectedEmployeeIds([]);
                    setEmployeeSearchQuery('');
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalAddButton, addingEmployees && styles.modalAddButtonDisabled]}
                  onPress={handleAddEmployees}
                  disabled={addingEmployees || selectedEmployeeIds.length === 0}
                >
                  {addingEmployees ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalAddButtonText}>Add Selected</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  departmentCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  departmentHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  departmentImageContainer: {
    width: 80,
    height: 80,
  },
  departmentImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  departmentImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  departmentInfo: {
    flex: 1,
  },
  departmentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  departmentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  departmentMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  employeesCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  employeesHeader: {
    marginBottom: 16,
  },
  employeesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  employeesActions: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  employeesActionsRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    minWidth: 160,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    color: '#111827',
    fontSize: 14,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FB923C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  headCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  cell: {
    fontSize: 13,
    color: '#374151',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  nameText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  loadingRow: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyRow: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 12,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FB923C',
  },
  pageBtnDisabled: {
    borderColor: '#E5E7EB',
  },
  pageBtnText: {
    color: '#FB923C',
    fontWeight: '600',
    fontSize: 13,
  },
  pageBtnTextDisabled: {
    color: '#9CA3AF',
  },
  pageIndicator: {
    fontSize: 13,
    color: '#111827',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterButtonActive: {
    backgroundColor: '#FB923C',
    borderColor: '#FB923C',
  },
  filterButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filtersContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'flex-end',
  },
  filterItem: {
    flex: 1,
    minWidth: 150,
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFiltersText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteEmployeeButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
  },
  modalEmployeeList: {
    maxHeight: 400,
  },
  modalEmployeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalEmployeeItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  modalEmployeeInfo: {
    flex: 1,
  },
  modalEmployeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  modalEmployeeEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  modalEmployeePosition: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalEmptyState: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalFooterText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  modalFooterButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalCancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  modalAddButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  modalAddButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalAddButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default DepartmentDetailScreen;

