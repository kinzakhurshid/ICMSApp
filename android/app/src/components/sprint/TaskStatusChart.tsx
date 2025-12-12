import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';

const { width } = Dimensions.get('window');

interface TaskStatusChartProps {
  counts: Record<string, number>;
}

const statusOrder = ['completed', 'in_progress', 'todo', 'in_review', 'blocked', 'unknown'];
const statusLabels: Record<string, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  todo: 'To Do',
  in_review: 'In Review',
  blocked: 'Blocked',
  unknown: 'Unknown',
};

const statusColors: Record<string, string> = {
  completed: '#10b981',
  in_progress: '#3b82f6',
  todo: '#f59e0b',
  in_review: '#9b59b6',
  blocked: '#ef4444',
  unknown: '#6b7280',
};

export default function TaskStatusChart({ counts }: TaskStatusChartProps) {
  const maxCount = Math.max(...Object.values(counts), 1);
  const chartHeight = 120;

  const barWidth = Math.max(60, (width - 100) / statusOrder.length);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task status distribution</Text>
      <View style={styles.chartContainer}>
        <View style={styles.yAxis}>
          {[1, 0].map((value) => (
            <Text key={value} style={styles.yAxisLabel}>
              {value}
            </Text>
          ))}
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.chart}>
            {statusOrder.map((status) => {
              const count = counts[status] || 0;
              const barHeight = maxCount > 0 ? (count / maxCount) * chartHeight : 0;

              return (
                <View key={status} style={[styles.barContainer, { width: barWidth }]}>
                  <View style={styles.barWrapper}>
                    {count > 0 && (
                      <View
                        style={[
                          styles.bar,
                          {
                            height: Math.max(barHeight, 20),
                            backgroundColor: statusColors[status],
                          },
                        ]}
                      >
                        <Text style={styles.barValue}>{count}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.labelContainer}>
                    <Text style={styles.xAxisLabel} numberOfLines={2}>
                      {statusLabels[status]}
                    </Text>
                    <Text style={styles.countLabel}>{count}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 180,
  },
  yAxis: {
    width: 24,
    justifyContent: 'space-between',
    paddingRight: 8,
    paddingTop: 0,
  },
  yAxisLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingRight: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 40,
    paddingLeft: 4,
    minWidth: width - 64,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  barWrapper: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 120,
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
  },
  emptyBarPlaceholder: {
    width: '100%',
    height: 0,
  },
  barValue: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  labelContainer: {
    alignItems: 'center',
    width: 60,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  xAxisLabel: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
    minHeight: 32,
    lineHeight: 14,
  },
  countLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
});

