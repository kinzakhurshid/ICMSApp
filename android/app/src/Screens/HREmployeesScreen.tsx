import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';
import SummaryCard from '../components/SummaryCard';
import EmployeeTable from '../components/EmployeeTable';

interface StatWithChange {
  value: number;
  direction?: "up" | "down" | "none";
  change?: {
    value: number;
    direction: "up" | "down" | "none";
  };
}

interface DashboardStats {
  totalEmployees: StatWithChange;
  newEmployees: StatWithChange;
  resignedEmployees: StatWithChange;
  internshipEmployees: StatWithChange;
}

const HREmployeesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const statsRes = await callApi({ method: "GET", url: "/HR/empstats" });
      setStats(statsRes);
    } catch (err) {
      console.error('Error fetching HR dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <Text style={styles.breadcrumbText}>Dashboard / Employees</Text>
        </View>

        {/* Page Title */}
        <Text style={styles.pageTitle}>Employee management</Text>

        {/* Summary Cards */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Loading dashboard stats...</Text>
          </View>
        ) : stats ? (
          <View style={styles.summaryCardsContainer}>
            <View style={styles.cardRow}>
              <SummaryCard
                title="Total Employees"
                value={stats.totalEmployees.value}
                percent={stats.totalEmployees.change ? `${stats.totalEmployees.change.direction === 'up' ? '▲' : stats.totalEmployees.change.direction === 'down' ? '▼' : ''} ${stats.totalEmployees.change.value ?? 0}%` : undefined}
                color="#ea580c"
                bgColor="#FFF7ED"
              />
              <SummaryCard
                title="New Employees"
                value={stats.newEmployees.value}
                percent={stats.newEmployees.change ? `${stats.newEmployees.change.direction === 'up' ? '▲' : stats.newEmployees.change.direction === 'down' ? '▼' : ''} ${stats.newEmployees.change.value ?? 0}%` : undefined}
                color="#16a34a"
                bgColor="#ECFDF5"
              />
            </View>
            <View style={styles.cardRow}>
              <SummaryCard
                title="Resigned Employees"
                value={stats.resignedEmployees.value}
                percent={stats.resignedEmployees.change ? `${stats.resignedEmployees.change.direction === 'up' ? '▲' : stats.resignedEmployees.change.direction === 'down' ? '▼' : ''} ${stats.resignedEmployees.change.value ?? 0}%` : undefined}
                color="#dc2626"
                bgColor="#FEF2F2"
              />
              <SummaryCard
                title="Internship Employees"
                value={stats.internshipEmployees.value}
                percent={stats.internshipEmployees.change ? `${stats.internshipEmployees.change.direction === 'up' ? '▲' : stats.internshipEmployees.change.direction === 'down' ? '▼' : ''} ${stats.internshipEmployees.change.value ?? 0}%` : undefined}
                color="#facc15"
                bgColor="#FEFCE8"
              />
            </View>
          </View>
        ) : null}

        {/* Employee Table */}
        <EmployeeTable />
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
  breadcrumb: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#666',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  summaryCardsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});

export default HREmployeesScreen;