import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface HiringCardProps {
  hiring: {
    id: string;
    position: string;
    jobType: string;
    location: string;
    endDate: string;
    applicantsCount: number;
    newToday: number;
  };
  handleOpenDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const HiringCard: React.FC<HiringCardProps> = ({
  hiring,
  handleOpenDetails,
  onEdit,
  onDelete,
}) => {
  const getDaysLeft = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return '0 days left';
    return `${diffDays} days left`;
  };

  const getStatusColor = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return '#F44336'; // Red for expired
    if (diffDays <= 5) return '#FF9800'; // Orange for urgent
    return '#4CAF50'; // Green for good
  };

  const getIconColor = (position: string) => {
    const colors = ['#2196F3', '#9C27B0', '#FF5722', '#4CAF50', '#FF9800'];
    const index = position.length % colors.length;
    return colors[index];
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleOpenDetails(hiring.id)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: getIconColor(hiring.position) }]}>
          <Icon name="business" size={20} color="white" />
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.daysLeft, { color: getStatusColor(hiring.endDate) }]}>
            {getDaysLeft(hiring.endDate)}
          </Text>
          <TouchableOpacity style={styles.moreButton}>
            <Icon name="more-vert" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.positionTitle}>{hiring.position}</Text>
        
        <View style={styles.locationRow}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.locationText}>{hiring.location}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hiring.applicantsCount}</Text>
            <Text style={styles.statLabel}>Applicants</Text>
          </View>
          
          <View style={styles.newTodayBadge}>
            <Text style={styles.newTodayText}>+{hiring.newToday} today</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(hiring.id)}
        >
          <Icon name="edit" size={16} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(hiring.id)}
        >
          <Icon name="delete" size={16} color="#F44336" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 180,
    width: width * 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  daysLeft: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
  },
  cardContent: {
    flex: 1,
  },
  positionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  newTodayBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newTodayText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
});

export default HiringCard;





