import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PayrollTrend } from '../types/dashboard';

type Props = {
  trends: PayrollTrend[];
};

const PayrollCostOverview: React.FC<Props> = ({ trends }) => {
  const displayed = trends.slice(-3); // last 3 months
  const max = Math.max(1, ...displayed.map(d => d.cost));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Payroll Cost Overview</Text>
      <View style={styles.chartRow}>
        {displayed.map(d => (
          <View key={d.month} style={styles.barItem}>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { height: `${(d.cost / max) * 100}%` }]} />
            </View>
            <Text style={styles.barLabel}>{formatMonth(d.month)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

function formatMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleString('en-US', { month: 'short' });
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 16, height: 180, padding: 8 },
  barItem: { alignItems: 'center', justifyContent: 'flex-end', flex: 1 },
  barBg: { width: '60%', height: '100%', backgroundColor: '#F3F4F6', borderRadius: 8, justifyContent: 'flex-end' },
  barFill: { width: '100%', backgroundColor: '#FB923C', borderRadius: 8 },
  barLabel: { marginTop: 6, fontSize: 12, color: '#6b7280' },
});

export default PayrollCostOverview;









