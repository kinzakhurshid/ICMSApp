import React, { useState, useEffect } from 'react';
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
import DropdownField from '../components/task/DropdownField';
import DatePickerField from '../components/task/DatePickerField';
import TimePickerField from '../components/attendance/TimePickerField';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

export default function AddIdleTimeScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await callApi({
        method: 'GET',
        url: '/employee',
      });
      const employeesList = Array.isArray(response) ? response : response.data || [];
      setEmployees(employeesList.map((emp: Employee) => ({
        ...emp,
        fullName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
      })));
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!employeeId) newErrors.employeeId = 'Employee is required';
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

      await callApi({
        method: 'POST',
        url: '/idle-time',
        data: payload,
      });

      Alert.alert('Success', 'Idle time added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error adding idle time:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to add idle time');
    } finally {
      setSubmitting(false);
    }
  };

  const employeeOptions = employees.map((emp) => ({
    label: emp.fullName || `${emp.firstName} ${emp.lastName}`,
    value: emp._id,
  }));

  if (loadingEmployees) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading employees...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Add Idle Time</Text>
          <Text style={styles.headerSubtitle}>
            Record any additional time taken by an employee beyond breaks
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Employee and Date */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <DropdownField
                label="Employee"
                required
                value={employeeId}
                options={employeeOptions}
                onSelect={(value) => {
                  setEmployeeId(value);
                  if (errors.employeeId) setErrors({ ...errors, employeeId: '' });
                }}
                placeholder="Select an option"
                error={errors.employeeId}
              />
            </View>
            <View style={styles.column}>
              <DatePickerField
                label="Date"
                required
                value={date}
                onChange={(selectedDate) => {
                  setDate(selectedDate);
                  if (errors.date) setErrors({ ...errors, date: '' });
                }}
                maximumDate={new Date()}
                error={errors.date}
              />
            </View>
          </View>

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

          {/* Reason */}
          <FormField
            label="Reason"
            required
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (errors.reason) setErrors({ ...errors, reason: '' });
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
            <Text style={styles.submitButtonText}>Add Idle Time</Text>
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
    fontSize: 14,
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

