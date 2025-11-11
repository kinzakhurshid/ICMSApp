import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface PayrollSummaryCardProps {
  title: string;
  value: string | number;
  change: number;
  isCurrency: boolean;
}

const PayrollSummaryCard: React.FC<PayrollSummaryCardProps> = ({
  title,
  value,
  change,
  isCurrency,
}) => {
  const formatCurrency = (amount: number) => {
    return `Rs ${(amount / 1000).toFixed(2)}K`;
  };

  const changeColor = change > 0
    ? '#4CAF50'
    : change < 0
      ? '#F44336'
      : '#FF9800';

  const changeBgColor = change > 0
    ? '#E8F5E8'
    : change < 0
      ? '#FFEBEE'
      : '#FFF8E1';

  const arrowIcon = change > 0
    ? '↑'
    : change < 0
      ? '↓'
      : '';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.valueSection}>
        <Text style={styles.value}>
          {isCurrency ? formatCurrency(Number(value)) : value}
        </Text>
        
        <View style={styles.changeSection}>
          <View style={[styles.changeBadge, { backgroundColor: changeBgColor }]}>
            {change !== 0 ? (
              <>
                <Text style={[styles.changeText, { color: changeColor }]}>
                  {arrowIcon} {Math.abs(change)}%
                </Text>
              </>
            ) : (
              <Text style={[styles.changeText, { color: changeColor }]}>
                This month
              </Text>
            )}
          </View>
          {change !== 0 && (
            <Text style={styles.changeLabel}>last month</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 120,
    width: (width - 60) / 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  valueSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  changeSection: {
    alignItems: 'flex-end',
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 12,
    color: '#999',
  },
});

export default PayrollSummaryCard;
