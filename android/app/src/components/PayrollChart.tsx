import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface PayrollChartProps {
  title: string;
  bonuses: number;
  incentives: number;
  formatCurrency: (amount: number) => string;
}

const PayrollChart: React.FC<PayrollChartProps> = ({
  title,
  bonuses,
  incentives,
  formatCurrency,
}) => {
  const total = bonuses + incentives;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.chartContainer}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>Totals</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
        
        <View style={styles.breakdown}>
          <View style={styles.breakdownItem}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%', backgroundColor: '#FF6B35' }]} />
            </View>
            <Text style={styles.breakdownText}>{formatCurrency(bonuses)} Bonuses</Text>
          </View>
          
          <View style={styles.breakdownItem}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%', backgroundColor: '#FF6B35' }]} />
            </View>
            <Text style={styles.breakdownText}>{formatCurrency(incentives)} Incentives</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 300,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  chartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 240,
    paddingVertical: 16,
  },
  totalSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  breakdown: {
    width: '100%',
    gap: 16,
  },
  breakdownItem: {
    alignItems: 'center',
  },
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  breakdownText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});

export default PayrollChart;





