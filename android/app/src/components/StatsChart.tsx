import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import useAxios from '../hooks/useAxios';
import { ChevronDown } from 'lucide-react-native';
import { PieChart } from 'react-native-chart-kit';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';

interface StatsChartProps {
  title: string;
  endpoint: string;
  defaultFilter?: 'Today' | 'This Week' | 'This Month' | 'This Year';
  employeeId?: string;
}

const timeOptions = ['Today', 'This Week', 'This Month', 'This Year'];

const StatsChart = ({
  title,
  endpoint,
  defaultFilter = 'This Week',
  employeeId,
}: StatsChartProps) => {
  const { callApi } = useAxios();
  const [timeFilter, setTimeFilter] = useState(defaultFilter);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const getFilteredDateRange = (): { startDate?: string; endDate?: string } => {
    const now = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (timeFilter) {
      case 'Today':
        return {
          startDate: formatDate(startOfDay(now)),
          endDate: formatDate(endOfDay(now)),
        };
      case 'This Week':
        return {
          startDate: formatDate(startOfWeek(now, { weekStartsOn: 1 })),
          endDate: formatDate(endOfWeek(now, { weekStartsOn: 1 })),
        };
      case 'This Month':
        return {
          startDate: formatDate(startOfMonth(now)),
          endDate: formatDate(endOfMonth(now)),
        };
      case 'This Year':
        return {
          startDate: formatDate(startOfYear(now)),
          endDate: formatDate(endOfYear(now)),
        };
      default:
        return {};
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const dateRange = getFilteredDateRange();
      const response = await callApi({
        method: 'GET',
        url: endpoint,
        params: {
          employeeId,
          ...dateRange,
        },
      });
      setChartData(response);
    } catch (error) {
      console.error(`Failed to fetch ${title.toLowerCase()} data:`, error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [employeeId, timeFilter]);

  const screenWidth = Dimensions.get('window').width;

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    strokeWidth: 2,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>{timeFilter}</Text>
            <ChevronDown size={16} color="#374151" />
          </TouchableOpacity>
          {showDropdown && (
            <View style={styles.dropdownMenu}>
              {timeOptions.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setTimeFilter(option as any);
                    setShowDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <>
            {chartData && (
              <>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={chartData.labels.map((label: string, index: number) => ({
                      name: label,
                      population: chartData.values[index],
                      color: chartData.colors[index],
                      legendFontColor: '#374151',
                      legendFontSize: 12,
                    }))}
                    width={screenWidth - 80}
                    height={150}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>

                {/* Legends */}
                <View style={styles.legendContainer}>
                  {chartData.labels.map((label: string, index: number) => {
                    const value = chartData.values[index];
                    const total = chartData.values.reduce((a: number, b: number) => a + b, 0);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

                    return (
                      <View key={label} style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendColor,
                            { backgroundColor: chartData.colors[index] },
                          ]}
                        />
                        <Text style={styles.legendLabel}>{label}</Text>
                        <Text style={styles.legendPercentage}>{percentage}%</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 120,
  },
  dropdownText: {
    fontSize: 12,
    color: '#374151',
    marginRight: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginTop: 4,
    minWidth: 120,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#374151',
  },
  content: {
    alignItems: 'center',
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  legendContainer: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
});

export default StatsChart;