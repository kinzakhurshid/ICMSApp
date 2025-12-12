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
import useAxios from '../hooks/useAxios';
import MyTeamsCard from '../components/MyTeamsCard';
import HolidayChart from '../components/HolidayChart';
import LeaveTableSystem from '../components/LeaveTableSystem';

const LeavesScreen: React.FC = () => {
  const { callApi } = useAxios();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load leave data here
      // const leaveData = await callApi({ method: 'GET', url: '/leaves/stats' });
    } catch (error) {
      console.error('Error loading leave data:', error);
      Alert.alert('Error', 'Failed to load leave data');
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
          <Text style={styles.sectionTitle}>Pending Approval (0)</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending leaves found</Text>
          </View>
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
});

export default LeavesScreen;
