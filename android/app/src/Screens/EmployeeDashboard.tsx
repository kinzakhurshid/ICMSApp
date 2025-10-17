import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import useAxios from '../hooks/useAxios';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

export default function EmployeeDashboardScreen() {
  const { callApi } = useAxios();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalTasks: 0,
    incompleteTasks: 0,
    attendanceRate: 100,
    totalLeaves: 0,
    totalStandups: 0,
    totalMeetings: 0,
    progress: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await callApi({
          method: "GET",
          url: "/employee/stats",
        });
        setDashboardData({
          totalTasks: response?.data?.totalTasks || 0,
          incompleteTasks: response?.data?.incompleteTasks || 0,
          attendanceRate: response?.data?.attendanceRate || 100,
          totalLeaves: response?.data?.totalLeaves || 0,
          totalStandups: response?.data?.totalStandups || 0,
          totalMeetings: response?.data?.totalMeetings || 0,
          progress: response?.data?.progress || 0
        });
      } catch (err) {
        setError('Failed to load dashboard data');
        // Use default data even if API fails
        setDashboardData({
          totalTasks: 0,
          incompleteTasks: 0,
          attendanceRate: 100,
          totalLeaves: 0,
          totalStandups: 0,
          totalMeetings: 0,
          progress: 0
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#f97316" />
      <Text style={styles.loadingText}>Loading dashboard...</Text>
    </View>
  );

  return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        {/* Row 1 */}
        <View style={styles.cardRow}>
          <DashboardCard 
            label="Total Tasks" 
            value={dashboardData.totalTasks} 
            icon="list-alt"
            iconColor="#3B82F6"
            buttonColor="#EFF6FF"
            textColor="#3B82F6"
          />
          <DashboardCard 
            label="Incompleted Task" 
            value={dashboardData.incompleteTasks} 
            icon="times-circle"
            iconColor="#EF4444"
            buttonColor="#FEF2F2"
            textColor="#EF4444"
          />
        </View>

        {/* Row 2 */}
        <View style={styles.cardRow}>
          <DashboardCard 
            label="Attendance Rate" 
            value={`${dashboardData.attendanceRate}%`} 
            icon="calendar-check-o"
            iconColor="#10B981"
            buttonColor="#ECFDF5"
            textColor="#10B981"
          />
          <DashboardCard 
            label="Total Leaves" 
            value={dashboardData.totalLeaves} 
            icon="paper-plane"
            iconColor="#F97316"
            buttonColor="#FFF7ED"
            textColor="#F97316"
          />
        </View>

        {/* Row 3 */}
        <View style={styles.cardRow}>
          <DashboardCard 
            label="Total Standup" 
            value={dashboardData.totalStandups} 
            icon="users"
            iconColor="#F97316"
            buttonColor="#FFF7ED"
            textColor="#F97316"
          />
          <DashboardCard 
            label="Total Meetings" 
            value={dashboardData.totalMeetings} 
            icon="video-camera"
            iconColor="#3B82F6"
            buttonColor="#EFF6FF"
            textColor="#3B82F6"
          />
        </View>
      </View>

      {/* Progress Card */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Progress</Text>
        <Text style={styles.progressDescription}>Calculate your overall performance</Text>
        <TouchableOpacity style={[styles.progressButton, { backgroundColor: '#EFF6FF' }]}>
          <Text style={[styles.progressButtonText, { color: '#3B82F6' }]}>This Month</Text>
        </TouchableOpacity>
        <Text style={styles.progressValue}>{dashboardData.progress}%</Text>
        <Text style={styles.progressLabel}>Average</Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function DashboardCard({ label, value, icon, iconColor, buttonColor, textColor }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Icon name={icon} size={24} color={iconColor} style={styles.cardIcon} />
      </View>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      <TouchableOpacity style={[styles.cardButton, { backgroundColor: buttonColor }]}>
        <Text style={[styles.cardButtonText, { color: textColor }]}>This Month</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  statsContainer: {
    marginBottom: 20,
  },
  cardRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 16,
    gap: 12,
  },
  card: { 
    flex: 1, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 16, 
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardLabel: { 
    fontSize: 14, 
    color: '#64748B', 
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  cardValue: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#1E293B',
    marginBottom: 12,
  },
  cardButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  cardButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  progressDescription: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  progressButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    fontSize: 14,
  },
});