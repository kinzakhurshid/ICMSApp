import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';
import AccessoryStatsChart from '../components/AccessoryStatsChart';
import AssignmentTable from '../components/AssignmentTable';
import AccessoryTable from '../components/AccessoryTable';
import AccessoryRequestTable from '../components/AccessoryRequestTable';
import DropdownField from '../components/task/DropdownField';
import FormField from '../components/task/FormField';

interface AccessoryStats {
  byCategory: { category: string; count: number }[];
  byCondition: { condition: string; count: number }[];
}

const AccessoriesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AccessoryStats>({
    byCategory: [],
    byCondition: [],
  });
  const [assignments, setAssignments] = useState<any[]>([]);
  const [accessories, setAccessories] = useState<any[]>([]);
  const [accessoryRequests, setAccessoryRequests] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [assignmentLimit, setAssignmentLimit] = useState(10);
  const [accessoryPage, setAccessoryPage] = useState(1);
  const [accessoryTotalPages, setAccessoryTotalPages] = useState(1);
  const [accessoryLimit, setAccessoryLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [accessorySearch, setAccessorySearch] = useState('');
  const [accessoryStatusFilter, setAccessoryStatusFilter] = useState('');
  const [accessoryCategoryFilter, setAccessoryCategoryFilter] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  // Accessory requests pagination/filter state
  const [requestPage, setRequestPage] = useState(1);
  const [requestTotalPages, setRequestTotalPages] = useState(1);
  const [requestLimit, setRequestLimit] = useState(10);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatus, setRequestStatus] = useState('');

  // Edit category modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [addCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        loadAccessories(1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [accessorySearch, accessoryStatusFilter, accessoryCategoryFilter, accessoryLimit]);

  useEffect(() => {
    if (!loading && (search || status)) {
      loadAssignments(1);
    }
  }, [assignmentLimit]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsRes = await callApi({ method: 'GET', url: '/accessories/stats' });
      setStats(statsRes || { byCategory: [], byCondition: [] });

      // Load accessories
      await loadAccessories(1);

      // Load categories
      const categoriesRes = await callApi({ method: 'GET', url: '/accessories/categories' });
      const categoryList: string[] = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes?.data || [];
      setCategories(categoryList);

      // Load employees
      const employeesRes = await callApi({ method: 'GET', url: '/employee' });
      setEmployees(employeesRes || []);

      // Load assignments
      await loadAssignments(1);
      // Load accessory requests
      await loadAccessoryRequests(1);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async (overridePage = page) => {
    try {
      const params = new URLSearchParams({
        page: String(overridePage),
        limit: String(assignmentLimit),
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      });
      
      const res = await callApi({
        method: 'GET',
        url: `/accessories/assignments?${params.toString()}`,
      });
      
      setAssignments(res?.data || []);
      setTotalPages(res?.totalPages || res?.pagination?.totalPages || 1);
      setPage(res?.page || overridePage);
    } catch (error) {
      console.error('Error loading assignments:', error);
      Alert.alert('Error', 'Failed to load assignments');
    }
  };

  const loadAccessoryRequests = async (overridePage = requestPage) => {
    try {
      const params: any = {
        page: String(overridePage),
        limit: String(requestLimit),
      };
      if (requestSearch) params.search = requestSearch;
      if (requestStatus) params.status = requestStatus;

      const res = await callApi({
        method: 'GET',
        url: '/accessory-requests/org',
        params,
      });

      const data = Array.isArray(res?.data) ? res.data : [];
      const total = typeof res?.total === 'number' ? res.total : data.length;

      setAccessoryRequests(data);
      setRequestTotalPages(Math.max(1, Math.ceil(total / requestLimit)));
      setRequestPage(overridePage);
    } catch (error) {
      console.error('Error loading accessory requests:', error);
      setAccessoryRequests([]);
    }
  };

  const loadAccessories = async (overridePage = accessoryPage) => {
    try {
      const params: any = {
        page: String(overridePage),
        limit: String(accessoryLimit),
      };
      if (accessorySearch) params.search = accessorySearch;
      if (accessoryStatusFilter) params.status = accessoryStatusFilter;
      if (accessoryCategoryFilter) params.category = accessoryCategoryFilter;

      const accessoriesRes = await callApi({
        method: 'GET',
        url: '/accessories',
        params,
      });

      let accessoriesData: any[] = [];
      if (Array.isArray(accessoriesRes?.data)) {
        accessoriesData = accessoriesRes.data;
        setAccessoryTotalPages(accessoriesRes.pagination?.totalPages || accessoriesRes.totalPages || 1);
      } else if (Array.isArray(accessoriesRes)) {
        accessoriesData = accessoriesRes;
        setAccessoryTotalPages(1);
      }

      setAccessories(accessoriesData);
      setAccessoryPage(accessoriesRes?.page || overridePage);
    } catch (error) {
      console.error('Error loading accessories:', error);
      setAccessories([]);
    }
  };

  const loadAllAccessories = async () => {
    try {
      const params: any = {
        page: 1,
        limit: 100000,
      };
      if (accessorySearch) params.search = accessorySearch;
      if (accessoryStatusFilter) params.status = accessoryStatusFilter;
      if (accessoryCategoryFilter) params.category = accessoryCategoryFilter;

      const response = await callApi({
        method: 'GET',
        url: '/accessories',
        params,
      });

      return Array.isArray(response?.data) ? response.data : response || [];
    } catch (error) {
      console.error('Error loading all accessories:', error);
      return [];
    }
  };

  const loadAllAssignments = async () => {
    try {
      return await callApi({
        method: 'GET',
        url: '/accessories/assignments',
        params: {
          limit: 10000,
          search,
          status,
        },
      });
    } catch (error) {
      console.error('Error loading all assignments:', error);
      return { data: [] };
    }
  };

  const loadAllAccessoryRequests = async () => {
    try {
      const res = await callApi({
        method: 'GET',
        url: '/accessory-requests/org',
        params: {
          page: 1,
          limit: 10000,
          search: requestSearch,
          status: requestStatus,
        },
      });
      return res;
    } catch (error) {
      console.error('Error loading all accessory requests:', error);
      return { data: [] };
    }
  };

  const handleEditCategories = () => {
    setSelectedCategory('');
    setNewCategoryName('');
    setCategoryError(null);
    setCategoryModalVisible(true);
  };

  const handleAddAccessory = () => {
    (navigation as any).navigate('CreateAccessory', { redirectTo: 'AccessoriesScreen' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Accessories Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>Dashboard / Accessories</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Accessory management</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.editButton} onPress={handleEditCategories}>
              <Text style={styles.editButtonText}>Edit Category</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Charts Section */}
        <View style={styles.chartsContainer}>
          <View style={styles.chartCard}>
            <AccessoryStatsChart
              stats={stats.byCategory?.map((c: any) => ({ label: c.category, count: c.count })) || []}
              title="Accessories by Category"
            />
          </View>
          <View style={styles.chartCard}>
            <AccessoryStatsChart
              stats={stats.byCondition?.map((c: any) => ({ label: c.condition, count: c.count })) || []}
              title="Accessories by Condition"
            />
          </View>
        </View>

        {/* Assignment Table */}
        <AssignmentTable
          assignments={assignments}
          page={page}
          totalPages={totalPages}
          search={search}
          status={status}
          limit={assignmentLimit}
          onSearchChange={(s) => {
            setSearch(s);
            setPage(1);
          }}
          onStatusChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
          onSearchSubmit={() => {
            setPage(1);
            loadAssignments(1);
          }}
          onPageChange={(p) => {
            setPage(p);
            loadAssignments(p);
          }}
          onLimitChange={(l) => {
            setAssignmentLimit(l);
            setPage(1);
            loadAssignments(1);
          }}
          onLoadAllAssignments={loadAllAssignments}
          onRefresh={loadDashboardData}
        />

        {/* Accessory Request Table */}
        <AccessoryRequestTable
          requests={accessoryRequests}
          page={requestPage}
          totalPages={requestTotalPages}
          search={requestSearch}
          status={requestStatus}
          limit={requestLimit}
          onSearchChange={(val) => {
            setRequestSearch(val);
            setRequestPage(1);
          }}
          onStatusChange={(val) => {
            setRequestStatus(val);
            setRequestPage(1);
          }}
          onSearchSubmit={() => {
            setRequestPage(1);
            loadAccessoryRequests(1);
          }}
          onPageChange={(p) => {
            setRequestPage(p);
            loadAccessoryRequests(p);
          }}
          onLimitChange={(l) => {
            setRequestLimit(l);
            setRequestPage(1);
            loadAccessoryRequests(1);
          }}
          onLoadAllRequests={loadAllAccessoryRequests}
        />

        {/* Accessory Table */}
        <AccessoryTable
          accessories={accessories}
          onAccessoriesUpdate={setAccessories}
          page={accessoryPage}
          totalPages={accessoryTotalPages}
          limit={accessoryLimit}
          search={accessorySearch}
          statusFilter={accessoryStatusFilter}
          categoryFilter={accessoryCategoryFilter}
          onPageChange={(page) => {
            setAccessoryPage(page);
            loadAccessories(page);
          }}
          onLimitChange={(limit) => {
            setAccessoryLimit(limit);
            setAccessoryPage(1);
            loadAccessories(1);
          }}
          onSearchChange={(search) => {
            setAccessorySearch(search);
            setAccessoryPage(1);
          }}
          onStatusFilterChange={(status) => {
            setAccessoryStatusFilter(status);
            setAccessoryPage(1);
          }}
          onCategoryFilterChange={(category) => {
            setAccessoryCategoryFilter(category);
            setAccessoryPage(1);
          }}
          onLoadAllAccessories={loadAllAccessories}
          onRefresh={loadDashboardData}
          categories={categories}
        />
      </ScrollView>

      {/* Edit Category Modal (overlay, outside scroll so it stays centered) */}
      {categoryModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Category</Text>

            <DropdownField
              label="Select Category"
              required
              value={selectedCategory}
              options={categories.map((c) => ({ label: c, value: c }))}
              onSelect={(value) => {
                setSelectedCategory(value);
                setCategoryError(null);
              }}
              placeholder="Select an option"
              error={categoryError || undefined}
            />

            <FormField
              label="New Category Name"
              required
              value={newCategoryName}
              onChangeText={(text) => {
                setNewCategoryName(text);
                setCategoryError(null);
              }}
              placeholder="Enter new category name"
              error={categoryError || undefined}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                disabled={savingCategory}
                onPress={() => {
                  setCategoryModalVisible(false);
                  setCategoryError(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalUpdateButton, savingCategory && styles.modalUpdateButtonDisabled]}
                disabled={savingCategory}
                onPress={async () => {
                  if (!selectedCategory) {
                    setCategoryError('Please select a category');
                    return;
                  }
                  if (!newCategoryName.trim()) {
                    setCategoryError('Please enter a new category name');
                    return;
                  }
                  try {
                    setSavingCategory(true);
                    await callApi({
                      method: 'PUT',
                      url: '/accessories/categories',
                      data: {
                        oldCategory: selectedCategory,
                        newCategory: newCategoryName.trim(),
                      },
                    });
                    Alert.alert('Success', 'Category updated successfully');
                    setCategories((prev) =>
                      prev.map((c) => (c === selectedCategory ? newCategoryName.trim() : c)),
                    );
                    await loadDashboardData();
                    setCategoryModalVisible(false);
                    setSelectedCategory('');
                    setNewCategoryName('');
                  } catch (error: any) {
                    console.error('Error updating category:', error);
                    Alert.alert('Error', error?.response?.data?.message || 'Failed to update category');
                  } finally {
                    setSavingCategory(false);
                  }
                }}
              >
                <Text style={styles.modalUpdateText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Add Category Modal */}
      {addCategoryModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add New Category</Text>

            <FormField
              label="Category Name"
              required
              value={newCategoryName}
              onChangeText={(text) => {
                setNewCategoryName(text);
                setCategoryError(null);
              }}
              placeholder="Enter category name"
              error={categoryError || undefined}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                disabled={savingCategory}
                onPress={() => {
                  setAddCategoryModalVisible(false);
                  setCategoryError(null);
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalUpdateButton, savingCategory && styles.modalUpdateButtonDisabled]}
                disabled={savingCategory}
                onPress={async () => {
                  if (!newCategoryName.trim()) {
                    setCategoryError('Please enter a category name');
                    return;
                  }
                  try {
                    setSavingCategory(true);
                    await callApi({
                      method: 'POST',
                      url: '/accessories/categories',
                      data: {
                        category: newCategoryName.trim(),
                      },
                    });
                    Alert.alert('Success', 'Category added successfully');
                    await loadDashboardData();
                    setAddCategoryModalVisible(false);
                    setNewCategoryName('');
                  } catch (error: any) {
                    console.error('Error adding category:', error);
                    Alert.alert('Error', error?.response?.data?.message || 'Failed to add category');
                  } finally {
                    setSavingCategory(false);
                  }
                }}
              >
                <Text style={styles.modalUpdateText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
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
  header: {
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addCategoryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addCategoryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editButtonText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '500',
  },
  assignButton: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  assignButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  returnButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  returnButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  modalUpdateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  modalUpdateButtonDisabled: {
    opacity: 0.7,
  },
  modalUpdateText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  chartsContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  chartCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AccessoriesScreen;
