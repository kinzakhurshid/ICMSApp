import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface StatCardProps {
  title: string;
  value: number;
  icon: any; // Lucide icon component
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  const getIconName = (iconComponent: any) => {
    // Map lucide icons to Ionicons
    const iconName = iconComponent?.name || '';
    switch (iconName) {
      case 'CheckCircle':
        return 'checkmark-circle';
      case 'Clock':
        return 'time';
      case 'Users':
        return 'people';
      case 'Calendar':
        return 'calendar';
      case 'Target':
        return 'flag';
      default:
        return 'analytics';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIconName(icon)} size={24} color="#f97316" />
      </View>
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});
