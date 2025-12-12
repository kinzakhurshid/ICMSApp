import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { IdleTimePreset } from '../types/idleTime';

type Props = {
  data: IdleTimePreset[];
};

const IdleTimePresetsCard: React.FC<Props> = ({ data }) => {
  const navigation = useNavigation();
  
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Idle Time Presets</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => (navigation as any).navigate('AddIdleTimePreset')}
        >
          <Text style={styles.addText}>+ Add Preset</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: 700 }}>
          <View style={styles.tableHead}>
            <Text style={[styles.headCell, { width: 220 }]}>NAME</Text>
            <Text style={[styles.headCell, { width: 140 }]}>START</Text>
            <Text style={[styles.headCell, { width: 140 }]}>END</Text>
            <Text style={[styles.headCell, { width: 160 }]}>DAYS</Text>
            <Text style={[styles.headCell, { width: 100 }]}>ACTIVE</Text>
            <Text style={[styles.headCell, { width: 120 }]}>AUTO APPLY</Text>
          </View>
          {data.map(item => (
            <View key={item._id} style={styles.tableRow}>
              <Text style={[styles.cell, { width: 220 }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.cell, { width: 140 }]}>{item.start || '-'}</Text>
              <Text style={[styles.cell, { width: 140 }]}>{item.end || '-'}</Text>
              <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>
                {formatDays(item.days)}
              </Text>
              <Text style={[styles.cell, { width: 100 }]}>{item.active ? 'Yes' : 'No'}</Text>
              <Text style={[styles.cell, { width: 120 }]}>{item.autoApply ? 'Yes' : 'No'}</Text>
            </View>
          ))}
          {data.length === 0 && (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No presets found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const formatDays = (days?: Array<string | number>): string => {
  if (!days || days.length === 0) return '-';
  return days.join(', ');
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  addButton: {
    backgroundColor: '#FB923C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 12,
  },
  headCell: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  cell: {
    fontSize: 13,
    color: '#374151',
  },
  emptyRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default IdleTimePresetsCard;


