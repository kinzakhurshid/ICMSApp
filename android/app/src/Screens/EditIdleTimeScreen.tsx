import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import DatePickerField from '../components/task/DatePickerField';
import TimePickerField from '../components/attendance/TimePickerField';
import FormField from '../components/task/FormField';
import { getIdleTimeRecordById, updateIdleTimeRecord } from '../Services/idleTime';

type RouteParams = {
  recordId: string;
};

const EditIdleTimeScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const token = useSelector((state: RootState) => state.user.token) || '';

  const { recordId } = (route.params as RouteParams) || {};

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadRecord = async () => {
      try {
        if (!token || !recordId) {
          setLoading(false);
          return;
        }
        const record = await getIdleTimeRecordById(recordId, token);
        if (!record) {
          Alert.alert('Error', 'Idle time record not found');
          navigation.goBack();
          return;
        }

        const emp = record.employeeId as any;
        const fullName =
          emp?.fullName ||
          [emp?.firstName, emp?.lastName].filter(Boolean).join(' ') ||
          'Unknown Employee';

        setEmployeeName(fullName);
        setEmployeeId(emp?._id || record.employeeId || '');
        setDate(record.date ? new Date(record.date) : null);
        setStartTime(record.startTime || '');
        setEndTime(record.endTime || '');
        setReason(record.reason || '');
      } catch (error) {
        console.error('Error fetching idle time record:', error);
        Alert.alert('Error', 'Failed to load idle time record');
      } finally {
        setLoading(false);
      }
    };

    loadRecord();
  }, [recordId, token, navigation]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!date) newErrors.date = 'Date is required';
    if (date && date > new Date()) {
      newErrors.date = 'Date cannot be in the future';
    }
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';
    if (startTime && endTime && endTime <= startTime) {
      newErrors.endTime = 'End time must be greater than start time';
    }
    if (!reason.trim() || reason.trim().length < 3) {
      newErrors.reason = 'Reason must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!recordId || !employeeId) {
      Alert.alert('Error', 'Missing required data to update record');
      return;
    }
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        employeeId,
        date: date!.toISOString().split('T')[0],
        startTime,
        endTime,
        reason: reason.trim(),
      };

      const success = await updateIdleTimeRecord(recordId, payload, token);
      if (!success) {
        throw new Error('Update failed');
      }

      Alert.alert('Success', 'Idle time updated successfully', [
        {
          text: 'OK',
          onPress: () => (navigation as any).navigate('HRIdleTime'),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating idle time:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update idle time');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading idle time...</Text>
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
          <Text style={styles.headerTitle}>Update Idle Time</Text>
          <Text style={styles.headerSubtitle}>
            Update details of recorded idle time (employee cannot be changed)
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Employee (read-only) */}
          <FormField
            label="Employee"
            value={employeeName}
            onChangeText={() => {}}
            editable={false}
          />

          {/* Date */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <DatePickerField
                label="Date"
                required
                value={date}
                onChange={selectedDate => {
                  setDate(selectedDate);
                  if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                }}
                maximumDate={new Date()}
                error={errors.date}
              />
            </View>
          </View>

          {/* Start / End Time */}
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

          {/* Reason */}
          <FormField
            label="Reason"
            required
            value={reason}
            onChangeText={text => {
              setReason(text);
              if (errors.reason) setErrors(prev => ({ ...prev, reason: '' }));
            }}
            placeholder="Describe the reason for idle time..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            error={errors.reason}
          />
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
            <Text style={styles.submitButtonText}>Update Idle Time</Text>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6b7280',
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

export default EditIdleTimeScreen;




