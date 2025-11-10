import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
} from 'react-native';

const { width } = Dimensions.get('window');

interface MyTeamsCardProps {
  onTimeRangeChange?: (timeRange: string) => void;
}

const MyTeamsCard: React.FC<MyTeamsCardProps> = ({ onTimeRangeChange }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('This Week');
  const [showDropdown, setShowDropdown] = useState(false);

  const timeRangeOptions = ['This Week', 'Last Week', 'This Month', 'Last Month'];

  // Mock data - replace with actual data from API
  const getTeamData = (timeRange: string) => {
    // Different data based on time range
    switch (timeRange) {
      case 'This Week':
        return { total: 100, inOffice: 58, halfDay: 0, onLeave: 6, absent: 36 };
      case 'Last Week':
        return { total: 100, inOffice: 62, halfDay: 2, onLeave: 4, absent: 32 };
      case 'This Month':
        return { total: 100, inOffice: 55, halfDay: 3, onLeave: 8, absent: 34 };
      case 'Last Month':
        return { total: 100, inOffice: 60, halfDay: 1, onLeave: 5, absent: 34 };
      default:
        return { total: 100, inOffice: 58, halfDay: 0, onLeave: 6, absent: 36 };
    }
  };

  const teamData = getTeamData(selectedTimeRange);
  const inOfficePercentage = Math.round((teamData.inOffice / teamData.total) * 100);

  const handleTimeRangeSelect = (timeRange: string) => {
    setSelectedTimeRange(timeRange);
    setShowDropdown(false);
    onTimeRangeChange?.(timeRange);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Teams</Text>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => setShowDropdown(true)}
        >
          <Text style={styles.dropdownText}>{selectedTimeRange}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.chartContainer}>
          <View style={styles.donutChart}>
            <View style={styles.centerText}>
              <Text style={styles.percentage}>{inOfficePercentage}%</Text>
            </View>
          </View>
          
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#007BFF' }]} />
              <Text style={styles.legendText}>In Office: {teamData.inOffice}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF6B35' }]} />
              <Text style={styles.legendText}>Half Day: {teamData.halfDay}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6F42C1' }]} />
              <Text style={styles.legendText}>On Leave: {teamData.onLeave}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#DC3545' }]} />
              <Text style={styles.legendText}>Absent: {teamData.absent}%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownMenu}>
            {timeRangeOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dropdownItem,
                  selectedTimeRange === option && styles.dropdownItemSelected
                ]}
                onPress={() => handleTimeRangeSelect(option)}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedTimeRange === option && styles.dropdownItemTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dropdownText: {
    fontSize: 12,
    color: '#666',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#666',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  donutChart: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#007BFF',
  },
  centerText: {
    alignItems: 'center',
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  legend: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemSelected: {
    backgroundColor: '#F5F5F5',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownItemTextSelected: {
    color: '#FF6B35',
    fontWeight: '500',
  },
});

export default MyTeamsCard;
