import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SprintStatsChartProps {
  counts: Record<string, number>;
  height?: number;
}

export const SprintStatsChart: React.FC<SprintStatsChartProps> = ({ 
  counts, 
  height = 160 
}) => {
  // Map DB status → human-readable label
  const statusLabels: Record<string, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    todo: "To Do",
    in_review: "In Review",
    blocked: "Blocked",
    Unknown: "Unknown"
  };

  const statuses = Object.keys(counts);
  const values = Object.values(counts);
  const labels = statuses.map(status => statusLabels[status] || status);

  // Prepare data for react-native-chart-kit
  const data = {
    labels: labels,
    datasets: [{
      data: values,
      colors: statuses.map((_, index) => (opacity = 1) => {
        const status = statuses[index];
        switch (status) {
          case 'completed': return `rgba(16, 185, 129, ${opacity})`; // green
          case 'in_progress': return `rgba(59, 130, 246, ${opacity})`; // blue
          case 'todo': return `rgba(245, 158, 11, ${opacity})`; // yellow
          case 'in_review': return `rgba(139, 92, 246, ${opacity})`; // purple
          case 'blocked': return `rgba(239, 68, 68, ${opacity})`; // red
          default: return `rgba(156, 163, 175, ${opacity})`; // gray
        }
      })
    }]
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    decimalPlaces: 0,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
  };

  // Calculate chart width based on number of labels
  const chartWidth = Math.max(screenWidth - 64, labels.length * 60);

  if (values.every(v => v === 0)) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Task status distribution</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tasks yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Task status distribution</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={data}
          width={chartWidth}
          height={height}
          chartConfig={chartConfig}
          style={styles.chart}
          showValuesOnTopOfBars={true}
          fromZero={true}
          yAxisSuffix=""
          yAxisInterval={1}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chart: {
    borderRadius: 8,
  },
  emptyContainer: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
