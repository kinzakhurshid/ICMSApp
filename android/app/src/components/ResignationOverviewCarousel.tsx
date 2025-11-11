import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface ResignationOverview {
  _id: string;
  name: string;
  role: string;
  date: string;
  status: string;
  bg: string;
  statusColor: string;
  dateBg: string;
  separationType: string;
  effectiveFrom: string;
  lastWorkingDay: string;
}

interface ResignationOverviewCarouselProps {
  resignOverview: ResignationOverview[];
  formatDate: (dateString: string) => string;
}

const ResignationOverviewCarousel: React.FC<ResignationOverviewCarouselProps> = ({
  resignOverview,
  formatDate,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return '#4CAF50';
      case 'Requested':
        return '#2196F3';
      case 'Rejected':
        return '#F44336';
      default:
        return '#FF9800';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return '#E8F5E8';
      case 'Requested':
        return '#E3F2FD';
      case 'Rejected':
        return '#FFEBEE';
      default:
        return '#FFF8E1';
    }
  };

  if (resignOverview.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resign Overview</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No resignation requests</Text>
        </View>
      </View>
    );
  }

  const currentResignation = resignOverview[currentIndex];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Resign Overview</Text>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.employeeInfo}>
            <Text style={styles.employeeName}>{currentResignation.name}</Text>
            <Text style={styles.employeeRole}>{currentResignation.role}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(currentResignation.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(currentResignation.status) }]}>
              {currentResignation.status}
            </Text>
          </View>
        </View>

        <View style={styles.datesSection}>
          <Text style={styles.effectiveDate}>
            Effective: {formatDate(currentResignation.effectiveFrom)}
          </Text>
          <Text style={styles.lastDay}>
            Last Day: {formatDate(currentResignation.lastWorkingDay)}
          </Text>
        </View>

        <View style={styles.dateInputSection}>
          <View style={styles.dateInput}>
            <Text style={styles.dateText}>{formatDate(currentResignation.effectiveFrom)}</Text>
          </View>
          <View style={[styles.requestBadge, { backgroundColor: getStatusBgColor(currentResignation.status) }]}>
            <Text style={[styles.requestText, { color: getStatusColor(currentResignation.status) }]}>
              {currentResignation.status}
            </Text>
          </View>
        </View>
      </View>

      {resignOverview.length > 1 && (
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
          >
            <Icon name="chevron-left" size={20} color={currentIndex === 0 ? '#ccc' : '#FF6B35'} />
          </TouchableOpacity>
          
          <View style={styles.dots}>
            {resignOverview.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex && styles.activeDot
                ]}
              />
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.navButton, currentIndex === resignOverview.length - 1 && styles.navButtonDisabled]}
            onPress={() => setCurrentIndex(Math.min(resignOverview.length - 1, currentIndex + 1))}
            disabled={currentIndex === resignOverview.length - 1}
          >
            <Icon name="chevron-right" size={20} color={currentIndex === resignOverview.length - 1 ? '#ccc' : '#FF6B35'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 200,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  employeeRole: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  datesSection: {
    marginBottom: 16,
  },
  effectiveDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastDay: {
    fontSize: 14,
    color: '#666',
  },
  dateInputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInput: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  requestBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  requestText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  navButton: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  navButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#FF6B35',
  },
});

export default ResignationOverviewCarousel;





