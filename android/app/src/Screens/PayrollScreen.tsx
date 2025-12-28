import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';
import PayrollSummaryCard from '../components/PayrollSummaryCard';
import PayrollChart from '../components/PayrollChart';
import PayrollTable from '../components/PayrollTable';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalPayrollCost: {
    total: number;
    change: number;
  };
  totalDeductions: {
    total: number;
    change: number;
  };
  pendingPayments: {
    total: number;
    change: number;
  };
  totalPayrolls: {
    total: number;
    change: number;
  };
  payrollTrends: Array<{
    month: string;
    cost: number;
    expense: number;
  }>;
  bonusesAndIncentives: {
    bonuses: number;
    incentives: number;
  };
}

const PayrollScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const statsRes = await callApi({
        method: 'GET',
        url: '/salary/dashboard',
        params: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
      });

      setStats({
        totalPayrollCost: {
          total: statsRes.totalPayrollCost || 0,
          change: 0,
        },
        totalDeductions: {
          total: statsRes.totalDeductions || 0,
          change: 0,
        },
        pendingPayments: {
          total: statsRes.pendingPayments || 0,
          change: 0,
        },
        totalPayrolls: {
          total: statsRes.totalPayrolls || 0,
          change: 0,
        },
        payrollTrends: statsRes.payrollTrends?.map((item: any) => ({
          month: item.month,
          cost: item.cost,
          expense: item.expense,
        })) || [],
        bonusesAndIncentives: {
          bonuses: statsRes.bonusesAndIncentives?.bonuses || 0,
          incentives: statsRes.bonusesAndIncentives?.incentives || 0,
        },
      });
    } catch (error) {
      setError('Failed to load payroll data. Please try again later.');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${(amount / 1000).toFixed(2)}K`;
  };

  const formatDateRange = () => {
    const startMonth = dateRange.startDate.toLocaleDateString('en-GB', { 
      month: 'short', 
      year: 'numeric',
      day: 'numeric'
    });
    const endMonth = dateRange.endDate.toLocaleDateString('en-GB', { 
      month: 'short', 
      year: 'numeric',
      day: 'numeric'
    });
    return `${startMonth} - ${endMonth}`;
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      setDateRange(prev => ({
        ...prev,
        startDate: selectedDate,
      }));
      if (Platform.OS === 'ios') {
        setShowDatePickerModal(false);
      }
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
    }
    if (selectedDate && event.type !== 'dismissed') {
      setDateRange(prev => ({
        ...prev,
        endDate: selectedDate,
      }));
      if (Platform.OS === 'ios') {
        setShowDatePickerModal(false);
      }
    }
  };

  const openDatePicker = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    if (Platform.OS === 'ios') {
      setShowDatePickerModal(true);
    } else {
      if (mode === 'start') {
        setShowStartDatePicker(true);
      } else {
        setShowEndDatePicker(true);
      }
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={fetchDashboardData}>
          Retry
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Payroll Data...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No payroll data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>Dashboard / Payroll</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Payroll management</Text>
        </View>
        
        {/* Date Range Picker - Separate Row */}
        <View style={styles.datePickerRow}>
          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateLabel}>Start Date:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('start')}
            >
              <Icon name="calendar-today" size={18} color="#FF6B35" />
              <Text style={styles.dateRangeText}>
                {dateRange.startDate.toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateLabel}>End Date:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => openDatePicker('end')}
            >
              <Icon name="calendar-today" size={18} color="#FF6B35" />
              <Text style={styles.dateRangeText}>
                {dateRange.endDate.toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Picker Modal for iOS */}
        {showDatePickerModal && Platform.OS === 'ios' && (
          <Modal
            visible={showDatePickerModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowDatePickerModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Select {datePickerMode === 'start' ? 'Start' : 'End'} Date
                  </Text>
                  <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                    <Icon name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={datePickerMode === 'start' ? dateRange.startDate : dateRange.endDate}
                  mode="date"
                  display="spinner"
                  onChange={datePickerMode === 'start' ? handleStartDateChange : handleEndDateChange}
                  maximumDate={datePickerMode === 'start' ? dateRange.endDate : undefined}
                  minimumDate={datePickerMode === 'end' ? dateRange.startDate : undefined}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowDatePickerModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Date Pickers for Android */}
        {showStartDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dateRange.startDate}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
            maximumDate={dateRange.endDate}
          />
        )}
        {showEndDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={dateRange.endDate}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            minimumDate={dateRange.startDate}
          />
        )}

        {/* Top Summary Cards */}
        <View style={styles.summaryCardsContainer}>
          <PayrollSummaryCard
            title="Payrolls Cost"
            value={stats.totalPayrollCost.total}
            change={stats.totalPayrollCost.change}
            isCurrency={true}
          />
          <PayrollSummaryCard
            title="Total Deductions"
            value={stats.totalDeductions.total}
            change={stats.totalDeductions.change}
            isCurrency={true}
          />
          <PayrollSummaryCard
            title="Pending Payments"
            value={stats.pendingPayments.total}
            change={stats.pendingPayments.change}
            isCurrency={true}
          />
          <PayrollSummaryCard
            title="Total Payrolls"
            value={stats.totalPayrolls.total}
            change={stats.totalPayrolls.change}
            isCurrency={false}
          />
        </View>

        {/* Charts Section */}
        <View style={styles.chartsContainer}>
          {/* Bonuses and Incentives - full width row */}
          <View style={styles.fullWidthChartCard}>
            <PayrollChart
              title="Bonuses and Incentives"
              bonuses={stats.bonusesAndIncentives.bonuses}
              incentives={stats.bonusesAndIncentives.incentives}
              formatCurrency={formatCurrency}
            />
          </View>
        </View>

        {/* Payroll Table */}
        <PayrollTable onRefresh={fetchDashboardData} dateRange={dateRange} />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
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
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  datePickerRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  dateRangeContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
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
  },
  modalActions: {
    marginTop: 20,
  },
  modalButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
    gap: 12,
  },
  chartsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 200,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  chartPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    padding: 20,
  },
  chartPlaceholderText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  chartPlaceholderSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PayrollScreen;
