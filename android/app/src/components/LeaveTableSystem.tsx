import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';

const LeaveTableSystem: React.FC = () => {
  const { callApi } = useAxios();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Mock data - replace with actual API call
  const mockLeaves = [
    {
      _id: '1',
      employee: { name: 'Mamoona Shabbir' },
      type: 'Sick',
      duration: '1 day',
      from: '2025-10-22',
      to: '2025-10-22',
      reason: 'Xyz',
      file: null,
      status: 'Approved',
    },
    {
      _id: '2',
      employee: { name: 'Fahad Ahmed' },
      type: 'Casual',
      duration: 'Second Half',
      from: '2025-10-22',
      to: '2025-10-22',
      reason: 'Due to some personal reason',
      file: null,
      status: 'Approved',
    },
    {
      _id: '3',
      employee: { name: 'Test Khan' },
      type: 'Casual',
      duration: '2 days',
      from: '2025-10-22',
      to: '2025-10-22',
      reason: 'kal ka half day chaye',
      file: null,
      status: 'Approved',
    },
    {
      _id: '4',
      employee: { name: 'Kinza Khurshid' },
      type: 'Sick',
      duration: '1 day',
      from: '2025-10-22',
      to: '2025-10-22',
      reason: 'I m having high fever from some da...',
      file: null,
      status: 'Approved',
    },
  ];

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      // Replace with actual API call
      // const response = await callApi({ method: 'GET', url: '/leaves' });
      // setLeaves(response?.data || []);
      setLeaves(mockLeaves);
    } catch (error) {
      console.error('Error loading leaves:', error);
      Alert.alert('Error', 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaves = leaves.filter(leave =>
    leave.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    leave.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectLeave = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(leaveId => leaveId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredLeaves.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeaves.map(leave => leave._id));
    }
  };

  const handleDeleteLeave = (id: string) => {
    Alert.alert(
      'Delete Leave Record',
      'Are you sure you want to delete this leave record?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          const updatedLeaves = leaves.filter(leave => leave._id !== id);
          setLeaves(updatedLeaves);
          Alert.alert('Success', 'Leave record deleted successfully');
        }},
      ]
    );
  };

  const handleEditLeave = (leave: any) => {
    Alert.alert('Edit Leave', `Edit ${leave.employee?.name}'s leave functionality will be implemented`);
  };

  const handleExport = () => {
    Alert.alert('Export', 'Export functionality will be implemented');
  };

  const handleAddLeave = () => {
    Alert.alert('Add Leave', 'Add leave functionality will be implemented');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading leave records...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>All Leave Records</Text>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search employees..."
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-list" size={20} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Text style={styles.exportText}>Export All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addButton} onPress={handleAddLeave}>
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollContainer}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <TouchableOpacity style={styles.checkboxHeader} onPress={handleSelectAll}>
              <Icon 
                name={selectedIds.length === filteredLeaves.length ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            <Text style={[styles.headerText, styles.employeeCol]}>EMPLOYEE</Text>
            <Text style={[styles.headerText, styles.typeCol]}>TYPE</Text>
            <Text style={[styles.headerText, styles.durationCol]}>DURATION</Text>
            <Text style={[styles.headerText, styles.fromCol]}>FROM</Text>
            <Text style={[styles.headerText, styles.toCol]}>TO</Text>
            <Text style={[styles.headerText, styles.reasonCol]}>REASON</Text>
            <Text style={[styles.headerText, styles.fileCol]}>FILE</Text>
            <Text style={[styles.headerText, styles.statusCol]}>STATUS</Text>
            <Text style={[styles.headerText, styles.actionsCol]}>ACTIONS</Text>
          </View>

          {/* Table Rows */}
          {filteredLeaves.map((leave) => (
            <View key={leave._id} style={styles.tableRow}>
              <TouchableOpacity 
                style={styles.checkboxCell}
                onPress={() => handleSelectLeave(leave._id)}
              >
                <Icon 
                  name={selectedIds.includes(leave._id) ? "check-box" : "check-box-outline-blank"} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
              
              <Text style={[styles.cellText, styles.employeeCol]}>{leave.employee?.name || 'N/A'}</Text>
              <Text style={[styles.cellText, styles.typeCol]}>{leave.type || 'N/A'}</Text>
              <Text style={[styles.cellText, styles.durationCol]}>{leave.duration || 'N/A'}</Text>
              <Text style={[styles.cellText, styles.fromCol]}>{formatDate(leave.from)}</Text>
              <Text style={[styles.cellText, styles.toCol]}>{formatDate(leave.to)}</Text>
              <Text style={[styles.cellText, styles.reasonCol]}>{leave.reason || 'N/A'}</Text>
              <Text style={[styles.cellText, styles.fileCol]}>{leave.file ? 'File' : '-'}</Text>
              
              <View style={styles.statusContainer}>
                <View style={[styles.statusBadge, { backgroundColor: '#D4EDDA' }]}>
                  <Text style={[styles.statusText, { color: '#155724' }]}>
                    {leave.status || 'Approved'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditLeave(leave)}
                >
                  <Icon name="edit" size={16} color="#FF6B35" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteLeave(leave._id)}
                >
                  <Icon name="delete" size={16} color="#DC3545" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
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
    minWidth: 200,
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
  },
  exportText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#DC3545',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tableScrollContainer: {
    maxHeight: 400,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableContainer: {
    minWidth: 1200,
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
  employeeCol: { width: 150 },
  typeCol: { width: 100 },
  durationCol: { width: 120 },
  fromCol: { width: 120 },
  toCol: { width: 120 },
  reasonCol: { width: 200 },
  fileCol: { width: 80 },
  statusCol: { width: 100 },
  actionsCol: { width: 100 },
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
  statusContainer: {
    width: 100,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    width: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#F5F5F5',
  },
});

export default LeaveTableSystem;





