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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load stats
      const statsRes = await callApi({ method: 'GET', url: '/accessories/stats' });
      setStats(statsRes || { byCategory: [], byCondition: [] });

      // Load accessories
      const accessoriesRes = await callApi({ method: 'GET', url: '/accessories?page=1&limit=10' });
      setAccessories(accessoriesRes?.data || []);

      // Load employees
      const employeesRes = await callApi({ method: 'GET', url: '/employee' });
      setEmployees(employeesRes || []);

      // Load assignments
      await loadAssignments(1);
      
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
        limit: '10',
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
      });
      
      const res = await callApi({
        method: 'GET',
        url: `/accessories/assignments?${params.toString()}`,
      });
      
      setAssignments(res?.data || []);
      setTotalPages(res?.totalPages || 1);
      setPage(res?.page || 1);
    } catch (error) {
      console.error('Error loading assignments:', error);
      Alert.alert('Error', 'Failed to load assignments');
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

  const handleEditCategories = () => {
    Alert.alert('Edit Categories', 'Category editing functionality will be implemented');
  };

  const handleAddAccessory = () => {
    Alert.alert('Add Accessory', 'Add accessory functionality will be implemented');
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
              <Text style={styles.editButtonText}>Edit Categories Names</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={handleAddAccessory}>
              <Text style={styles.addButtonText}>Add</Text>
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
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onSearchSubmit={() => loadAssignments(1)}
          onPageChange={loadAssignments}
          onLoadAllAssignments={loadAllAssignments}
        />

        {/* Accessory Table */}
        <AccessoryTable
          accessories={accessories}
          onAccessoriesUpdate={setAccessories}
        />
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
