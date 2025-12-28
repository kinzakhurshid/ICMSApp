import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface SummaryCardProps {
  title: string;
  value: number;
  percent?: string;
  color: string;
  bgColor: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  percent,
  color,
  bgColor,
}) => {
  const getProgressPercentage = () => {
    if (!percent) return 0;
    const match = percent.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  };

  const progressPercentage = getProgressPercentage();
  
  // Ensure progress bar visually matches the percentage
  const visualProgress = Math.min(Math.max(progressPercentage, 0), 100);

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={styles.cardContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={[styles.value, { color }]}>{value}</Text>
        
        {percent && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${visualProgress}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{percent}</Text>
          </View>
        )}
        
        <View style={styles.changeContainer}>
          <Text style={[styles.changeLabel, { backgroundColor: bgColor }]}>This Month</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 160,
    flex: 1,
    marginHorizontal: 4,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    marginBottom: 8,
    width: '100%',
    alignSelf: 'flex-start',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});

export default SummaryCard;
