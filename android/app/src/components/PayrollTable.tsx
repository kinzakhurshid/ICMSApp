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
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import { exportToXlsx } from '../utills/utills';
import SearchableSelect from './SearchableSelect';

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
  workingDays?: number;
  workingHours?: number;
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
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [generateDateRange, setGenerateDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });

  // Detail modal state
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  // Edit modal state
  const [editVisible, setEditVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    workingDays: '',
    workingHours: '',
    bonus: '',
    allowances: '',
    deductions: '',
    tax: '',
  });

  // Default date range: current month
  const defaultDateRange = {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  };

  const currentDateRange = dateRange || defaultDateRange;

  useEffect(() => {
    fetchPayrolls();
  }, [page, currentDateRange, statusFilter, searchTerm]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      
      // Format dates to ISO string with time
      const startDate = new Date(currentDateRange.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(currentDateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      const params: any = {
        page,
        limit,
        sortField: 'createdAt',
        sortOrder: 'desc',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await callApi({
        method: 'GET',
        url: '/salary',
        params,
      });

      // Log the response to debug
      console.log('Payroll API Response:', JSON.stringify(response, null, 2));

      // Handle API response structure: { data: [], pagination: { total, totalPages } }
      let rawData: any[] = [];
      if (Array.isArray(response?.data)) {
        rawData = response.data;
        setTotal(response.pagination?.total || 0);
      } else if (Array.isArray(response)) {
        rawData = response;
        setTotal(response.length);
      } else {
        console.warn('Unexpected response structure:', response);
        rawData = [];
        setTotal(0);
      }

      // Map the API response fields to our PayrollRecord interface
      // The API might use different field names, so we need to map them
      const payrollData: PayrollRecord[] = rawData.map((item: any) => {
        // Log first item to see structure
        if (rawData.indexOf(item) === 0) {
          console.log('Sample payroll record:', JSON.stringify(item, null, 2));
        }

        return {
          _id: item._id || '',
          // Employee name from employee object
          employeeName: item.employee?.firstName && item.employee?.lastName
            ? `${item.employee.firstName} ${item.employee.lastName}`
            : item.employee?.fullName || item.employee?.name || 'N/A',
          // Position from employee object
          position: item.employee?.position || 
                   item.employee?.designation || 
                   'N/A',
          // Date from createdAt
          payrollGenerationDate: item.createdAt || 
                               item.paymentDate || 
                               new Date().toISOString(),
          // Salary fields from API
          basicSalary: item.basicSalary || 0,
          bonus: item.bonus || 0,
          netSalary: item.netSalary || 0,
          // Status - API uses "Paid", "Pending", "Cancelled"
          status: item.status || 'Pending',
          // Extra fields for detail view
          employeeEmail: item.employee?.email || 'N/A',
          employeeContact: item.employee?.contactNumber || 
                          item.employee?.phone || 
                          'N/A',
          employeeId: item.EmployeeId || 
                     item.employee?._id || 
                     item.employeeId || 
                     '',
          allowances: item.allowances || 0,
          deductions: item.deductions || 0,
          unpaidDays: item.workingDays !== undefined ? (22 - item.workingDays) : 0,
          tax: item.tax || 0,
          workingDays: item.workingDays || 0,
          workingHours: item.workingHours || 0,
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
      // Generate salaries endpoint doesn't require date range in body
      // It generates for current month automatically
      await callApi({
        method: 'POST',
        url: '/salary/generate-salary',
      });
      Alert.alert('Success', 'Salaries generated successfully');
      setShowDatePicker(false);
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
    switch (status) {
      case 'Pending':
        return '#FF9800';
      case 'Paid':
        return '#4CAF50';
      case 'Cancelled':
        return '#F44336';
      default:
        return '#666';
    }
  };

  const getStatusBgColor = (status?: string) => {
    if (!status) return '#F5F5F5';
    switch (status) {
      case 'Pending':
        return '#FFF8E1';
      case 'Paid':
        return '#E8F5E8';
      case 'Cancelled':
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
        method: 'PATCH', 
        url: `/salary/${id}/process-payment` 
      });
      setPayrolls(payrolls.map(payroll => 
        payroll._id === id ? { ...payroll, status: 'Paid' } : payroll
      ));
      Alert.alert('Success', 'Payroll marked as paid successfully');
      if (onRefresh) {
        onRefresh();
      }
      // Refresh the list
      await fetchPayrolls();
    } catch (error: any) {
      console.error('Error approving payroll:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to process payment');
    }
  };

  const handleEditPayroll = (payroll: PayrollRecord) => {
    setEditForm({
      workingDays: (payroll.workingDays || 0).toString(),
      workingHours: (payroll.workingHours || 0).toString(),
      bonus: (payroll.bonus || 0).toString(),
      allowances: (payroll.allowances || 0).toString(),
      deductions: (payroll.deductions || 0).toString(),
      tax: (payroll.tax || 0).toString(),
    });
    setSelectedPayroll(payroll);
    setEditVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPayroll) return;

    const updates: any = {};
    if (editForm.workingDays) updates.workingDays = parseFloat(editForm.workingDays);
    if (editForm.workingHours) updates.workingHours = parseFloat(editForm.workingHours);
    if (editForm.bonus) updates.bonus = parseFloat(editForm.bonus);
    if (editForm.allowances) updates.allowances = parseFloat(editForm.allowances);
    if (editForm.deductions) updates.deductions = parseFloat(editForm.deductions);
    if (editForm.tax) updates.tax = parseFloat(editForm.tax);

    if (Object.keys(updates).length === 0) {
      Alert.alert('No Changes', 'Please enter values to update');
      return;
    }

    await updatePayroll(selectedPayroll._id, updates);
    setEditVisible(false);
  };

  const updatePayroll = async (id: string, updates: {
    workingDays?: number;
    workingHours?: number;
    bonus?: number;
    deductions?: number;
    allowances?: number;
    tax?: number;
    netSalary?: number;
  }) => {
    try {
      await callApi({
        method: 'PUT',
        url: `/salary/updateOne/${id}`,
        data: updates,
      });
      Alert.alert('Success', 'Payroll updated successfully');
      await fetchPayrolls();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error updating payroll:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update payroll');
    }
  };

  const openDetail = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setDetailVisible(true);
  };

  // Search is handled by API, so we just filter by status if needed
  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesStatus = !statusFilter || (payroll.status || '') === statusFilter;
    return matchesStatus;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Payroll List ({total || payrolls.length})</Text>
          <TouchableOpacity
            style={[styles.generateButton, generating && styles.generateButtonDisabled]}
            onPress={() => setShowDatePicker(true)}
            disabled={generating}
          >
            {generating ? (
              <>
                <ActivityIndicator size="small" color="white" style={styles.generateLoader} />
                <Text style={styles.generateText}>Generating...</Text>
              </>
            ) : (
              <>
                <Icon name="add-circle-outline" size={18} color="white" />
                <Text style={styles.generateText}>Generate</Text>
              </>
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
            onPress={async () => {
              try {
                setLoading(true);
                // Fetch all payrolls for export
                const startDate = new Date(currentDateRange.startDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(currentDateRange.endDate);
                endDate.setHours(23, 59, 59, 999);

                const params: any = {
                  page: 1,
                  limit: 100000, // Max cap for export
                  sortField: 'createdAt',
                  sortOrder: 'desc',
                  startDate: startDate.toISOString(),
                  endDate: endDate.toISOString(),
                };

                if (statusFilter) {
                  params.status = statusFilter;
                }

                const response = await callApi({
                  method: 'GET',
                  url: '/salary',
                  params,
                });

                // Handle API response structure: { data: [], pagination: { total } }
                let allPayrolls: any[] = [];
                if (Array.isArray(response?.data)) {
                  allPayrolls = response.data;
                } else if (Array.isArray(response)) {
                  allPayrolls = response;
                }

                if (!allPayrolls.length) {
                  Alert.alert('Export', 'No payroll records to export.');
                  return;
                }

                const exportData = allPayrolls.map((item: any) => ({
                  employeeName: item.employee?.firstName && item.employee?.lastName
                    ? `${item.employee.firstName} ${item.employee.lastName}`
                    : item.employee?.fullName || item.employee?.name || 'N/A',
                  position: item.employee?.position || 
                           item.employee?.designation || 
                           'N/A',
                  payrollGenerationDate: item.createdAt || 
                                       item.paymentDate || 
                                       'N/A',
                  basicSalary: item.basicSalary || 0,
                  bonus: item.bonus || 0,
                  allowances: item.allowances || 0,
                  deductions: item.deductions || 0,
                  tax: item.tax || 0,
                  netSalary: item.netSalary || 0,
                  status: item.status || 'Pending',
                  workingDays: item.workingDays || 0,
                  workingHours: item.workingHours || 0,
                }));

                await exportToXlsx({
                  filename: `payrolls-${new Date().toISOString().split('T')[0]}`,
                  columns: [
                    { key: 'employeeName', header: 'Employee Name' },
                    { key: 'position', header: 'Position' },
                    { key: 'payrollGenerationDate', header: 'Generation Date' },
                    { key: 'basicSalary', header: 'Basic Salary' },
                    { key: 'workingDays', header: 'Working Days' },
                    { key: 'workingHours', header: 'Working Hours' },
                    { key: 'bonus', header: 'Bonus' },
                    { key: 'allowances', header: 'Allowances' },
                    { key: 'deductions', header: 'Deductions' },
                    { key: 'tax', header: 'Tax' },
                    { key: 'netSalary', header: 'Net Salary' },
                    { key: 'status', header: 'Status' },
                  ],
                  rows: exportData,
                });
                Alert.alert('Success', 'Payroll records exported successfully');
              } catch (error) {
                console.error('Failed to export payrolls to XLSX:', error);
                Alert.alert('Export Error', 'Failed to export payroll records. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
          >
            <Icon name="download" size={16} color="white" />
            <Text style={styles.exportText}>Export All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Icon name="filter-list" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <SearchableSelect
            label="Status"
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Paid', label: 'Paid' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            containerStyle={styles.filterSelect}
          />
        </View>
      )}

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
                        onPress={(e) => {
                          e.stopPropagation();
                          handleEditPayroll(payroll);
                        }}
                      >
                        <Icon name="edit" size={16} color="#2196F3" />
                      </TouchableOpacity>
                      {payroll.status !== 'Paid' && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleApprove(payroll._id);
                          }}
                        >
                          <Icon name="check" size={16} color="#4CAF50" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Pagination */}
      {!loading && total > 0 && (
        <View style={styles.paginationContainer}>
          <Text style={styles.paginationInfo}>
            Showing {((page - 1) * limit) + 1} - {Math.min(page * limit, total)} of {total}
          </Text>
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
              disabled={page >= Math.ceil(total / limit) || total === 0}
            >
              <Text style={[styles.paginationButtonText, (page >= Math.ceil(total / limit) || total === 0) && styles.paginationButtonTextDisabled]}>
                Next
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Generate Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date Range for Payroll Generation</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerRow}>
                <Text style={styles.datePickerLabel}>Start Date:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text>{generateDateRange.startDate.toLocaleDateString()}</Text>
                  <Icon name="calendar-today" size={18} color="#FF6B35" />
                </TouchableOpacity>
              </View>
              {showStartDatePicker && Platform.OS === 'ios' && (
                <DateTimePicker
                  value={generateDateRange.startDate}
                  mode="date"
                  display="spinner"
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    if (selectedDate && event.type !== 'dismissed') {
                      setGenerateDateRange(prev => ({
                        ...prev,
                        startDate: selectedDate,
                      }));
                    }
                    if (Platform.OS === 'ios') {
                      setShowStartDatePicker(false);
                    }
                  }}
                  maximumDate={generateDateRange.endDate}
                />
              )}
              <View style={styles.datePickerRow}>
                <Text style={styles.datePickerLabel}>End Date:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text>{generateDateRange.endDate.toLocaleDateString()}</Text>
                  <Icon name="calendar-today" size={18} color="#FF6B35" />
                </TouchableOpacity>
              </View>
              {showEndDatePicker && Platform.OS === 'ios' && (
                <DateTimePicker
                  value={generateDateRange.endDate}
                  mode="date"
                  display="spinner"
                  onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                    if (selectedDate && event.type !== 'dismissed') {
                      setGenerateDateRange(prev => ({
                        ...prev,
                        endDate: selectedDate,
                      }));
                    }
                    if (Platform.OS === 'ios') {
                      setShowEndDatePicker(false);
                    }
                  }}
                  minimumDate={generateDateRange.startDate}
                />
              )}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={generateSalaries}
                disabled={generating}
              >
                <Text style={styles.modalConfirmText}>Generate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Pickers for Generate Modal */}
      {showStartDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={generateDateRange.startDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowStartDatePicker(false);
            if (selectedDate && event.type !== 'dismissed') {
              setGenerateDateRange(prev => ({
                ...prev,
                startDate: selectedDate,
              }));
            }
          }}
          maximumDate={generateDateRange.endDate}
        />
      )}
      {showEndDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={generateDateRange.endDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
            setShowEndDatePicker(false);
            if (selectedDate && event.type !== 'dismissed') {
              setGenerateDateRange(prev => ({
                ...prev,
                endDate: selectedDate,
              }));
            }
          }}
          minimumDate={generateDateRange.startDate}
        />
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
                  <Text style={styles.detailLabel}>Working Days:</Text>
                  <Text style={styles.detailValue}>{selectedPayroll.workingDays ?? 0}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Working Hours:</Text>
                  <Text style={styles.detailValue}>{selectedPayroll.workingHours ?? 0}</Text>
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
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateLoader: {
    marginRight: 4,
  },
  generateText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  filtersContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterSelect: {
    flex: 1,
    minWidth: 200,
  },
  paginationContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  paginationInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  datePickerContainer: {
    gap: 16,
    marginBottom: 20,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 100,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginLeft: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  modalCancelText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  modalConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
  },
  modalConfirmText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  editScroll: {
    maxHeight: 400,
  },
  editForm: {
    gap: 16,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    width: 120,
  },
  editInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
});

export default PayrollTable;
