import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Item = { department: string; totalSalary: number; employees?: number };

const SalaryStatistics: React.FC<{ data: Item[] }>= ({ data }) => {
  const max = Math.max(1, ...data.map(d => d.totalSalary));
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Salary Statistics for October</Text>
      <View style={styles.chartRow}>
        {data.map(d => (
          <View key={d.department} style={styles.barItem}>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { height: `${(d.totalSalary / max) * 100}%` }]} />
            </View>
            <Text style={styles.barLabel} numberOfLines={1}>{d.department}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 24 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, height: 220, paddingHorizontal: 8, paddingBottom: 8 },
  barItem: { alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  barBg: { width: '60%', height: '100%', backgroundColor: '#F3F4F6', borderRadius: 8, justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: '#FB923C', borderRadius: 8 },
  barLabel: { marginTop: 6, fontSize: 12, color: '#6b7280', textAlign: 'center', maxWidth: 100 },
});

export default SalaryStatistics;


