import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface AccessoryStatsChartProps {
  stats: { label: string; count: number }[];
  title: string;
}

const AccessoryStatsChart: React.FC<AccessoryStatsChartProps> = ({ stats, title }) => {
  const maxCount = Math.max(...stats.map(s => s.count), 1);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.chartContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (stat.count / maxCount) * 120,
                    backgroundColor: '#FF6B35',
                  },
                ]}
              />
            </View>
            <Text style={styles.label}>{stat.label}</Text>
            <Text style={styles.count}>{stat.count}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 30,
    borderRadius: 4,
    minHeight: 4,
  },
  label: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default AccessoryStatsChart;
