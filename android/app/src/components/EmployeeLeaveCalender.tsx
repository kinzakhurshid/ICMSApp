import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isWeekend,
  addMonths,
  addYears,
} from 'date-fns';

interface CalendarDay {
  type: string | null;
  isHoliday: boolean;
}

const EmployeeLeaveCalendar = () => {
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const employeeId = currentUser?.employee._id;

  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [days, setDays] = useState<Record<string, CalendarDay>>({});
  const [holidays, setHolidays] = useState<any[]>([]);

  const fetchEmployeeLeaves = async () => {
    if (!employeeId) return;
    
    setIsLoading(true);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const res = await callApi({
        method: 'GET',
        url: '/leave/employeecalendar',
        params: {
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd'),
        },
      });

      setDays(res.days || {});
      setHolidays(res.holidays || []);
    } catch (error) {
      console.error('Failed to fetch employee calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLeaveForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return days[dateStr] || null;
  };

  useEffect(() => {
    fetchEmployeeLeaves();
  }, [employeeId, currentDate]);

  const getMonthDays = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  };

  const getYears = () => {
    const currentYear = currentDate.getFullYear();
    return Array.from({ length: 9 }, (_, i) => currentYear - 4 + i);
  };

  const navigateDate = (direction: number) => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, direction));
    } else {
      setCurrentDate(addYears(currentDate, direction));
    }
  };

  const getLeaveColor = (leaveType: string) => {
    switch (leaveType) {
      case 'Sick': return '#FECACA';
      case 'Annual': return '#DBEAFE';
      case 'Public': return '#E9D5FF';
      default: return '#FEF3C7';
    }
  };

  const renderMonthView = () => {
    const monthDays = getMonthDays();
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Split into weeks
    const weeks: Date[][] = [];
    for (let i = 0; i < monthDays.length; i += 7) {
      weeks.push(monthDays.slice(i, i + 7));
    }

    return (
      <View style={styles.calendarContainer}>
        {/* Weekday header */}
        <View style={styles.weekHeader}>
          {weekDays.map((day) => (
            <View key={day} style={styles.weekDay}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar days */}
        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                const leaveData = getLeaveForDate(day);
                const leaveType = leaveData?.type;
                const isHoliday = leaveData?.isHoliday;
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isDayToday = isToday(day);
                const isDayWeekend = isWeekend(day);

                let backgroundColor = '#FFFFFF';
                if (isHoliday) {
                  backgroundColor = '#D8B4FE';
                } else if (isDayWeekend) {
                  backgroundColor = '#F3F4F6';
                } else if (leaveType) {
                  backgroundColor = getLeaveColor(leaveType);
                } else if (!isCurrentMonth) {
                  backgroundColor = '#F9FAFB';
                }

                return (
                  <View
                    key={dayIndex}
                    style={[
                      styles.calendarDay,
                      { backgroundColor },
                      isDayToday && styles.todayBorder,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !isCurrentMonth && styles.otherMonthText,
                        isDayToday && styles.todayText,
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderYearView = () => {
    const years = getYears();

    return (
      <View style={styles.yearContainer}>
        {years.map((year) => (
          <TouchableOpacity
            key={year}
            style={[
              styles.yearItem,
              year === currentDate.getFullYear() && styles.selectedYear,
            ]}
            onPress={() => {
              const newDate = new Date(currentDate);
              newDate.setFullYear(year);
              setCurrentDate(newDate);
              setViewMode('month');
            }}
          >
            <Text style={styles.yearText}>{year}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.navigation}>
          <TouchableOpacity onPress={() => navigateDate(-1)} style={styles.navButton}>
            <ChevronLeft size={16} color="#374151" />
          </TouchableOpacity>

          <Text style={styles.title}>
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `${currentDate.getFullYear() - 4} - ${currentDate.getFullYear() + 4}`}
          </Text>

          <TouchableOpacity onPress={() => navigateDate(1)} style={styles.navButton}>
            <ChevronRight size={16} color="#374151" />
          </TouchableOpacity>
        </View>

        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            onPress={() => setViewMode('month')}
            style={[
              styles.toggleButton,
              viewMode === 'month' && styles.activeToggle,
            ]}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'month' && styles.activeToggleText,
            ]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('year')}
            style={[
              styles.toggleButton,
              viewMode === 'year' && styles.activeToggle,
            ]}
          >
            <Text style={[
              styles.toggleText,
              viewMode === 'year' && styles.activeToggleText,
            ]}>
              Year
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      ) : (
        <>
          {viewMode === 'month' ? renderMonthView() : renderYearView()}

          {/* Legend */}
          {viewMode === 'month' && (
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FECACA' }]} />
                <Text style={styles.legendText}>Sick</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#DBEAFE' }]} />
                <Text style={styles.legendText}>Annual</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#FEF3C7' }]} />
                <Text style={styles.legendText}>Other</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: '#D8B4FE' }]} />
                <Text style={styles.legendText}>Holiday</Text>
              </View>
            </View>
          )}
        </>
      )}
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
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navButton: {
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 8,
    textAlign: 'center',
    flex: 1,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeToggleText: {
    color: '#111827',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDay: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  calendarGrid: {
    // 6 rows for maximum weeks in a month
  },
  weekRow: {
    flexDirection: 'row',
    height: 40,
  },
  calendarDay: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayBorder: {
    borderColor: '#3B82F6',
    borderWidth: 1,
  },
  dayText: {
    fontSize: 12,
    color: '#111827',
  },
  otherMonthText: {
    color: '#9CA3AF',
  },
  todayText: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  yearContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
  },
  yearItem: {
    width: '30%',
    aspectRatio: 1.5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedYear: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  yearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
  },
});

export default EmployeeLeaveCalendar;