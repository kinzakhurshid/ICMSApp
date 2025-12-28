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
import { useFocusEffect } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';
import MyTeamsCard from '../components/MyTeamsCard';
import HolidayChart from '../components/HolidayChart';
import LeaveTableSystem from '../components/LeaveTableSystem';
import Icon from 'react-native-vector-icons/MaterialIcons';

const LeavesScreen: React.FC = () => {
  const { callApi } = useAxios();
  
  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const getEmployeeName = (leave: any): string => {
    const emp =
      leave.employee ||
      leave.employeeId ||
      leave.EmployeeId || // API may return EmployeeId with capital E
      leave.emp ||
      leave.user ||
      {};

    const directName =
      leave.employeeName ||
      leave.employee_name ||
      leave.userName ||
      leave.username ||
      leave.name;

    const fullName =
      emp.fullName ||
      emp.full_name ||
      (emp.firstName && emp.lastName ? `${emp.firstName} ${emp.lastName}` : undefined);

    return (
      emp.name ||
      fullName ||
      directName ||
      'Unknown Employee'
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch pending leaves
      const pendingResponse = await callApi({
        method: 'GET',
        url: '/leave',
        params: {
          status: 'Pending',
          page: 1,
          limit: 10,
        },
      });

      let pendingData: any[] = [];
      if (Array.isArray(pendingResponse?.data)) {
        pendingData = pendingResponse.data;
        setPendingCount(pendingResponse.pagination?.total || pendingResponse.data.length);
      } else if (Array.isArray(pendingResponse?.data?.data)) {
        pendingData = pendingResponse.data.data;
        setPendingCount(pendingResponse.data.pagination?.total || 0);
      } else if (Array.isArray(pendingResponse)) {
        pendingData = pendingResponse;
        setPendingCount(pendingResponse.length);
      }

      setPendingLeaves(pendingData);
    } catch (error) {
      console.error('Error loading leave data:', error);
      setPendingLeaves([]);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Leave Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>Dashboard / Leaves</Text>
        </View>

        {/* Page Title */}
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Leave management</Text>
        </View>

        {/* Top Cards Section */}
        <View style={styles.cardsContainer}>
          <View style={styles.card}>
            <MyTeamsCard />
          </View>
          <View style={styles.card}>
            <HolidayChart />
          </View>
        </View>

        {/* Pending Approval Section */}
        <View style={styles.pendingSection}>
          <View style={styles.pendingHeader}>
            <Text style={styles.sectionTitle}>Pending Approval ({pendingCount})</Text>
            {pendingCount > 0 && (
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => {
                  // Scroll to table or filter by pending
                }}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <Icon name="arrow-forward" size={16} color="#FF6B35" />
              </TouchableOpacity>
            )}
          </View>
          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={styles.emptyText}>Loading pending leaves...</Text>
            </View>
          ) : pendingLeaves.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No pending leaves found</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.pendingList}>
                {pendingLeaves.slice(0, 5).map((leave) => (
                  <View key={leave._id} style={styles.pendingCard}>
                    <View style={styles.pendingCardHeader}>
                      <Text style={styles.pendingEmployeeName}>
                        {getEmployeeName(leave)}
                      </Text>
                      <View style={[styles.pendingStatusBadge, { backgroundColor: '#FFF3CD' }]}>
                        <Text style={[styles.pendingStatusText, { color: '#856404' }]}>
                          {leave.status || 'Pending'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.pendingLeaveType}>{leave.type || 'N/A'}</Text>
                    <Text style={styles.pendingDateRange}>
                      {new Date(leave.startDate || leave.from).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })} - {new Date(leave.endDate || leave.to).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                    <Text style={styles.pendingReason} numberOfLines={2}>
                      {leave.reason || 'No reason provided'}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        {/* Leave Table */}
        <LeaveTableSystem />
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
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  cardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 200,
  },
  pendingSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  pendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  pendingList: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  pendingCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    minWidth: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pendingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pendingEmployeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  pendingStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  pendingLeaveType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  pendingDateRange: {
    fontSize: 11,
    color: '#999',
    marginBottom: 8,
  },
  pendingReason: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default LeavesScreen;
