import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export type IdleChartPoint = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  data: IdleChartPoint[];
};

const IdleTimeChart: React.FC<Props> = ({ title, data }) => {
  const max = Math.max(1, ...data.map(d => d.value));

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {data.length === 0 ? (
        <View style={[styles.chartArea, styles.emptyWrap]}>
          <Text style={styles.empty}>No idle time data available</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={[styles.chartArea, { paddingBottom: 4 }]}>
            {data.map(point => (
              <View key={point.label} style={styles.barItem}>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { height: `${(point.value / max) * 100}%` }]} />
                </View>
                <Text style={styles.label} numberOfLines={1}>{point.label}</Text>
                <Text style={styles.value}>{point.value.toFixed(2)}h</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 18,
  },
  emptyWrap: {
    justifyContent: 'center',
    height: 160,
  },
  barItem: {
    flex: 1,
    alignItems: 'center',
  },
  barBg: {
    width: '70%',
    height: 160,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    justifyContent: 'flex-end',
    paddingBottom: 4,
  },
  barFill: {
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#FB923C',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: '#6B7280',
  },
  value: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  empty: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default IdleTimeChart;


