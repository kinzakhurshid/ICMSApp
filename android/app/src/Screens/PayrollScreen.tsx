import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
      month: '2-digit', 
      year: 'numeric' 
    });
    const endMonth = dateRange.endDate.toLocaleDateString('en-GB', { 
      month: '2-digit', 
      year: 'numeric' 
    });
    return `${startMonth} - ${endMonth}`;
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
          <View style={styles.dateRangeContainer}>
            <Text style={styles.dateRangeText}>{formatDateRange()}</Text>
          </View>
        </View>

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
          {/* Payroll Cost Overview */}
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Payroll Cost Overview</Text>
            <View style={styles.chartPlaceholder}>
              <Text style={styles.chartPlaceholderText}>Chart visualization would go here</Text>
              <Text style={styles.chartPlaceholderSubtext}>
                Bar chart showing payroll trends over time
              </Text>
            </View>
          </View>

          {/* Bonuses and Incentives */}
          <PayrollChart
            title="Bonuses and Incentives"
            bonuses={stats.bonusesAndIncentives.bonuses}
            incentives={stats.bonusesAndIncentives.incentives}
            formatCurrency={formatCurrency}
          />
        </View>

        {/* Payroll Table */}
        <PayrollTable onRefresh={fetchDashboardData} />
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
  },
  dateRangeContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 16,
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
    flex: 2,
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
