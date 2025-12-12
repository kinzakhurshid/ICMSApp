import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
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
        <View style={styles.dropdownWrapper}>
          <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setShowDropdown(!showDropdown)}
          >
            <Text style={styles.dropdownText}>{timeFilter}</Text>
            <ChevronDown size={16} color="#374151" />
          </TouchableOpacity>
          {showDropdown && (
            <>
              <View style={styles.dropdownMenu}>
                {timeOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.dropdownItem,
                      timeFilter === option && styles.dropdownItemSelected
                    ]}
                    onPress={() => {
                      setTimeFilter(option as any);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.dropdownItemText,
                      timeFilter === option && styles.dropdownItemTextSelected
                    ]}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
                <View style={styles.dropdownBackdrop} />
              </TouchableWithoutFeedback>
            </>
          )}
          </View>
        </View>
      </View>

      {/* Content - Add extra spacing when dropdown is open to prevent overlap */}
      <View style={[
        styles.content, 
        showDropdown ? styles.contentWithDropdown : null
      ]}>
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
                    height={160}
                    chartConfig={chartConfig}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                  />
                </View>

                {/* Legends - Remove duplicates */}
                <View style={styles.legendContainer}>
                  {(() => {
                    // Remove duplicate labels to fix TC_14
                    const uniqueLabels = new Map<string, number>();
                    chartData.labels.forEach((label: string, index: number) => {
                      if (!uniqueLabels.has(label)) {
                        uniqueLabels.set(label, index);
                      }
                    });

                    return Array.from(uniqueLabels.entries()).map(([label, index]) => {
                      const value = chartData.values[index];
                      const total = chartData.values.reduce((a: number, b: number) => a + b, 0);
                      const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

                      return (
                        <View key={`${label}-${index}`} style={styles.legendItem}>
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
                    });
                  })()}
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
    padding: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 48,
    position: 'relative',
    zIndex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 100,
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
    paddingVertical: 8,
    minWidth: 130,
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 13,
    color: '#374151',
    marginRight: 6,
    fontWeight: '500',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    right: -10000,
    bottom: -10000,
    zIndex: 998,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    marginTop: 6,
    minWidth: 130,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF7ED',
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#F97316',
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
    paddingTop: 8,
    position: 'relative',
    zIndex: 0,
  },
  contentWithDropdown: {
    paddingTop: 150,
    marginTop: 0,
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 12,
    minHeight: 160,
    paddingVertical: 8,
    width: '100%',
  },
  legendContainer: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
    flexShrink: 0,
  },
  legendLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    marginRight: 12,
    lineHeight: 20,
  },
  legendPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    minWidth: 40,
    textAlign: 'right',
    lineHeight: 20,
  },
});

export default StatsChart;