import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

const LeaveCalendar: React.FC = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  // Mock data - replace with actual data from API
  const teamMembers = ['Maira Bilal', 'Kinza Khurshid', 'Mamoona Sh...'];
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      dates.push(day.getDate());
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeek);

  const formatWeekRange = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `Week of ${startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getWeekData = (weekStart: Date) => {
    // Different data based on week - replace with actual API call
    const weekKey = weekStart.toISOString().split('T')[0];
    // Mock different data for different weeks
    return {
      'Maira Bilal': ['Weeke...', 'Weeke...', 'Weeke...', 'Weeke...', 'Weeke...', 'Weeke...', 'Weeke...'],
      'Kinza Khurshid': ['Weeke...', 'Weeke...', 'Weeke...', 'Weeke...', 'Weeke...', 'Weeke...', 'Weeke...'],
      'Mamoona Sh...': ['Weeke...', 'Weeke...', 'Weeke...', 'Weeke...', 'Weeke...', 'Weeke...', 'Weeke...'],
    };
  };

  const weekData = getWeekData(currentWeek);

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
          {teamMembers.map((member, memberIndex) => (
            <View key={memberIndex} style={styles.memberRow}>
              <View style={styles.nameColumn}>
                <Text style={styles.memberName}>{member}</Text>
              </View>
              {weekDays.map((day, dayIndex) => (
                <View key={dayIndex} style={styles.dayCell}>
                  <Text style={styles.dayStatus}>{weekData[member]?.[dayIndex] || 'Weeke...'}</Text>
                </View>
              ))}
            </View>
          ))}
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
});

export default LeaveCalendar;
