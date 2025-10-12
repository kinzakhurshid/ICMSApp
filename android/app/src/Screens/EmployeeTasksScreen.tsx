import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import useAxios from '../hooks/useAxios'; // Adjust path as needed

const periods = ['today', 'yesterday', 'thisWeek', 'thisMonth', 'allTime'];

export default function EmployeeTasksScreen() {
  const { callApi } = useAxios();
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);
  const [counts, setCounts] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await callApi({
          method: "GET",
          url: "/task/empstats",
          params: { period: selectedPeriod },
        });
        setCounts(response.counts);
      } catch (err) {
        setError('Failed to load task stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [selectedPeriod]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await callApi({
          method: "GET",
          url: "/task/employeetasks",
          params: { period: selectedPeriod }
        });
        setTasks(response.tasks || []);
      } catch (err) {}
    };
    fetchTasks();
  }, [selectedPeriod]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#f97316" /></View>;
  if (error || !counts) return <View style={styles.centered}><Text>{error || 'No data found'}</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Task Management</Text>
      <View style={styles.periodPickerRow}>
        {periods.map((p) => (
          <Text
            style={[
              styles.periodPickerItem,
              selectedPeriod === p && styles.periodPickerSelected
            ]}
            key={p}
            onPress={() => setSelectedPeriod(p)}
          >
            {p}
          </Text>
        ))}
      </View>
      <View style={styles.cardsRow}>
        <TaskCard title="Assigned" count={counts.assigned} color="#2563eb" />
        <TaskCard title="Completed" count={counts.completed} color="#16a34a" />
        <TaskCard title="Pending" count={counts.pending} color="#f59e42" />
        <TaskCard title="In Progress" count={counts.inProgress} color="#a855f7" />
        <TaskCard title="In Review" count={counts.inReview} color="#ec4899" />
      </View>
      <Text style={styles.subHeader}>Tasks</Text>
      {tasks.map((task, idx) => (
        <View key={idx} style={styles.taskRow}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskStatus}>{task.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function TaskCard({ title, count, color }) {
  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      <Text style={[styles.cardCount, { color }]}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  subHeader: { fontSize: 18, fontWeight: '600', marginVertical: 12 },
  periodPickerRow: { flexDirection: 'row', marginBottom: 12 },
  periodPickerItem: { padding: 8, marginRight: 8, borderRadius: 6, backgroundColor: '#f3f4f6', color: '#222' },
  periodPickerSelected: { backgroundColor: '#f97316', color: '#fff' },
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  card: { flex: 1, borderWidth: 2, borderRadius: 8, padding: 12, alignItems: 'center', margin: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardCount: { fontSize: 26, fontWeight: 'bold' },
  taskRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
  taskTitle: { fontSize: 16, flex: 3 },
  taskStatus: { fontSize: 16, flex: 1, textAlign: 'right', color: '#888' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});