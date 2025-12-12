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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import useAxios from '../hooks/useAxios';
import { formatDate, exportToCsv } from '../utills/utills';

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

  useEffect(() => {
    loadDepartment();
  }, [departmentId]);

  useEffect(() => {
    if (departmentId) {
      loadEmployees();
    }
  }, [departmentId, page, search]);

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

      console.log('Fetching employees with params:', params);
      const response = await callApi({
        method: 'GET',
        url: `/departments/${departmentId}/employees`,
        params,
      });

      console.log('Employees API response:', response);

      const employeesData = response?.employees || response?.data || [];
      const total = response?.total || employeesData.length;

      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setTotalEmployees(total);
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

  const handleExport = async () => {
    try {
      Alert.alert('Export', 'Exporting all employees...');
      
      const params: any = {
        page: 1,
        limit: 1000000,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await callApi({
        method: 'GET',
        url: `/departments/${departmentId}/employees`,
        params,
      });

      const allEmployees = response?.employees || response?.data || [];

      // Use the exportToCsv utility
      await exportToCsv({
        filename: `${department?.name || 'Department'}_Employees_${new Date().toISOString().split('T')[0]}`,
        columns: [
          { key: 'sr', header: 'SR#' },
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'position', header: 'Position' },
          { key: 'contact', header: 'Contact' },
          { key: 'joiningDate', header: 'Joining Date' },
          { key: 'gender', header: 'Gender' },
        ],
        rows: allEmployees.map((emp: Employee, index: number) => ({
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
      Alert.alert('Error', 'Failed to export employees');
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
            <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
              <Feather name="download" size={16} color="#fff" />
              <Text style={styles.exportButtonText}>Export All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: 700 }}>
            <View style={styles.tableHead}>
              <Text style={[styles.headCell, { width: 50 }]}>SR#</Text>
              <Text style={[styles.headCell, { width: 150 }]}>NAME</Text>
              <Text style={[styles.headCell, { width: 180 }]}>EMAIL</Text>
              <Text style={[styles.headCell, { width: 120 }]}>POSITION</Text>
              <Text style={[styles.headCell, { width: 120 }]}>CONTACT</Text>
              <Text style={[styles.headCell, { width: 120 }]}>JOINING DATE</Text>
              <Text style={[styles.headCell, { width: 100 }]}>GENDER</Text>
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
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
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
});

export default DepartmentDetailScreen;

