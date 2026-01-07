import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSocket } from '../Context/SocketContext';
import { ONLINE_USERS } from '../constants/events';
import { formatDate, formatTimeForDisplay } from '../utills/utills';
import { BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

type Employee = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  role: string;
  profileImage?: string;
  user?: string | { _id: string };
};

type EmployeeOverview = {
  today?: {
    appUsage?: Array<{
      appName: string;
      totalDurationMinutes: number;
    }>;
    idleTime?: {
      totalIdleTimeMinutes: number;
      sessionCount: number;
    };
  };
  performance?: {
    summaries?: {
      '60'?: {
        performancePercent: number;
      };
    };
  };
};

type ScreenshotActivity = {
  _id: string;
  screenshot?: string;
  appName?: string;
  timestamp?: string;
  createdAt?: string;
  windowTitle?: string;
};

const OrgAdminActivitiesScreen: React.FC = () => {
  const { callApi } = useAxios();
  const { socket } = useSocket();
  const currentUser = useSelector((s: any) => s.user.currentUser);
  const orgId = currentUser?.organization;

  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'screenshots'>('overview');
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [employeeOverviews, setEmployeeOverviews] = useState<Map<string, EmployeeOverview>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [weekHistory, setWeekHistory] = useState<any>(null);
  const [monthHistory, setMonthHistory] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  // Screenshots state
  const [screenshots, setScreenshots] = useState<ScreenshotActivity[]>([]);
  const [shotDate, setShotDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [shotApp, setShotApp] = useState<string>('all');
  const [shotPage, setShotPage] = useState<number>(1);
  const [shotTotalPages, setShotTotalPages] = useState<number>(1);
  const [loadingScreenshots, setLoadingScreenshots] = useState(false);
  const [loadingMoreScreenshots, setLoadingMoreScreenshots] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotActivity | null>(null);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [iosPicker, setIosPicker] = useState<{ visible: boolean; value: Date }>({
    visible: false,
    value: new Date(),
  });

  // Employee dropdown state
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');

  // Fetch all employees
  const fetchEmployees = async () => {
    try {
      const list = (await callApi({
        method: 'GET',
        url: '/employee',
      })) as Employee[];
      setEmployees(list || []);
    } catch (e) {
      console.error('Failed to load employees', e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch employee overview
  const fetchEmployeeOverview = async (employeeId: string, employee: Employee) => {
    if (!orgId) return;
    try {
      setLoadingOverview(true);
      const timezoneOffsetMinutes = -new Date().getTimezoneOffset();
      const overviewParams: any = {
        organizationId: orgId,
        windowMinutes: 60,
        windows: '30,60,120',
        timezoneOffsetMinutes,
      };
      const overviewRes = (await callApi({
        method: 'GET',
        url: `/activities/user-overview/${employeeId}`,
        params: overviewParams,
      })) as any;

      setEmployeeOverviews((prev) => {
        const updated = new Map(prev);
        updated.set(employeeId, overviewRes.success ? overviewRes : null);
        return updated;
      });
    } catch (e: any) {
      console.error('Failed to load overview', e);
      setEmployeeOverviews((prev) => {
        const updated = new Map(prev);
        updated.set(employeeId, null);
        return updated;
      });
    } finally {
      setLoadingOverview(false);
    }
  };

  // Fetch employee history (week and month)
  const fetchEmployeeHistory = async (employeeId: string) => {
    if (!orgId || !selectedEmployee) return;
    try {
      setLoadingHistory(true);
      const userId = getEmployeeUserId(selectedEmployee);
      if (!userId) {
        console.error('No user ID found for employee');
        return;
      }
      const [weekRes, monthRes] = await Promise.all([
        callApi({
          method: 'GET',
          url: `/activities/history/employee/${userId}`,
          params: { organizationId: orgId, range: 'week' },
        }),
        callApi({
          method: 'GET',
          url: `/activities/history/employee/${userId}`,
          params: { organizationId: orgId, range: 'month' },
        }),
      ]);
      setWeekHistory(weekRes);
      setMonthHistory(monthRes);
    } catch (e: any) {
      console.error('Failed to load history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch screenshots
  const fetchScreenshots = async (page = 1) => {
    if (!orgId) return;
    try {
      page === 1 ? setLoadingScreenshots(true) : setLoadingMoreScreenshots(true);
      const params: any = {
        page,
        limit: 12,
        hasScreenshot: 'true',
      };
      if (selectedEmployee) {
        params.employeeId = selectedEmployee._id;
      }
      if (shotDate) {
        params.date = shotDate;
      }
      if (shotApp !== 'all') {
        params.appName = shotApp;
      }

      const response: any = await callApi({
        method: 'GET',
        url: `/activities/org/${orgId}`,
        params,
      });

      const screenshotActivities = response.activities || [];
      if (page === 1) {
        setScreenshots(screenshotActivities);
    } else {
        setScreenshots((prev) => [...prev, ...screenshotActivities]);
      }
      setShotTotalPages(Math.ceil((response.total || 0) / 12));
      setShotPage(page);
    } catch (err) {
      console.error('Failed to fetch screenshots', err);
    } finally {
      setLoadingScreenshots(false);
      setLoadingMoreScreenshots(false);
    }
  };

  // Socket listener for online users
  const onlineUsersListener = useCallback((data: any) => {
    try {
      if (Array.isArray(data)) {
        setOnlineUsers(data.map((id) => id?.toString()));
      }
    } catch {
      // ignore malformed payloads
    }
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;
    socket.on(ONLINE_USERS, onlineUsersListener);
    return () => {
      socket.off(ONLINE_USERS, onlineUsersListener);
    };
  }, [socket, onlineUsersListener]);

  // Initial load
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch overview when employee is selected
  useEffect(() => {
    if (selectedEmployee) {
      fetchEmployeeOverview(selectedEmployee._id, selectedEmployee);
      fetchEmployeeHistory(selectedEmployee._id);
      if (activeTab === 'screenshots') {
        fetchScreenshots(1);
      }
    }
  }, [selectedEmployee]);

  // Fetch screenshots when tab or filters change
  useEffect(() => {
    if (activeTab === 'screenshots' && selectedEmployee) {
      fetchScreenshots(1);
    }
  }, [activeTab, shotDate, shotApp]);

  // Get employee initials
  const getInitials = (employee: Employee) => {
    const first = employee.firstName?.[0] || '';
    const last = employee.lastName?.[0] || '';
    return `${first}${last}`.toUpperCase();
  };

  // Get employee display name
  const getEmployeeDisplayName = (employee: Employee) => {
    return `${employee.firstName} ${employee.lastName}`.trim();
  };

  // Filter employees based on search query and status filter
  const filteredEmployees = employees.filter((employee) => {
    // Apply status filter (online/offline)
    if (statusFilter !== 'all') {
      const isOnline = isEmployeeOnline(employee);
      if (statusFilter === 'online' && !isOnline) return false;
      if (statusFilter === 'offline' && isOnline) return false;
    }
    
    // Apply search query filter
    if (!employeeSearchQuery.trim()) return true;
    const searchLower = employeeSearchQuery.toLowerCase();
    const fullName = getEmployeeDisplayName(employee).toLowerCase();
    const email = (employee.email || '').toLowerCase();
    const position = (employee.position || employee.role || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower) || position.includes(searchLower);
  });

  // Handle employee selection from dropdown
  const handleEmployeeSelect = (employee: Employee | null) => {
    if (employee) {
      setSelectedEmployee(employee);
      setActiveTab('overview');
    } else {
      setSelectedEmployee(null);
    }
    setShowEmployeeDropdown(false);
    setEmployeeSearchQuery('');
  };

  // Get employee user ID
  const getEmployeeUserId = (employee: Employee): string | null => {
    if (typeof employee.user === 'string') return employee.user;
    if (employee.user?._id) return employee.user._id;
    return employee._id; // Fallback to employee ID
  };

  // Check if employee is online
  const isEmployeeOnline = (employee: Employee): boolean => {
    const userId = getEmployeeUserId(employee);
    return userId ? onlineUsers.includes(userId) : false;
  };

  // Get today's hours from overview
  const getTodayHours = (overview: EmployeeOverview | null): string => {
    if (!overview?.today?.appUsage) return '00:00';
    const totalMinutes = overview.today.appUsage.reduce(
      (sum, app) => sum + (app.totalDurationMinutes || 0),
      0
    );
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60); // Ensure integer, no decimals
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Get idle time
  const getIdleTime = (overview: EmployeeOverview | null): string => {
    if (!overview?.today?.idleTime) return '00:00';
    const totalMinutes = overview.today.idleTime.totalIdleTimeMinutes || 0;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60); // Ensure integer, no decimals
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Get productivity percentage
  const getProductivity = (overview: EmployeeOverview | null): number => {
    return overview?.performance?.summaries?.['60']?.performancePercent || 0;
  };

  // Get productivity color
  const getProductivityColor = (productivity: number): string => {
    if (productivity >= 70) return '#22C55E'; // Green
    if (productivity >= 40) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  // Format date for display
  const formatDisplayDate = (value: string) => {
    if (!value) return '';
    try {
      const date = new Date(value);
      return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    } catch {
      return value;
    }
  };

  // Handle date picker
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10);
      setShotDate(iso);
      if (Platform.OS === 'ios') {
        setIosPicker({ visible: false, value: selectedDate });
      }
    }
  };

  // Render employee card
  const renderEmployeeCard = (employee: Employee) => {
    const overview = employeeOverviews.get(employee._id);
    const isOnline = isEmployeeOnline(employee);
    const todayHours = getTodayHours(overview || null);
    const idleTime = getIdleTime(overview || null);
    const productivity = getProductivity(overview || null);
    const productivityColor = getProductivityColor(productivity);

    // Fetch overview if not loaded
    if (!overview && !loadingOverview) {
      fetchEmployeeOverview(employee._id, employee);
    }

    return (
      <TouchableOpacity
        key={employee._id}
        style={styles.employeeCard}
        onPress={() => {
          setSelectedEmployee(employee);
          setActiveTab('overview'); // Reset to overview tab when selecting employee
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarContainer}>
            {employee.profileImage ? (
              <Image source={{ uri: employee.profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: '#FB923C' }]}>
                <Text style={styles.avatarText}>{getInitials(employee)}</Text>
              </View>
            )}
            {isOnline && <View style={styles.onlineIndicator} />}
          </View>
          <View style={styles.cardHeaderRight}>
            <Text style={styles.employeeName}>
              {employee.firstName} {employee.lastName}
            </Text>
            <View style={styles.positionRow}>
              <MaterialIcons name="business" size={14} color="#6B7280" />
              <Text style={styles.positionText}>{employee.position || employee.role}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.cardMenu}
            onPress={() => {
              // Quick action menu - show options
              // TODO: Implement quick actions (view details, etc.)
              setSelectedEmployee(employee);
              setActiveTab('overview');
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="more-vert" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.cardMetrics}>
          <View style={styles.metricItem}>
            <MaterialIcons name="access-time" size={16} color="#FB923C" />
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Today Hours</Text>
              <Text style={styles.metricValue}>{todayHours}</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <MaterialIcons name="timer-off" size={16} color="#6B7280" />
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Idle Time</Text>
              <Text style={styles.metricValue}>{idleTime}</Text>
            </View>
          </View>

          <View style={styles.metricItem}>
            <MaterialIcons name="trending-up" size={16} color={productivityColor} />
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Productivity</Text>
              <Text style={[styles.metricValue, { color: productivityColor }]}>
                {productivity}%
              </Text>
            </View>
          </View>
        </View>

        {productivity < 40 && (
          <View style={styles.needsImprovement}>
            <MaterialIcons name="warning" size={14} color="#EF4444" />
            <Text style={styles.needsImprovementText}>Needs Improvement</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render overview tab
  const renderOverviewTab = () => {
    if (!selectedEmployee) return null;

    const overview = employeeOverviews.get(selectedEmployee._id);
    const isOverviewLoading = loadingOverview && !overview;
    
    if (isOverviewLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FB923C" />
          <Text style={styles.loadingText}>Loading overview...</Text>
        </View>
      );
    }

    const todayHours = getTodayHours(overview || null);
    const idleTime = getIdleTime(overview || null);
    const productivity = getProductivity(overview || null);
    const productivityColor = getProductivityColor(productivity);
    const idleSessions = overview?.today?.idleTime?.sessionCount || 0;

    return (
      <ScrollView style={styles.overviewContainer}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricCardTitle}>Today's Working Hours</Text>
            <Text style={styles.metricCardValue}>{todayHours}</Text>
            <Text style={styles.metricCardSubtitle}>Based on daily summary</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricCardTitle}>Today's Idle Time</Text>
            <Text style={styles.metricCardValue}>{idleTime}</Text>
            <Text style={styles.metricCardSubtitle}>
              Sessions: {idleSessions} • Click for details
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricCardTitle}>Today's Productivity</Text>
            <Text style={[styles.metricCardValue, { color: productivityColor }]}>
              {productivity}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${productivity}%`, backgroundColor: productivityColor },
                ]}
              />
            </View>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricCardTitle}>Live Activity (Last 60 min)</Text>
            <Text style={[styles.metricCardValue, { color: productivityColor }]}>
              {productivity}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${productivity}%`, backgroundColor: productivityColor },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Live Active vs Idle Chart */}
        {overview?.performance?.summaries && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Live Active vs Idle (Recent Windows)</Text>
            {renderLiveActiveVsIdleChart(overview)}
          </View>
        )}

        {/* Today App Usage Chart */}
        {overview?.today?.appUsage && overview.today.appUsage.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Today App Usage (minutes)</Text>
            {renderTodayAppUsageChart(overview.today.appUsage)}
          </View>
        )}

        {/* Weekly Productivity Trend */}
        {weekHistory?.success && weekHistory.days && weekHistory.days.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Weekly Productivity Trend</Text>
            {renderWeeklyProductivityChart(weekHistory.days)}
          </View>
        )}

        {/* Monthly Performance */}
        {monthHistory?.success && monthHistory.days && monthHistory.days.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Monthly Performance (Last 30 Days)</Text>
            {renderMonthlyPerformanceChart(monthHistory.days)}
          </View>
        )}
      </ScrollView>
    );
  };

  // Render Live Active vs Idle Chart
  const renderLiveActiveVsIdleChart = (overview: EmployeeOverview) => {
    const summaries = overview.performance?.summaries || {};
    const windows = ['30', '60', '120'];
    const labels = windows.map(w => `${w}m`);
    const activeData = windows.map(w => summaries[w]?.performancePercent || 0);
    const engagementData = windows.map(w => summaries[w]?.activityScore || 0);

    const chartData = {
      labels,
      datasets: [
        {
          data: activeData,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue
        },
        {
          data: engagementData,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`, // Green
        },
      ],
    };

    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForBackgroundLines: {
        strokeDasharray: '5,5',
        stroke: '#E5E7EB',
      },
    };

    return (
      <View>
        <BarChart
          data={chartData}
          width={width - 64}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          yAxisLabel=""
          yAxisSuffix="%"
          showValuesOnTopOfBars
        />
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Active %</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Engagement Score</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Today App Usage Chart
  const renderTodayAppUsageChart = (appUsage: Array<{ appName: string; totalDurationMinutes: number }>) => {
    const sortedApps = [...appUsage].sort((a, b) => b.totalDurationMinutes - a.totalDurationMinutes).slice(0, 5);
    const labels = sortedApps.map(app => app.appName.length > 10 ? app.appName.substring(0, 10) + '...' : app.appName);
    const data = sortedApps.map(app => app.totalDurationMinutes);
    const maxValue = Math.max(...data, 1);

    // Bar chart data
    const barChartData = {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      }],
    };

    // Pie chart data
    const pieData = sortedApps.map((app, index) => ({
      name: app.appName,
      minutes: app.totalDurationMinutes,
      color: `hsl(${index * 60}, 70%, 50%)`,
      legendFontColor: '#374151',
      legendFontSize: 12,
    }));

    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    };

    return (
      <View style={styles.appUsageContainer}>
        <View style={styles.appUsageBarChart}>
          <BarChart
            data={barChartData}
            width={width - 64}
            height={200}
            chartConfig={chartConfig}
            verticalLabelRotation={-45}
            fromZero
            yAxisLabel=""
            yAxisSuffix="m"
            showValuesOnTopOfBars
          />
        </View>
        <View style={styles.appUsagePieChart}>
          <PieChart
            data={pieData}
            width={width - 64}
            height={180}
            chartConfig={chartConfig}
            accessor="minutes"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
        <View style={styles.chartLegend}>
          {sortedApps.map((app, index) => (
            <View key={app.appName} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: `hsl(${index * 60}, 70%, 50%)` }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {app.appName.length > 15 ? app.appName.substring(0, 15) + '...' : app.appName} ({app.totalDurationMinutes}m)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render Weekly Productivity Chart
  const renderWeeklyProductivityChart = (days: Array<{ date: string; productivityPercent: number }>) => {
    const sortedDays = [...days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const labels = sortedDays.map(day => {
      const date = new Date(day.date);
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    });
    const data = sortedDays.map(day => day.productivityPercent || 0);

    const chartData = {
      labels,
      datasets: [{
        data,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      }],
    };

    const chartConfig = {
      backgroundColor: '#ffffff',
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 0,
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
      propsForBackgroundLines: {
        strokeDasharray: '5,5',
        stroke: '#E5E7EB',
      },
    };

    return (
      <View>
        <BarChart
          data={chartData}
          width={width - 64}
          height={220}
          chartConfig={chartConfig}
          verticalLabelRotation={0}
          fromZero
          yAxisLabel=""
          yAxisSuffix="%"
          showValuesOnTopOfBars
        />
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>Productivity %</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Monthly Performance Chart
  const renderMonthlyPerformanceChart = (days: Array<{ date: string; totalWorkMinutes: number; idleMinutes: number }>) => {
    const sortedDays = [...days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-30);
    const labels = sortedDays.map(day => {
      const date = new Date(day.date);
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    });
    
    // Convert minutes to hours for display
    const workHours = sortedDays.map(day => (day.totalWorkMinutes || 0) / 60);
    const idleHours = sortedDays.map(day => (day.idleMinutes || 0) / 60);

    // For stacked bar chart, we need to use a custom implementation
    // Since react-native-chart-kit doesn't support stacked bars natively, we'll create a custom view
    const maxValue = Math.max(...workHours.map((w, i) => w + idleHours[i]), 1);

    return (
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.stackedChartContainer}>
            {sortedDays.map((day, index) => {
              const workH = (day.totalWorkMinutes || 0) / 60;
              const idleH = (day.idleMinutes || 0) / 60;
              const totalH = workH + idleH;
              const workHeight = (workH / maxValue) * 150;
              const idleHeight = (idleH / maxValue) * 150;
              
              return (
                <View key={day.date} style={styles.stackedBarContainer}>
                  <View style={styles.stackedBarWrapper}>
                    <View style={[styles.stackedBarSegment, { height: workHeight, backgroundColor: '#22C55E' }]} />
                    <View style={[styles.stackedBarSegment, { height: idleHeight, backgroundColor: '#FB923C' }]} />
                  </View>
                  <Text style={styles.stackedBarLabel} numberOfLines={1}>
                    {labels[index]}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.chartLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Work minutes</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FB923C' }]} />
            <Text style={styles.legendText}>Idle minutes</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render screenshots tab
  const renderScreenshotsTab = () => {
    return (
      <ScrollView style={styles.screenshotsContainer}>
        <View style={styles.screenshotFilters}>
          <TouchableOpacity
            style={styles.dateFilterButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                setIosPicker({ visible: true, value: shotDate ? new Date(shotDate) : new Date() });
              } else {
                setShowDatePicker(true);
              }
            }}
          >
            <Text style={styles.dateFilterText}>
              {shotDate ? formatDisplayDate(shotDate) : 'Select Date'}
            </Text>
            <MaterialIcons name="calendar-today" size={18} color="#FB923C" />
          </TouchableOpacity>
          
          {/* Quick date selection buttons */}
          <View style={styles.quickDateButtons}>
            <TouchableOpacity
              style={[styles.quickDateButton, shotDate === new Date().toISOString().slice(0, 10) && styles.quickDateButtonActive]}
              onPress={() => setShotDate(new Date().toISOString().slice(0, 10))}
            >
              <Text style={[styles.quickDateButtonText, shotDate === new Date().toISOString().slice(0, 10) && styles.quickDateButtonTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickDateButton]}
              onPress={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setShotDate(yesterday.toISOString().slice(0, 10));
              }}
            >
              <Text style={styles.quickDateButtonText}>
                Yesterday
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickDateButton]}
              onPress={() => {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                setShotDate(weekAgo.toISOString().slice(0, 10));
              }}
            >
              <Text style={styles.quickDateButtonText}>
                Week Ago
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.appFilters}>
            {['all', 'Chrome', 'VSCode', 'Slack', 'UnrealEditor'].map((app) => (
              <TouchableOpacity
                key={app}
                style={[styles.appChip, shotApp === app && styles.appChipActive]}
                onPress={() => setShotApp(app)}
              >
                <Text
                  style={[styles.appChipText, shotApp === app && styles.appChipTextActive]}
                >
                  {app === 'all' ? 'All Applications' : app}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loadingScreenshots ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FB923C" />
          </View>
        ) : (
          <View style={styles.screenshotsGrid}>
            {screenshots.map((shot) => (
              <TouchableOpacity
                key={shot._id}
                style={styles.screenshotCard}
                onPress={() => setSelectedScreenshot(shot)}
              >
                {shot.screenshot ? (
                  <Image source={{ uri: shot.screenshot }} style={styles.screenshotImage} />
                ) : (
                  <View style={[styles.screenshotImage, styles.screenshotPlaceholder]} />
                )}
                <View style={styles.screenshotOverlay}>
                  <Text style={styles.screenshotAppName} numberOfLines={1}>
                    {shot.appName || shot.windowTitle || 'Unknown App'}
                  </Text>
                  <Text style={styles.screenshotTimestamp}>
                    {shot.timestamp || shot.createdAt
                      ? formatDate(shot.timestamp || shot.createdAt || '')
                      : 'Unknown date'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {shotPage < shotTotalPages && !loadingScreenshots && (
          <TouchableOpacity
            style={styles.loadMoreButton}
            onPress={() => fetchScreenshots(shotPage + 1)}
            disabled={loadingMoreScreenshots}
          >
            {loadingMoreScreenshots ? (
              <ActivityIndicator size="small" color="#FB923C" />
            ) : (
              <Text style={styles.loadMoreText}>Load More</Text>
            )}
          </TouchableOpacity>
        )}

        {!loadingScreenshots && screenshots.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No screenshots found</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  if (loading) {
  return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FB923C" />
      </View>
    );
  }

  // Employee detail view
  if (selectedEmployee) {
    return (
      <View style={styles.container}>
        {/* Header Banner */}
        <View style={styles.detailBanner}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              setSelectedEmployee(null);
              setActiveTab('overview');
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.backButtonText}>Back to All Employees</Text>
          </TouchableOpacity>
          <View style={styles.detailHeader}>
            <View style={styles.detailAvatarContainer}>
              {selectedEmployee.profileImage ? (
                <Image
                  source={{ uri: selectedEmployee.profileImage }}
                  style={styles.detailAvatar}
                />
              ) : (
                <View style={[styles.detailAvatarPlaceholder, { backgroundColor: '#FB923C' }]}>
                  <Text style={styles.detailAvatarText}>{getInitials(selectedEmployee)}</Text>
                </View>
              )}
            </View>
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Viewing Details</Text>
              <Text style={styles.detailName}>
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <MaterialIcons
              name="bar-chart"
              size={18}
              color={activeTab === 'overview' ? '#FB923C' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'screenshots' && styles.tabActive]}
            onPress={() => setActiveTab('screenshots')}
          >
            <MaterialIcons
              name="camera-alt"
              size={18}
              color={activeTab === 'screenshots' ? '#FB923C' : '#6B7280'}
            />
            <Text style={[styles.tabText, activeTab === 'screenshots' && styles.tabTextActive]}>
              Screenshots
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' ? renderOverviewTab() : renderScreenshotsTab()}

        {/* Date Picker */}
        {showDatePicker && (
        <DateTimePicker
            value={shotDate ? new Date(shotDate) : new Date()}
          mode="date"
            display="calendar"
            onChange={handleDateChange}
            maximumDate={new Date()} // Allow past dates, but not future dates
        />
      )}

      {Platform.OS === 'ios' && iosPicker.visible && (
        <Modal transparent animationType="fade" visible={iosPicker.visible}>
            <Pressable style={styles.modalBackdrop} onPress={() => setIosPicker({ visible: false, value: new Date() })} />
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <DateTimePicker
                value={iosPicker.value}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  if (date) {
                    setIosPicker({ visible: true, value: date });
                  }
                }}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setIosPicker({ visible: false, value: new Date() })}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    const iso = iosPicker.value.toISOString().slice(0, 10);
                    setShotDate(iso);
                    setIosPicker({ visible: false, value: new Date() });
                  }}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>
                    Apply
                  </Text>
                </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

        {/* Screenshot Lightbox */}
        {selectedScreenshot && (
          <Modal
            visible={!!selectedScreenshot}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedScreenshot(null)}
          >
            <Pressable style={styles.lightboxBackdrop} onPress={() => setSelectedScreenshot(null)}>
              <View style={styles.lightboxContent}>
                {selectedScreenshot.screenshot && (
                  <Image
                    source={{ uri: selectedScreenshot.screenshot }}
                    style={styles.lightboxImage}
                    resizeMode="contain"
                  />
                )}
                <View style={styles.lightboxInfo}>
                  <Text style={styles.lightboxAppName}>
                    {selectedScreenshot.appName || selectedScreenshot.windowTitle || 'Unknown App'}
          </Text>
                  <Text style={styles.lightboxTimestamp}>
                    {selectedScreenshot.timestamp || selectedScreenshot.createdAt
                      ? new Date(selectedScreenshot.timestamp || selectedScreenshot.createdAt || '').toLocaleString()
                      : 'Unknown date'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.lightboxClose}
                  onPress={() => setSelectedScreenshot(null)}
                >
                  <MaterialIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            </Pressable>
          </Modal>
        )}
            </View>
    );
  }

  // All employees view
  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Activities Overview</Text>

        {/* Employee Selector */}
        <View style={styles.selectorCard}>
          <Text style={styles.selectorLabel}>Select Employee</Text>
          <TouchableOpacity
            style={styles.selectorDropdown}
            onPress={() => setShowEmployeeDropdown(true)}
          >
            <Text style={styles.selectorDropdownText}>
              {selectedEmployee ? getEmployeeDisplayName(selectedEmployee) : 'All Employees'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Status Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Status</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'online' && styles.filterButtonActive]}
              onPress={() => setStatusFilter('online')}
            >
              <MaterialIcons 
                name="circle" 
                size={12} 
                color={statusFilter === 'online' ? '#fff' : '#22C55E'} 
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterButtonText, statusFilter === 'online' && styles.filterButtonTextActive]}>
                Online
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, statusFilter === 'offline' && styles.filterButtonActive]}
              onPress={() => setStatusFilter('offline')}
            >
              <MaterialIcons 
                name="circle" 
                size={12} 
                color={statusFilter === 'offline' ? '#fff' : '#9CA3AF'} 
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterButtonText, statusFilter === 'offline' && styles.filterButtonTextActive]}>
                Offline
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* All Employees Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="analytics" size={20} color="#FB923C" />
          <Text style={styles.sectionTitle}>All Employees Overview</Text>
                </View>
        <View style={styles.employeesGrid}>
          {filteredEmployees.map((employee) => renderEmployeeCard(employee))}
        </View>
        {filteredEmployees.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No employees found</Text>
          </View>
        )}
      </View>
      </ScrollView>

      {/* Employee Dropdown Modal */}
      <Modal
        visible={showEmployeeDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowEmployeeDropdown(false);
          setEmployeeSearchQuery('');
        }}
      >
        <Pressable
          style={styles.dropdownBackdrop}
          onPress={() => {
            setShowEmployeeDropdown(false);
            setEmployeeSearchQuery('');
          }}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Select Employee</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEmployeeDropdown(false);
                  setEmployeeSearchQuery('');
                }}
              >
                <MaterialIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.dropdownSearchContainer}>
              <MaterialIcons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.dropdownSearchInput}
                placeholder="Search employees..."
                placeholderTextColor="#9CA3AF"
                value={employeeSearchQuery}
                onChangeText={setEmployeeSearchQuery}
                autoFocus
              />
              {employeeSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setEmployeeSearchQuery('')}>
                  <MaterialIcons name="clear" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* All Employees Option */}
            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.dropdownItem,
                  !selectedEmployee && styles.dropdownItemSelected,
                ]}
                onPress={() => handleEmployeeSelect(null)}
              >
                <View style={styles.dropdownItemContent}>
                  <View style={styles.dropdownItemAvatar}>
                    <MaterialIcons name="people" size={20} color="#FB923C" />
                  </View>
                  <Text
                    style={[
                      styles.dropdownItemText,
                      !selectedEmployee && styles.dropdownItemTextSelected,
                    ]}
                  >
                    All Employees
                  </Text>
                </View>
                {!selectedEmployee && (
                  <MaterialIcons name="check" size={20} color="#FB923C" />
                )}
              </TouchableOpacity>

              {/* Employee List */}
              {filteredEmployees.map((employee) => {
                const isSelected = selectedEmployee?._id === employee._id;
                return (
                  <TouchableOpacity
                    key={employee._id}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemSelected]}
                    onPress={() => handleEmployeeSelect(employee)}
                  >
                    <View style={styles.dropdownItemContent}>
                      <View style={styles.dropdownItemAvatar}>
                        {employee.profileImage ? (
                          <Image
                            source={{ uri: employee.profileImage }}
                            style={styles.dropdownItemAvatarImage}
                          />
                        ) : (
                          <View
                            style={[
                              styles.dropdownItemAvatarPlaceholder,
                              { backgroundColor: '#FB923C' },
                            ]}
                          >
                            <Text style={styles.dropdownItemAvatarText}>
                              {getInitials(employee)}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.dropdownItemInfo}>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isSelected && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {getEmployeeDisplayName(employee)}
                        </Text>
                        <Text style={styles.dropdownItemSubtext}>
                          {employee.position || employee.role || employee.email}
                        </Text>
                      </View>
                    </View>
                    {isSelected && <MaterialIcons name="check" size={20} color="#FB923C" />}
                  </TouchableOpacity>
                );
              })}

              {filteredEmployees.length === 0 && (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>No employees found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  selectorCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FB923C',
    marginBottom: 8,
  },
  selectorDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  selectorDropdownText: {
    fontSize: 15,
    color: '#111827',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  employeesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  employeeCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cardHeaderRight: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  positionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  positionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardMenu: {
    padding: 4,
  },
  cardMetrics: {
    gap: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  needsImprovement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  needsImprovementText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  // Detail View Styles
  detailBanner: {
    backgroundColor: '#FB923C',
    padding: 16,
    paddingTop: 48,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailAvatarContainer: {
    position: 'relative',
  },
  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  detailAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  detailName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#FB923C',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FB923C',
  },
  // Overview Tab Styles
  overviewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  metricCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  metricCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  metricCardValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FB923C',
    marginBottom: 4,
  },
  metricCardSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Screenshots Tab Styles
  screenshotsContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  screenshotFilters: {
    padding: 16,
    gap: 12,
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dateFilterText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  appFilters: {
    flexDirection: 'row',
  },
  appChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  appChipActive: {
    backgroundColor: '#FB923C',
  },
  appChipText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  appChipTextActive: {
    color: '#fff',
  },
  screenshotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  screenshotCard: {
    width: (width - 44) / 2,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  screenshotImage: {
    width: '100%',
    height: '100%',
  },
  screenshotPlaceholder: {
    backgroundColor: '#1F2937',
  },
  screenshotOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
  },
  screenshotAppName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  screenshotTimestamp: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
  },
  loadMoreButton: {
    margin: 16,
    paddingVertical: 12,
    backgroundColor: '#FB923C',
    borderRadius: 8,
    alignItems: 'center',
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Modal Styles
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,24,39,0.45)',
  },
  modalContent: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  modalButtonPrimary: {
    backgroundColor: '#FB923C',
    borderColor: '#FB923C',
  },
  modalButtonPrimaryText: {
    color: '#fff',
  },
  // Lightbox Styles
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContent: {
    width: width - 32,
    height: '80%',
    position: 'relative',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 16,
  },
  lightboxAppName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lightboxTimestamp: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  lightboxClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Employee Dropdown Styles
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    width: width - 32,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  dropdownSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemSelected: {
    backgroundColor: '#FFF7ED',
  },
  dropdownItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dropdownItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  dropdownItemAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  dropdownItemAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownItemAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownItemInfo: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  dropdownItemTextSelected: {
    color: '#FB923C',
  },
  dropdownItemSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  dropdownEmpty: {
    padding: 32,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Chart Styles
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginTop: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FB923C',
    marginBottom: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  appUsageContainer: {
    gap: 16,
  },
  appUsageBarChart: {
    marginBottom: 8,
  },
  appUsagePieChart: {
    marginTop: 8,
    marginBottom: 8,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FB923C',
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#FB923C',
    borderColor: '#FB923C',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  quickDateButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  quickDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickDateButtonActive: {
    backgroundColor: '#FB923C',
    borderColor: '#FB923C',
  },
  quickDateButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  quickDateButtonTextActive: {
    color: '#fff',
  },
  stackedChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    paddingHorizontal: 8,
    gap: 4,
  },
  stackedBarContainer: {
    alignItems: 'center',
    width: 30,
  },
  stackedBarWrapper: {
    width: 24,
    height: 150,
    justifyContent: 'flex-end',
    flexDirection: 'column',
  },
  stackedBarSegment: {
    width: '100%',
    minHeight: 2,
  },
  stackedBarLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default OrgAdminActivitiesScreen;
