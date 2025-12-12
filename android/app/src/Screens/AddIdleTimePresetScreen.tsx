import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
import FormField from '../components/task/FormField';
import TimePickerField from '../components/attendance/TimePickerField';
import DaySelector from '../components/attendance/DaySelector';

export default function AddIdleTimePresetScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]); // Default: Monday to Friday
  const [isActive, setIsActive] = useState(true);
  const [autoApply, setAutoApply] = useState(true);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';
    if (startTime && endTime && endTime <= startTime) {
      newErrors.endTime = 'End time must be greater than start time';
    }
    if (daysOfWeek.length === 0) {
      newErrors.daysOfWeek = 'At least one day must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
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

      await callApi({
        method: 'POST',
        url: '/idle-preset',
        data: payload,
      });

      // Optional: Trigger cron job
      try {
        await callApi({
          method: 'POST',
          url: '/cron',
        });
      } catch (cronError) {
        console.log('Cron job trigger failed (optional):', cronError);
      }

      Alert.alert('Success', 'Idle time preset created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating preset:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create preset');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Idle Time Preset</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Name */}
          <FormField
            label="Name"
            required
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            placeholder="Enter preset name"
            error={errors.name}
          />

          {/* Start Time and End Time */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <TimePickerField
                label="Start Time"
                required
                value={startTime}
                onChange={(time) => {
                  setStartTime(time);
                  if (errors.startTime) setErrors({ ...errors, startTime: '' });
                }}
                error={errors.startTime}
              />
            </View>
            <View style={styles.column}>
              <TimePickerField
                label="End Time"
                required
                value={endTime}
                onChange={(time) => {
                  setEndTime(time);
                  if (errors.endTime) setErrors({ ...errors, endTime: '' });
                }}
                error={errors.endTime}
              />
            </View>
          </View>

          {/* Select Days */}
          <DaySelector selectedDays={daysOfWeek} onChange={setDaysOfWeek} />
          {errors.daysOfWeek && (
            <Text style={styles.errorText}>{errors.daysOfWeek}</Text>
          )}

          {/* Checkboxes */}
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
          onPress={() => navigation.goBack()}
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
            <Text style={styles.submitButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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

