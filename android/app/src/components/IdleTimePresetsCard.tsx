import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import { IdleTimePreset } from '../types/idleTime';
import { deleteIdleTimePreset } from '../Services/idleTime';

type Props = {
  data: IdleTimePreset[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

const IdleTimePresetsCard: React.FC<Props> = ({ 
  data, 
  total = 0, 
  page = 1, 
  pageSize = 10,
  onPageChange 
}) => {
  const navigation = useNavigation();
  const token = useSelector((state: RootState) => state.user.token) || '';

  const handleDeletePreset = (presetId: string) => {
    Alert.alert(
      'Delete Preset',
      'Are you sure you want to delete this idle time preset?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteIdleTimePreset(presetId, token);
              if (!success) {
                throw new Error('Delete failed');
              }
              Alert.alert('Success', 'Preset deleted successfully');
              // Parent screen (HrIdleTimeScreen) will refresh presets on focus/useFocusEffect
            } catch (error) {
              console.error('Error deleting idle time preset:', error);
              Alert.alert('Error', 'Failed to delete preset');
            }
          },
        },
      ]
    );
  };

  const totalPages = useMemo(() => {
    // Use total if provided and > 0, otherwise use data.length
    const totalCount = total > 0 ? total : data.length;
    return Math.max(1, Math.ceil(totalCount / pageSize));
  }, [total, data.length, pageSize]);
  
  const canPrev = page > 1;
  const canNext = page < totalPages;
  
  // Always show pagination if onPageChange is provided
  const showPagination = onPageChange !== undefined;
  
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Idle Time Presets</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => (navigation as any).navigate('AddIdleTimePreset', { redirectTo: 'HRIdleTime' })}
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
            <Text style={[styles.headCell, { width: 80 }]}>ACTIVE</Text>
            <Text style={[styles.headCell, { width: 100 }]}>AUTO APPLY</Text>
            <Text style={[styles.headCell, { width: 80 }]}>ACTIONS</Text>
          </View>
          {data.map(item => (
            <View key={item._id} style={styles.tableRow}>
              <Text style={[styles.cell, { width: 220 }]} numberOfLines={1}>{item.name}</Text>
              <Text style={[styles.cell, { width: 140 }]}>{item.start || '-'}</Text>
              <Text style={[styles.cell, { width: 140 }]}>{item.end || '-'}</Text>
              <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>
                {formatDays(item.days)}
              </Text>
              <Text style={[styles.cell, { width: 80 }]}>{item.active ? 'Yes' : 'No'}</Text>
              <Text style={[styles.cell, { width: 100 }]}>{item.autoApply ? 'Yes' : 'No'}</Text>
              <View style={[styles.cell, styles.actionCell, { width: 80 }]}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => (navigation as any).navigate('EditIdleTimePreset', { presetId: item._id })}
                >
                  <Feather name="edit-2" size={16} color="#4B5563" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDeletePreset(item._id)}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {data.length === 0 && (
            <View style={styles.emptyRow}>
              <Text style={styles.emptyText}>No presets found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {(showPagination || data.length > 0) && (
        <View style={styles.tableFooter}>
          <Text style={styles.footerText}>
            Showing {(data.length && (page - 1) * pageSize + 1) || 0}-
            {(page - 1) * pageSize + data.length} of {total > 0 ? total : data.length} entries
          </Text>
          {showPagination && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, !canPrev && styles.pageBtnDisabled]}
                disabled={!canPrev}
                onPress={() => onPageChange && onPageChange(Math.max(1, page - 1))}
              >
                <Text style={[styles.pageBtnText, !canPrev && styles.pageBtnTextDisabled]}>Prev</Text>
              </TouchableOpacity>
              <Text style={styles.pageIndicator}>
                Page {page} of {totalPages}
              </Text>
              <TouchableOpacity
                style={[styles.pageBtn, !canNext && styles.pageBtnDisabled]}
                disabled={!canNext}
                onPress={() => onPageChange && onPageChange(Math.min(totalPages, page + 1))}
              >
                <Text style={[styles.pageBtnText, !canNext && styles.pageBtnTextDisabled]}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
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
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  iconButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  emptyRow: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  tableFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
  },
  footerText: { 
    color: '#6B7280', 
    fontSize: 12, 
    flexShrink: 1 
  },
  pagination: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    flexShrink: 0,
    flexWrap: 'nowrap',
  },
  pageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FB923C',
    minWidth: 60,
    alignItems: 'center',
  },
  pageBtnDisabled: {
    borderColor: '#E5E7EB',
  },
  pageBtnText: { 
    color: '#FB923C', 
    fontWeight: '600',
    fontSize: 13,
  },
  pageBtnTextDisabled: { 
    color: '#9CA3AF' 
  },
  pageIndicator: { 
    fontSize: 13, 
    color: '#111827' 
  },
});

export default IdleTimePresetsCard;


