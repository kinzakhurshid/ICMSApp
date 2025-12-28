import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';
import FormField from '../components/task/FormField';
import TimePickerField from '../components/attendance/TimePickerField';
import DaySelector from '../components/attendance/DaySelector';
import { getIdleTimePresetById, updateIdleTimePreset } from '../Services/idleTime';

type RouteParams = {
  presetId: string;
};

const EditIdleTimePresetScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const token = useSelector((state: RootState) => state.user.token) || '';
  const { callApi } = useAxios();

  const { presetId } = (route.params as RouteParams) || {};

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [autoApply, setAutoApply] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadPreset = async () => {
      try {
        if (!token || !presetId) {
          setLoading(false);
          return;
        }
        const preset = await getIdleTimePresetById(presetId, token);
        if (!preset) {
          Alert.alert('Error', 'Idle time preset not found');
          navigation.goBack();
          return;
        }

        setName(preset.name);
        setStartTime(preset.start || '');
        setEndTime(preset.end || '');
        setDaysOfWeek((preset.days as any[])?.map(Number) || []);
        setIsActive(preset.active);
        setAutoApply(preset.autoApply);
      } catch (error) {
        console.error('Error fetching idle time preset:', error);
        Alert.alert('Error', 'Failed to load idle time preset');
      } finally {
        setLoading(false);
      }
    };

    loadPreset();
  }, [presetId, token, navigation]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';
    if (startTime && endTime && endTime <= startTime) {
      newErrors.endTime = 'End time must be greater than start time';
    }
    if (!daysOfWeek.length) {
      newErrors.daysOfWeek = 'At least one day must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!presetId) {
      Alert.alert('Error', 'Missing preset id');
      return;
    }
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name: name.trim(),
        startTime,
        endTime,
        daysOfWeek,
        isActive,
        autoApply,
      };

      const success = await updateIdleTimePreset(presetId, payload, token);
      if (!success) {
        throw new Error('Update failed');
      }

      // Re-trigger cron job as in create flow
      try {
        await callApi({
          method: 'POST',
          url: '/cron',
        });
      } catch (cronError) {
        console.log('Cron job trigger failed (optional):', cronError);
      }

      Alert.alert('Success', 'Idle time preset updated successfully', [
        {
          text: 'OK',
          onPress: () => (navigation as any).navigate('HRIdleTime'),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating preset:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update preset');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading preset...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('HRIdleTime')}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Idle Time Preset</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <FormField
            label="Name"
            required
            value={name}
            onChangeText={text => {
              setName(text);
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }}
            placeholder="Enter preset name"
            error={errors.name}
          />

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <TimePickerField
                label="Start Time"
                required
                value={startTime}
                onChange={time => {
                  setStartTime(time);
                  if (errors.startTime) setErrors(prev => ({ ...prev, startTime: '' }));
                }}
                error={errors.startTime}
              />
            </View>
            <View style={styles.column}>
              <TimePickerField
                label="End Time"
                required
                value={endTime}
                onChange={time => {
                  setEndTime(time);
                  if (errors.endTime) setErrors(prev => ({ ...prev, endTime: '' }));
                }}
                error={errors.endTime}
              />
            </View>
          </View>

          <DaySelector selectedDays={daysOfWeek} onChange={setDaysOfWeek} />
          {errors.daysOfWeek && <Text style={styles.errorText}>{errors.daysOfWeek}</Text>}

          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setIsActive(!isActive)}
            >
              <View style={[styles.checkbox, isActive && styles.checkboxChecked]}>
                {isActive && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Active</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setAutoApply(!autoApply)}
            >
              <View style={[styles.checkbox, autoApply && styles.checkboxChecked]}>
                {autoApply && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>Auto Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => (navigation as any).navigate('HRIdleTime')}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  checkboxContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f97316',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default EditIdleTimePresetScreen;




