import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const HolidayChart: React.FC = () => {
  const navigation = useNavigation();
  // Mock data - replace with actual data from API
  const upcomingHolidays = []; // Empty for now

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Holidays</Text>
        <View style={styles.dropdown}>
          <Text style={styles.dropdownText}>Upcoming</Text>
        </View>
      </View>

      <View style={styles.content}>
        {upcomingHolidays.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming holidays found</Text>
          </View>
        ) : (
          <View style={styles.holidayList}>
            {/* Render holiday list here */}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => (navigation as any).navigate('AddHoliday')}
      >
        <Text style={styles.addButtonText}>+ Add New Holiday</Text>
      </TouchableOpacity>
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
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  dropdown: {
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dropdownText: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  holidayList: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HolidayChart;
