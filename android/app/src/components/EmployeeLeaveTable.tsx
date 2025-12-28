import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import  useAxios  from '../hooks/useAxios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Edit2, Trash2 } from 'lucide-react-native';
import { Leave } from '../types';
import { EmployeeLeaveStackParamList } from '../navigation/EmployeeTabNavigator';

const EmployeeLeaveTable = () => {
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const employeeId = currentUser?.employee._id;
  const navigation = useNavigation<NativeStackNavigationProp<EmployeeLeaveStackParamList>>();

  const [data, setData] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await callApi({
        method: 'GET',
        url: '/leave/employee',
        params: {
          page: 1,
          limit: 50,
          sortField: 'createdAt',
          sortOrder: 'desc',
        },
      });

      setData(res?.data || []);
    } catch (err) {
      console.error('Failed to load leaves:', err);
      Alert.alert('Error', 'Failed to load leave data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const handleRequestLeave = () => {
    navigation.navigate('RequestLeave', { redirectTo: 'EmployeeLeaveMain' });
  };

  const handleEditLeave = (leave: Leave) => {
    if (leave.status === 'Pending') {
      navigation.navigate('RequestLeave', {
        redirectTo: 'EmployeeLeaveMain',
        leaveId: leave._id,
      });
    }
  };

  const handleCancelLeave = (leave: Leave) => {
    if (leave.status === 'Pending') {
      Alert.alert(
        'Cancel Leave',
        'Are you sure you want to cancel this leave request?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Yes',
            onPress: async () => {
              try {
                await callApi({
                  method: 'DELETE',
                  url: `/leave/${leave._id}`,
                });
                Alert.alert('Success', 'Leave request cancelled successfully');
                fetchData();
              } catch (error) {
                console.error('Failed to cancel leave:', error);
                Alert.alert('Error', 'Failed to cancel leave request');
              }
            },
          },
        ]
      );
    }
  };

  const renderDuration = (leave: Leave) => {
    if (leave.isHalfDay) {
      return leave.halfDayType 
        ? (leave.halfDayType === 'first' ? 'First Half' : 'Second Half')
        : 'Half Day';
    }
    return `${leave.duration} day${Number(leave.duration) > 1 ? 's' : ''}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return { bg: '#DCFCE7', text: '#166534' };
      case 'Rejected': return { bg: '#FECACA', text: '#991B1B' };
      default: return { bg: '#FEF3C7', text: '#92400E' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Leaves</Text>
        <TouchableOpacity style={styles.requestButton} onPress={handleRequestLeave}>
          <Text style={styles.requestButtonText}>Request Leave</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.serialCell]}>#</Text>
            <Text style={[styles.headerCell, styles.typeCell]}>Type</Text>
            <Text style={[styles.headerCell, styles.dateCell]}>Start Date</Text>
            <Text style={[styles.headerCell, styles.dateCell]}>End Date</Text>
            <Text style={[styles.headerCell, styles.daysCell]}>Days</Text>
            <Text style={[styles.headerCell, styles.statusCell]}>Status</Text>
            <Text style={[styles.headerCell, styles.reasonCell]}>Reason</Text>
            <Text style={[styles.headerCell, styles.actionsCell]}>Actions</Text>
          </View>

          {/* Table Rows */}
          {data.map((leave, index) => {
            const statusColor = getStatusColor(leave.status);
            
            return (
              <View key={leave._id} style={styles.tableRow}>
                <Text style={[styles.cell, styles.serialCell]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.typeCell]}>{leave.type}</Text>
                <Text style={[styles.cell, styles.dateCell]}>
                  {new Date(leave.startDate).toLocaleDateString()}
                </Text>
                <Text style={[styles.cell, styles.dateCell]}>
                  {new Date(leave.endDate).toLocaleDateString()}
                </Text>
                <Text style={[styles.cell, styles.daysCell]}>
                  {renderDuration(leave)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                  <Text style={[styles.statusText, { color: statusColor.text }]}>
                    {leave.status}
                  </Text>
                </View>
                <Text style={[styles.cell, styles.reasonCell]} numberOfLines={2}>
                  {leave.reason}
                </Text>
                <View style={[styles.cell, styles.actionsCell]}>
                  {leave.status === 'Pending' && (
                    <View style={styles.actions}>
                      <TouchableOpacity
                        onPress={() => handleEditLeave(leave)}
                        style={styles.actionButton}
                      >
                        <Edit2 size={16} color="#16A34A" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleCancelLeave(leave)}
                        style={styles.actionButton}
                      >
                        <Trash2 size={16} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {data.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No leave records found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  requestButton: {
    // Match PM dashboard primary orange for actions
    backgroundColor: '#FB923C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  table: {
    minWidth: 800, // Minimum width for horizontal scrolling
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
    alignItems: 'center',
  },
  headerCell: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  cell: {
    fontSize: 14,
    color: '#374151',
  },
  serialCell: {
    width: 40,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  typeCell: {
    width: 80,
    paddingHorizontal: 8,
  },
  dateCell: {
    width: 100,
    paddingHorizontal: 8,
  },
  daysCell: {
    width: 60,
    paddingHorizontal: 8,
  },
  statusCell: {
    width: 90,
    paddingHorizontal: 8,
  },
  reasonCell: {
    width: 150,
    paddingHorizontal: 8,
    flex: 1,
  },
  actionsCell: {
    width: 80,
    paddingHorizontal: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 4,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default EmployeeLeaveTable;