import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AboutAppScreen: React.FC = () => {
  const openWebsite = () => {
    Linking.openURL('https://intelgency.com').catch(() => {});
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>About ICMS App</Text>
      <Text style={styles.subtitle}>Integrated Company Management System</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Application Details</Text>
        <Text style={styles.label}>Version</Text>
        <Text style={styles.value}>1.0.0</Text>

        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>
          ICMS helps HR and management teams handle attendance, leaves, payroll, resignations,
          tasks, meetings, and company accessories in a single, unified mobile experience.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact & Company</Text>
        <View style={styles.row}>
          <Icon name="business" size={20} color="#FF6B35" style={styles.icon} />
          <View style={styles.textGroup}>
            <Text style={styles.label}>Company</Text>
            <Text style={styles.value}>Intelgency</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Icon name="public" size={20} color="#FF6B35" style={styles.icon} />
          <View style={styles.textGroup}>
            <Text style={styles.label}>Website</Text>
            <Text style={styles.value}>intelgency.com</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Icon name="phone" size={20} color="#FF6B35" style={styles.icon} />
          <View style={styles.textGroup}>
            <Text style={styles.label}>Contact Number</Text>
            <Text style={styles.value}>Use the official contact number listed on intelgency.com</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={openWebsite}>
          <Text style={styles.primaryButtonText}>Visit intelgency.com</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2933',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4b5563',
    marginTop: 4,
  },
  value: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
    marginTop: 2,
  },
  textGroup: {
    flex: 1,
  },
  primaryButton: {
    marginTop: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AboutAppScreen;




