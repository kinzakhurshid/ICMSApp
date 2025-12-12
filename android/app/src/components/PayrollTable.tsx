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
import { exportToCsv } from '../utills/utills';

interface PayrollRecord {
  _id: string;
  employeeName?: string;
  position?: string;
  payrollGenerationDate?: string;
  basicSalary?: number;
  bonus?: number;
  netSalary?: number;
  status?: string;
  employeeEmail?: string;
  employeeContact?: string;
  employeeId?: string;
  allowances?: number;
  deductions?: number;
  unpaidDays?: number;
  tax?: number;
}

interface PayrollTableProps {
  onRefresh: () => void;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
}

const PayrollTable: React.FC<PayrollTableProps> = ({ onRefresh, dateRange }) => {
  const { callApi } = useAxios();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Detail modal state
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  // Default date range: current month
  const defaultDateRange = {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  };

  const currentDateRange = dateRange || defaultDateRange;

  useEffect(() => {
    fetchPayrolls();
  }, [page, currentDateRange]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      
      // Format dates to ISO string with time
      const startDate = new Date(currentDateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(currentDateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      const response = await callApi({
        method: 'GET',
        url: '/salary',
        params: {
          page,
          limit,
          sortField: 'createdAt',
          sortOrder: 'desc',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });

      // Log the response to debug
      console.log('Payroll API Response:', JSON.stringify(response, null, 2));

      // Handle different response structures
      let rawData: any[] = [];
      if (Array.isArray(response)) {
        rawData = response;
      } else if (Array.isArray(response?.data)) {
        rawData = response.data;
        setTotal(response.total || response.pagination?.total || 0);
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
        setTotal(response.data.total || response.data.pagination?.total || 0);
      } else {
        console.warn('Unexpected response structure:', response);
      }

      // Map the API response fields to our PayrollRecord interface
      // The API might use different field names, so we need to map them
      const payrollData: PayrollRecord[] = rawData.map((item: any) => {
        // Log first item to see structure
        if (rawData.indexOf(item) === 0) {
          console.log('Sample payroll record:', JSON.stringify(item, null, 2));
        }

        return {
          _id: item._id || item.id || '',
          // Employee name - could be in employee object, employeeId object, or direct field
          employeeName: item.employeeName || 
                       item.employee?.fullName || 
                       item.employee?.name ||
                       item.employeeId?.fullName ||
                       item.employeeId?.name ||
                       (item.employee?.firstName && item.employee?.lastName 
                         ? `${item.employee.firstName} ${item.employee.lastName}` 
                         : undefined) ||
                       (item.employeeId?.firstName && item.employeeId?.lastName 
                         ? `${item.employeeId.firstName} ${item.employeeId.lastName}` 
                         : undefined),
          // Position - could be in employee object or direct field
          position: item.position || 
                   item.employee?.position || 
                   item.employeeId?.position ||
                   item.designation,
          // Date - could be createdAt, payrollGenerationDate, date, etc.
          payrollGenerationDate: item.payrollGenerationDate || 
                               item.createdAt || 
                               item.date ||
                               item.generationDate,
          // Salary fields - could have different names
          basicSalary: item.basicSalary || 
                      item.basic || 
                      item.salary ||
                      item.baseSalary,
          bonus: item.bonus || item.bonuses || 0,
          netSalary: item.netSalary || 
                    item.net || 
                    item.totalSalary ||
                    item.amount,
          // Status
          status: item.status || item.payrollStatus || 'pending',
          // Extra fields for detail view
          employeeEmail:
            item.employeeEmail ||
            item.employee?.email ||
            item.employeeId?.email ||
            item.email,
          employeeContact:
            item.employeePhone ||
            item.employee?.contactNumber ||
            item.employeeId?.contactNumber ||
            item.contactNumber,
          employeeId:
            item.employeeId?._id ||
            item.employee?._id ||
            item.employeeId ||
            item.employee?.id,
          allowances: item.allowances || item.allowance || 0,
          deductions: item.deductions || item.deduction || 0,
          unpaidDays: item.unpaidDays || item.unpaid || 0,
          tax: item.tax || item.taxAmount || 0,
        };
      });

      console.log('Mapped payroll data:', JSON.stringify(payrollData.slice(0, 1), null, 2));
      setPayrolls(payrollData);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      Alert.alert('Error', 'Failed to load payrolls');
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  const generateSalaries = async () => {
    try {
      setGenerating(true);
      await callApi({
        method: 'POST',
        url: '/salary/generate-salary',
      });
      Alert.alert('Success', 'Salaries generated successfully');
      // Refresh payroll list after generation
      await fetchPayrolls();
      // Also refresh the dashboard stats
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Failed to generate salaries:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to generate salaries');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return `Rs ${(amount / 1000).toFixed(0)}K`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status?: string) => {
    if (!status) return '#666';
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

  const getStatusBgColor = (status?: string) => {
    if (!status) return '#F5F5F5';
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

  const openDetail = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setDetailVisible(true);
  };

  const filteredPayrolls = payrolls.filter(payroll => {
    const searchLower = searchTerm.toLowerCase();
    const employeeName = (payroll.employeeName || '').toLowerCase();
    const position = (payroll.position || '').toLowerCase();
    return employeeName.includes(searchLower) || position.includes(searchLower);
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Payroll List ({payrolls.length})</Text>
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={generateSalaries}
            disabled={generating}
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color="#333" style={styles.generateLoader} />
                <Text style={styles.generateText}>generating</Text>
              </>
            ) : (
              <Text style={styles.generateText}>Generate</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or payroll ID"
              placeholderTextColor="#999"
              value={searchTerm}
              onChangeText={(text) => {
                setSearchTerm(text);
                setPage(1); // Reset to first page when searching
              }}
            />
          </View>
          
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => {
              if (!payrolls.length) {
                Alert.alert('Export', 'No payroll records to export.');
                return;
              }
              exportToCsv({
                filename: 'payrolls.csv',
                columns: [
                  { key: 'employeeName', header: 'Employee' },
                  { key: 'position', header: 'Position' },
                  { key: 'payrollGenerationDate', header: 'Generation Date' },
                  { key: 'basicSalary', header: 'Basic Salary' },
                  { key: 'bonus', header: 'Bonus' },
                  { key: 'netSalary', header: 'Net Salary' },
                  { key: 'status', header: 'Status' },
                ],
                rows: payrolls.map(p => ({
                  employeeName: p.employeeName,
                  position: p.position,
                  payrollGenerationDate: p.payrollGenerationDate,
                  basicSalary: p.basicSalary,
                  bonus: p.bonus,
                  netSalary: p.netSalary,
                  status: p.status,
                })),
              });
            }}
          >
            <Icon name="download" size={16} color="white" />
            <Text style={styles.exportText}>Export All</Text>
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
              <TouchableOpacity
                key={payroll._id}
                activeOpacity={0.9}
                onPress={() => openDetail(payroll)}
              >
                <View style={styles.tableRow}>
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
                  <Text style={[styles.cellText, styles.nameCol]}>{payroll.employeeName || 'N/A'}</Text>
                  <Text style={[styles.cellText, styles.positionCol]}>{payroll.position || 'N/A'}</Text>
                  <Text style={[styles.cellText, styles.dateCol]}>
                    {formatDateTime(payroll.payrollGenerationDate)}
                  </Text>
                  <Text style={[styles.cellText, styles.basicCol]}>
                    {formatCurrency(payroll.basicSalary)}
                  </Text>
                  <Text style={[styles.cellText, styles.bonusCol]}>
                    {formatCurrency(payroll.bonus)}
                  </Text>
                  <Text style={[styles.cellText, styles.netCol]}>
                    {formatCurrency(payroll.netSalary)}
                  </Text>
                  
                  <View style={styles.statusCol}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(payroll.status) }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(payroll.status) }]}>
                        {payroll.status || 'Unknown'}
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
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Pagination */}
      {!loading && payrolls.length > 0 && (
        <View style={styles.paginationContainer}>
          <View style={styles.paginationButtons}>
            <TouchableOpacity
              style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
              onPress={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
            >
              <Text style={[styles.paginationButtonText, page === 1 && styles.paginationButtonTextDisabled]}>
                Previous
              </Text>
            </TouchableOpacity>
            <Text style={styles.paginationPageText}>
              Page {page} of {Math.ceil(total / limit) || 1}
            </Text>
            <TouchableOpacity
              style={[styles.paginationButton, page >= Math.ceil(total / limit) && styles.paginationButtonDisabled]}
              onPress={() => setPage(prev => prev + 1)}
              disabled={page >= Math.ceil(total / limit)}
            >
              <Text style={[styles.paginationButtonText, page >= Math.ceil(total / limit) && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Payroll Detail Modal */}
      {detailVisible && selectedPayroll && (
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            {/* Top bar */}
            <View style={styles.detailHeader}>
              <Text style={styles.detailHeaderTitle}>Payroll Details</Text>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Icon name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
              {/* Salary Slip Title */}
              <View style={styles.slipHeader}>
                <Text style={styles.slipTitle}>Salary Slip</Text>
                <Text style={styles.slipSubtitle}>
                  {selectedPayroll.payrollGenerationDate
                    ? new Date(selectedPayroll.payrollGenerationDate).toLocaleDateString('en-GB', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </Text>
              </View>

              {/* Company & Employee Info */}
              <View style={styles.infoRow}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoHeading}>Company Information</Text>
                  <Text style={styles.infoText}>Intelgency IT Solutions</Text>
                  <Text style={styles.infoText}>NUST, Islamabad</Text>
                  <Text style={styles.infoText}>Phone: (123) 456-7890</Text>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoHeading}>Employee Information</Text>
                  <Text style={styles.infoText}>Name: {selectedPayroll.employeeName || 'N/A'}</Text>
                  <Text style={styles.infoText}>Position: {selectedPayroll.position || 'N/A'}</Text>
                  <Text style={styles.infoText}>Email: {selectedPayroll.employeeEmail || 'N/A'}</Text>
                  <Text style={styles.infoText}>Contact: {selectedPayroll.employeeContact || 'N/A'}</Text>
                  <Text style={styles.infoText}>
                    Employee ID: {selectedPayroll.employeeId || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Salary Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Salary Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Basic Salary:</Text>
                  <Text style={styles.detailValue}>
                    Rs {Number(selectedPayroll.basicSalary || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Unpaid Days:</Text>
                  <Text style={styles.detailValue}>{selectedPayroll.unpaidDays ?? 0}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Allowances:</Text>
                  <Text style={styles.detailValue}>
                    Rs {Number(selectedPayroll.allowances || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Bonus:</Text>
                  <Text style={styles.detailValue}>
                    Rs {Number(selectedPayroll.bonus || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deductions:</Text>
                  <Text style={styles.detailValue}>
                    Rs {Number(selectedPayroll.deductions || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tax:</Text>
                  <Text style={styles.detailValue}>
                    Rs {Number(selectedPayroll.tax || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.detailDivider} />
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, styles.netLabel]}>Net Salary:</Text>
                  <Text style={[styles.detailValue, styles.netValue]}>
                    Rs {Number(selectedPayroll.netSalary || 0).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Payment Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: getStatusBgColor(selectedPayroll.status) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: getStatusColor(selectedPayroll.status) },
                      ]}
                    >
                      {selectedPayroll.status || 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.footerNoteWrapper}>
                <Text style={styles.footerNote}>
                  This is a computer-generated document and does not require a signature.
                </Text>
              </View>
            </ScrollView>

            {/* Bottom close button */}
            <View style={styles.detailFooter}>
              <TouchableOpacity
                style={styles.detailCloseButton}
                onPress={() => setDetailVisible(false)}
              >
                <Text style={styles.detailCloseText}>Close</Text>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateLoader: {
    marginRight: 4,
  },
  generateText: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'lowercase',
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
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paginationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FB923C',
    backgroundColor: 'white',
  },
  paginationButtonDisabled: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FB923C',
  },
  paginationButtonTextDisabled: {
    color: '#9CA3AF',
  },
  paginationPageText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    minWidth: 80,
    textAlign: 'center',
  },
  // Detail modal styles
  detailOverlay: {
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
  detailCard: {
    width: '100%',
    maxWidth: 720,
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  detailScroll: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  slipHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  slipTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  slipSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 20,
    gap: 16,
  },
  infoColumn: {
    flex: 1,
  },
  infoHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  infoText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 2,
  },
  section: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: '#4B5563',
  },
  detailValue: {
    fontSize: 13,
    color: '#111827',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  netLabel: {
    fontWeight: '700',
  },
  netValue: {
    fontWeight: '700',
    color: '#16A34A',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerNoteWrapper: {
    marginTop: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerNote: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  detailFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
  },
  detailCloseButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  detailCloseText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
});

export default PayrollTable;
