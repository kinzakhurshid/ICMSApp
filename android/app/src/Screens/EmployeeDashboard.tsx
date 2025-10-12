import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import useAxios from '../hooks/useAxios'; // Adjust path as needed

export default function EmployeeDashboardScreen() {
  const { callApi } = useAxios();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await callApi({
          method: "GET",
          url: "/employee/stats",
        });
        setDashboardData(response.data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#f97316" /></View>;
  if (error || !dashboardData) return <View style={styles.centered}><Text>{error || 'No data found'}</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Employee Dashboard</Text>
      <View style={styles.cardRow}>
        <DashboardCard label="Total Tasks" value={dashboardData.totalTasks} />
        <DashboardCard label="Completed Tasks" value={dashboardData.completedTasks} />
        <DashboardCard label="Incomplete Tasks" value={dashboardData.incompleteTasks} />
      </View>
      <View style={styles.cardRow}>
        <DashboardCard label="Attendance Rate (%)" value={dashboardData.attendanceRate} />
        <DashboardCard label="Leaves" value={dashboardData.totalLeaves} />
        <DashboardCard label="Standups" value={dashboardData.totalStandups} />
        <DashboardCard label="Meetings" value={dashboardData.totalMeetings} />
      </View>
    </ScrollView>
  );
}

function DashboardCard({ label, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  card: { flex: 1, backgroundColor: '#f7f7f7', margin: 4, borderRadius: 8, padding: 12, alignItems: 'center' },
  cardLabel: { fontSize: 16, color: '#333', marginBottom: 4 },
  cardValue: { fontSize: 28, fontWeight: 'bold', color: '#f97316' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});