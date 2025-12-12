import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from 'date-fns';

interface LeaveData {
  employeeId: string;
  employeeName: string;
  leaves: Record<string, { type: string; status: string }>;
}

const LeaveCalendar: React.FC = () => {
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<LeaveData[]>([]);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getWeekDates = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      dates.push(day.getDate());
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);

  const formatWeekRange = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    return `Week of ${format(weekStart, 'MMMM d, yyyy')}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const fetchLeaves = async () => {
    if (!currentUser?.organization) return;
    
    setLoading(true);
    try {
      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });

      // Fetch all employees first
      const employeesResponse = await callApi({
        method: 'GET',
        url: '/employee',
        params: {
          organizationId: currentUser.organization,
          page: 1,
          limit: 1000,
        },
      });

      // Fetch leaves for the week
      const leavesResponse = await callApi({
        method: 'GET',
        url: '/leave',
        params: {
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
          organizationId: currentUser.organization,
          page: 1,
          limit: 1000,
        },
      });

      // Get all employees
      const employeesData = employeesResponse?.data || employeesResponse || [];
      const allEmployees = Array.isArray(employeesData) ? employeesData : [];

      // Process leaves to group by employee
      const leavesData = leavesResponse?.data || leavesResponse || [];
      const leavesMap = new Map<string, Record<string, { type: string; status: string }>>();

      leavesData.forEach((leave: any) => {
        const employeeId = leave.employeeId?._id || leave.employeeId || leave.employee?._id || '';
        
        if (!employeeId) return;

        if (!leavesMap.has(employeeId)) {
          leavesMap.set(employeeId, {});
        }

        const employeeLeaves = leavesMap.get(employeeId)!;
        
        // Add leave for each day in the date range
        const startDate = new Date(leave.startDate);
        const endDate = new Date(leave.endDate);
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        days.forEach(day => {
          const dateKey = format(day, 'yyyy-MM-dd');
          employeeLeaves[dateKey] = {
            type: leave.type || leave.leaveType || 'Leave',
            status: leave.status || 'Pending',
          };
        });
      });

      // Create LeaveData for all employees, including those without leaves
      const teamMembersData: LeaveData[] = allEmployees.map((employee: any) => {
        const employeeId = employee._id || employee.id || '';
        const employeeName = employee.fullName || 
                            (employee.firstName && employee.lastName 
                              ? `${employee.firstName} ${employee.lastName}` 
                              : employee.name || 'Unknown');

        return {
          employeeId,
          employeeName,
          leaves: leavesMap.get(employeeId) || {},
        };
      });

      setTeamMembers(teamMembersData);
    } catch (error) {
      console.error('Failed to fetch leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [currentWeek, currentUser?.organization]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity onPress={() => navigateWeek('prev')}>
            <Text style={styles.navButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.weekText}>{formatWeekRange(currentWeek)}</Text>
          <TouchableOpacity onPress={() => navigateWeek('next')}>
            <Text style={styles.navButton}>{'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.viewButtons}>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>Year</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarContainer}>
        <View style={styles.calendar}>
          {/* Header Row */}
          <View style={styles.calendarHeader}>
            <View style={styles.nameColumn}>
              <Text style={styles.headerText}>Team Members</Text>
            </View>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text style={styles.dayText}>{day}</Text>
                <Text style={styles.dateText}>{weekDates[index]}</Text>
              </View>
            ))}
          </View>

          {/* Team Member Rows */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#FF6B35" />
              <Text style={styles.loadingText}>Loading leaves...</Text>
            </View>
          ) : teamMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No leaves found for this week</Text>
            </View>
          ) : (
            teamMembers.map((member, memberIndex) => {
              const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
              const weekDates = Array.from({ length: 7 }, (_, i) => 
                format(addDays(weekStart, i), 'yyyy-MM-dd')
              );

              return (
                <View key={member.employeeId || memberIndex} style={styles.memberRow}>
                  <View style={styles.nameColumn}>
                    <Text style={styles.memberName} numberOfLines={1}>
                      {member.employeeName}
                    </Text>
                  </View>
                  {weekDates.map((dateKey, dayIndex) => {
                    const leave = member.leaves[dateKey];
                    const leaveType = leave?.type || '';
                    const leaveStatus = leave?.status || '';
                    
                    // Determine display text and color
                    let displayText = '';
                    let backgroundColor = 'transparent';
                    
                    if (leave) {
                      if (leaveType.toLowerCase().includes('sick')) {
                        displayText = 'Sick';
                        backgroundColor = '#FFB6C1';
                      } else if (leaveType.toLowerCase().includes('annual') || leaveType.toLowerCase().includes('vacation')) {
                        displayText = 'Annual';
                        backgroundColor = '#ADD8E6';
                      } else if (leaveType.toLowerCase().includes('holiday')) {
                        displayText = 'Holiday';
                        backgroundColor = '#DDA0DD';
                      } else {
                        displayText = leaveType.substring(0, 5);
                        backgroundColor = '#FFFFE0';
                      }
                    }

                    return (
                      <View 
                        key={dayIndex} 
                        style={[
                          styles.dayCell,
                          leave && { backgroundColor }
                        ]}
                      >
                        {leave && (
                          <Text style={styles.dayStatus} numberOfLines={1}>
                            {displayText}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: '#FFB6C1' }]} />
          <Text style={styles.legendText}>Sick Leave</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: '#ADD8E6' }]} />
          <Text style={styles.legendText}>Annual Leave</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: '#FFFFE0' }]} />
          <Text style={styles.legendText}>Other's Leave</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSquare, { backgroundColor: '#DDA0DD' }]} />
          <Text style={styles.legendText}>Public Holiday</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  weekText: {
    fontSize: 12,
    color: '#666',
  },
  viewButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  viewButton: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewButtonText: {
    fontSize: 12,
    color: '#666',
  },
  calendarContainer: {
    marginBottom: 12,
  },
  calendar: {
    minWidth: 400,
  },
  calendarHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
    marginBottom: 8,
  },
  nameColumn: {
    width: 100,
    paddingRight: 8,
  },
  dayColumn: {
    width: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  dayText: {
    fontSize: 10,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  memberRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberName: {
    fontSize: 12,
    color: '#333',
  },
  dayCell: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 20,
  },
  dayStatus: {
    fontSize: 10,
    color: '#666',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendSquare: {
    width: 12,
    height: 12,
    marginRight: 4,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#999',
  },
});

export default LeaveCalendar;
