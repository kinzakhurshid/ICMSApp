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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useAxios } from '../hooks/useAxios';

interface LeaveRequest {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  approvedBy?: string;
  comments?: string;
}

const EmployeeLeavesScreen: React.FC = () => {
  const { callApi } = useAxios();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('All');

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    if (leaveRequests.length > 0) {
      filterRequests();
    }
  }, [searchQuery, leaveRequests, selectedStatus]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      
      const response = await callApi({ 
        method: "GET", 
        url: "/employee/leave-requests" 
      });

      if (response.success) {
        setLeaveRequests(response.data.requests || []);
      }

    } catch (error) {
      console.error("Error fetching leave requests:", error);
      // Mock data for demonstration
      setLeaveRequests([
        {
          _id: '1',
          type: 'Sick Leave',
          startDate: '2024-01-15',
          endDate: '2024-01-17',
          days: 3,
          reason: 'Fever and cold',
          status: 'Approved',
          appliedDate: '2024-01-10',
          approvedBy: 'HR Manager'
        },
        {
          _id: '2',
          type: 'Annual Leave',
          startDate: '2024-02-01',
          endDate: '2024-02-05',
          days: 5,
          reason: 'Family vacation',
          status: 'Pending',
          appliedDate: '2024-01-25'
        },
        {
          _id: '3',
          type: 'Personal Leave',
          startDate: '2024-01-20',
          endDate: '2024-01-20',
          days: 1,
          reason: 'Personal work',
          status: 'Rejected',
          appliedDate: '2024-01-18',
          comments: 'Not sufficient reason'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaveRequests();
    setRefreshing(false);
  };

  const filterRequests = () => {
    let filtered = leaveRequests;

    if (searchQuery.trim()) {
      filtered = filtered.filter(request =>
        request.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(request => request.status === selectedStatus);
    }

    setFilteredRequests(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#4CAF50';
      case 'Pending': return '#FF9800';
      case 'Rejected': return '#F44336';
      default: return '#9CA3AF';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const renderLeaveRequest = (request: LeaveRequest, index: number) => {
    return (
      <View key={request._id} style={styles.leaveCard}>
        <View style={styles.leaveHeader}>
          <Text style={styles.leaveType}>{request.type}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
              {request.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.leaveDetails}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar" size={16} color="#6B7280" />
            <Text style={styles.dateText}>
              {formatDate(request.startDate)} - {formatDate(request.endDate)}
            </Text>
            <Text style={styles.daysText}>({request.days} days)</Text>
          </View>
          
          <View style={styles.reasonRow}>
            <Ionicons name="document-text" size={16} color="#6B7280" />
            <Text style={styles.reasonText}>{request.reason}</Text>
          </View>
          
          <View style={styles.appliedRow}>
            <Ionicons name="time" size={16} color="#6B7280" />
            <Text style={styles.appliedText}>Applied: {formatDate(request.appliedDate)}</Text>
          </View>
          
          {request.approvedBy && (
            <View style={styles.approvedRow}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.approvedText}>Approved by: {request.approvedBy}</Text>
            </View>
          )}
          
          {request.comments && (
            <View style={styles.commentsRow}>
              <Ionicons name="chatbubble" size={16} color="#6B7280" />
              <Text style={styles.commentsText}>{request.comments}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const statusOptions = ['All', 'Pending', 'Approved', 'Rejected'];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading leave requests...</Text>
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
        <Text style={styles.headerTitle}>My Leaves</Text>
      </View>

      {/* Search and Actions Bar */}
      <View style={styles.searchActionsBar}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leave requests..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={16} color="white" />
          <Text style={styles.addButtonText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statusFilter}
        contentContainerStyle={styles.statusFilterContent}
      >
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.statusChip,
              selectedStatus === status && styles.selectedStatusChip
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text style={[
              styles.statusChipText,
              selectedStatus === status && styles.selectedStatusChipText
            ]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Leave Requests */}
      <View style={styles.requestsContainer}>
        {filteredRequests.length > 0 ? (
          filteredRequests.map((request, index) => renderLeaveRequest(request, index))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>No leave requests found</Text>
            <Text style={styles.emptyStateSubtext}>Apply for a leave to get started</Text>
          </View>
        )}
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
    paddingBottom: 16,
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
  statusFilter: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statusFilterContent: {
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedStatusChip: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  statusChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedStatusChipText: {
    color: 'white',
    fontWeight: '600',
  },
  requestsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  leaveCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  leaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leaveDetails: {
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  daysText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 'auto',
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appliedText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  approvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approvedText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  commentsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  commentsText: {
    flex: 1,
    fontSize: 12,
    color: '#F44336',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
});

export default EmployeeLeavesScreen;
