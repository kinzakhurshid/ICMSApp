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
import ResignationOverviewCard from '../components/ResignationOverviewCard';
import ResignationOverviewCarousel from '../components/ResignationOverviewCarousel';
import ResignationTable from '../components/ResignationTable';

interface Resignation {
  _id: string;
  name: string;
  designation: string;
  separationType: string;
  effectiveFrom: string;
  lastWorkingDay: string;
  reason: string;
  submittedOn: string;
  status: string;
}

interface ResignationStats {
  total: number;
  resigned: number;
  terminated: number;
}

const ResignationScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  
  const [loading, setLoading] = useState(false);
  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [pendingResignations, setPendingResignations] = useState<Resignation[]>([]);
  const [resignOverview, setResignOverview] = useState<any[]>([]);
  const [stats, setStats] = useState<ResignationStats>({ total: 0, resigned: 0, terminated: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: '',
    separationType: '',
    search: '',
  });

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'bg-green-100';
      case 'Requested':
        return 'bg-blue-100';
      case 'Rejected':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  useEffect(() => {
    fetchPendingResignations();
    fetchAllResignations(1);
    fetchResignationStats();
  }, []);

  useEffect(() => {
    if (pendingResignations.length > 0) {
      const overviewData = pendingResignations.slice(0, 5).map((resign) => ({
        _id: resign._id,
        name: resign.name,
        role: resign.designation,
        date: new Date(resign.effectiveFrom).toLocaleDateString(),
        status: resign.status,
        bg: getStatusBgColor(resign.status),
        statusColor: getStatusBgColor(resign.status),
        dateBg: getStatusBgColor(resign.status),
        separationType: resign.separationType,
        effectiveFrom: resign.effectiveFrom,
        lastWorkingDay: resign.lastWorkingDay,
      }));
      setResignOverview(overviewData);
    } else if (resignations.length > 0) {
      const overviewData = resignations.slice(0, 5).map((resign) => ({
        _id: resign._id,
        name: resign.name,
        role: resign.designation,
        date: new Date(resign.effectiveFrom).toLocaleDateString(),
        status: resign.status,
        bg: getStatusBgColor(resign.status),
        statusColor: getStatusBgColor(resign.status),
        dateBg: getStatusBgColor(resign.status),
        separationType: resign.separationType,
        effectiveFrom: resign.effectiveFrom,
        lastWorkingDay: resign.lastWorkingDay,
      }));
      setResignOverview(overviewData);
    }
  }, [pendingResignations, resignations]);

  const fetchPendingResignations = async () => {
    try {
      const response = await callApi({ method: 'GET', url: '/resignations/pending' });
      const resignationList = Array.isArray(response) ? response : [];

      const formattedResignations = resignationList.map((resignation) => ({
        ...resignation,
        status: resignation.status || 'Requested',
      }));

      setPendingResignations(formattedResignations);
    } catch (error) {
      console.error('Failed to fetch pending resignations:', error);
    }
  };

  const fetchAllResignations = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters,
      });

      const response = await callApi({
        method: 'GET',
        url: `/resignations?${params}`
      });

      if (response && response.data) {
        setResignations(response.data);
        setCurrentPage(response.page);
        setTotalPages(response.pages);
      }
    } catch (error) {
      console.error('Failed to fetch all resignations:', error);
      Alert.alert('Error', 'Error fetching resignations');
    } finally {
      setLoading(false);
    }
  };

  const fetchResignationStats = async () => {
    try {
      const response = await callApi({
        method: 'GET',
        url: '/resignations?status=Accepted&limit=1000'
      });

      if (response && response.data) {
        const acceptedResignations = response.data;
        const resignedCount = acceptedResignations.filter(
          (r: Resignation) => r.separationType === 'Resigned'
        ).length;
        const terminatedCount = acceptedResignations.filter(
          (r: Resignation) => r.separationType === 'Terminated'
        ).length;

        setStats({
          total: acceptedResignations.length,
          resigned: resignedCount,
          terminated: terminatedCount,
        });
      }
    } catch (error) {
      console.error('Failed to fetch resignation stats:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'Accepted' | 'Rejected') => {
    try {
      setLoading(true);
      const response = await callApi({
        method: 'PUT',
        url: `/resignations/${id}/status`,
        data: { status },
      });

      setPendingResignations(prev =>
        prev.filter(resign => resign._id !== id)
      );

      setResignations(prev =>
        prev.map(resign =>
          resign._id === id ? { ...resign, status } : resign
        )
      );

      fetchPendingResignations();
      fetchResignationStats();

      Alert.alert('Success', `Resignation ${status.toLowerCase()} successfully`);
    } catch (error) {
      console.error('Status update error:', error);
      Alert.alert('Error', `Failed to ${status.toLowerCase()} resignation`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    fetchAllResignations(1, newFilters);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchAllResignations(page, filters);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime())
        ? 'Invalid Date'
        : date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
    } catch {
      return 'Invalid Date';
    }
  };

  const handleDeleteResignation = async (id: string) => {
    Alert.alert(
      'Delete Resignation',
      'Are you sure you want to delete this resignation record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => performDelete(id) },
      ]
    );
  };

  const performDelete = async (id: string) => {
    try {
      const response = await callApi({
        method: 'DELETE',
        url: `/resignations/${id}/termination`,
      });

      Alert.alert('Success', 'Resignation deleted successfully!');
      setResignations(prev => prev.filter(resignation => resignation._id !== id));
      setPendingResignations(prev => prev.filter(resignation => resignation._id !== id));
      fetchResignationStats();
    } catch (error) {
      console.error('Error deleting resignation:', error);
      Alert.alert('Error', 'Failed to delete resignation');
    }
  };

  if (loading && !resignations.length && !pendingResignations.length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Resignation Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>Dashboard / Resignation</Text>
        </View>

        {/* Page Title and Actions */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Resignation management</Text>
          <TouchableOpacity
            style={styles.terminateButton}
            onPress={() => (navigation as any).navigate('TerminateEmployee')}
          >
            <Text style={styles.terminateButtonText}>Terminate</Text>
          </TouchableOpacity>
        </View>

        {/* Header Summary */}
        <View style={styles.summaryContainer}>
          <ResignationOverviewCard stats={stats} />
          <ResignationOverviewCarousel
            resignOverview={resignOverview}
            formatDate={formatDate}
          />
        </View>

        {/* Resignation Table */}
        <ResignationTable
          pendingResignations={pendingResignations}
          allResignations={resignations}
          loading={loading}
          onStatusUpdate={handleStatusUpdate}
          onDelete={handleDeleteResignation}
          formatDate={formatDate}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onFilterChange={handleFilterChange}
          filters={filters}
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
  titleRow: {
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
  terminateButton: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  terminateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
});

export default ResignationScreen;
