import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';

interface PayrollRecord {
  _id: string;
  employeeName: string;
  position: string;
  payrollGenerationDate: string;
  basicSalary: number;
  bonus: number;
  netSalary: number;
  status: string;
}

interface PayrollTableProps {
  onRefresh: () => void;
}

const PayrollTable: React.FC<PayrollTableProps> = ({ onRefresh }) => {
  const { callApi } = useAxios();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const response = await callApi({
        method: 'GET',
        url: '/payroll',
      });
      setPayrolls(response || []);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      Alert.alert('Error', 'Failed to load payrolls');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${(amount / 1000).toFixed(0)}K`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FF9800';
      case 'approved':
        return '#4CAF50';
      case 'rejected':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFF8E1';
      case 'approved':
        return '#E8F5E8';
      case 'rejected':
        return '#FFEBEE';
      default:
        return '#F5F5F5';
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === payrolls.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(payrolls.map(payroll => payroll._id));
    }
  };

  const handleSelectPayroll = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(payrollId => payrollId !== id)
        : [...prev, id]
    );
  };

  const handleApprove = (id: string) => {
    Alert.alert(
      'Approve Payroll',
      'Are you sure you want to approve this payroll?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', style: 'default', onPress: () => approvePayroll(id) },
      ]
    );
  };

  const approvePayroll = async (id: string) => {
    try {
      await callApi({ 
        method: 'PUT', 
        url: `/payroll/${id}/approve` 
      });
      setPayrolls(payrolls.map(payroll => 
        payroll._id === id ? { ...payroll, status: 'Approved' } : payroll
      ));
      Alert.alert('Success', 'Payroll approved successfully');
    } catch (error) {
      console.error('Error approving payroll:', error);
      Alert.alert('Error', 'Failed to approve payroll');
    }
  };

  const handleEdit = (id: string) => {
    // Navigate to edit screen or show edit modal
    console.log('Edit payroll:', id);
  };

  const filteredPayrolls = payrolls.filter(payroll =>
    payroll.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payroll.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Payroll List ({payrolls.length})</Text>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or payroll ID"
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          
          <TouchableOpacity style={styles.exportButton}>
            <Icon name="download" size={16} color="white" />
            <Text style={styles.exportText}>Export All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.generateButton}>
            <Text style={styles.generateText}>Generate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterButton}>
            <Icon name="filter-list" size={20} color="#666" />
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
                name={selectedIds.length === payrolls.length ? "check-box" : "check-box-outline-blank"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
            <Text style={[styles.headerText, styles.srCol]}>SR#</Text>
            <Text style={[styles.headerText, styles.nameCol]}>EMPLOYEE NAME</Text>
            <Text style={[styles.headerText, styles.positionCol]}>POSITION</Text>
            <Text style={[styles.headerText, styles.dateCol]}>PAYROLL GENERATION DATE</Text>
            <Text style={[styles.headerText, styles.basicCol]}>BASIC SALARY</Text>
            <Text style={[styles.headerText, styles.bonusCol]}>BONUS</Text>
            <Text style={[styles.headerText, styles.netCol]}>NET SALARY</Text>
            <Text style={[styles.headerText, styles.statusCol]}>STATUS</Text>
            <Text style={[styles.headerText, styles.actionsCol]}>ACTIONS</Text>
          </View>

          {/* Table Rows */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Loading payrolls...</Text>
            </View>
          ) : (
            filteredPayrolls.map((payroll, index) => (
              <View key={payroll._id} style={styles.tableRow}>
                <TouchableOpacity 
                  style={styles.checkboxCell}
                  onPress={() => handleSelectPayroll(payroll._id)}
                >
                  <Icon 
                    name={selectedIds.includes(payroll._id) ? "check-box" : "check-box-outline-blank"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                <Text style={[styles.cellText, styles.srCol]}>{index + 1}</Text>
                <Text style={[styles.cellText, styles.nameCol]}>{payroll.employeeName}</Text>
                <Text style={[styles.cellText, styles.positionCol]}>{payroll.position}</Text>
                <Text style={[styles.cellText, styles.dateCol]}>{formatDateTime(payroll.payrollGenerationDate)}</Text>
                <Text style={[styles.cellText, styles.basicCol]}>{formatCurrency(payroll.basicSalary)}</Text>
                <Text style={[styles.cellText, styles.bonusCol]}>{formatCurrency(payroll.bonus)}</Text>
                <Text style={[styles.cellText, styles.netCol]}>{formatCurrency(payroll.netSalary)}</Text>
                
                <View style={styles.statusCol}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(payroll.status) }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(payroll.status) }]}>
                      {payroll.status}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.actionsCol}>
                  <View style={styles.actionsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleApprove(payroll._id)}
                    >
                      <Icon name="check" size={16} color="#4CAF50" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(payroll._id)}
                    >
                      <Icon name="edit" size={16} color="#2196F3" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
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
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 200,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
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
  generateButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  generateText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
  },
  filterButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  srCol: { width: 60 },
  nameCol: { width: 150 },
  positionCol: { width: 150 },
  dateCol: { width: 150 },
  basicCol: { width: 120 },
  bonusCol: { width: 100 },
  netCol: { width: 120 },
  statusCol: { width: 100 },
  actionsCol: { width: 120 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: 'white',
    minHeight: 60,
  },
  checkboxCell: {
    width: 40,
    alignItems: 'center',
  },
  cellText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
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
});

export default PayrollTable;
