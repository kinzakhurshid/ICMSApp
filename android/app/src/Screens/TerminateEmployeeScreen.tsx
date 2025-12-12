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
import DropdownField from '../components/task/DropdownField';
import DatePickerField from '../components/task/DatePickerField';
import FormField from '../components/task/FormField';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

export default function TerminateEmployeeScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState<Date | null>(null);
  const [lastWorkingDay, setLastWorkingDay] = useState<Date | null>(null);
  const [reasonNote, setReasonNote] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    // Set minimum date for last working day when effective from changes
    if (effectiveFrom && lastWorkingDay && lastWorkingDay < effectiveFrom) {
      setLastWorkingDay(effectiveFrom);
    }
  }, [effectiveFrom]);

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!employeeId) newErrors.employeeId = 'Employee is required';
    if (!effectiveFrom) {
      newErrors.effectiveFrom = 'Effective date is required';
    } else {
      const effectiveDate = new Date(effectiveFrom);
      effectiveDate.setHours(0, 0, 0, 0);
      if (effectiveDate < today) {
        newErrors.effectiveFrom = 'Effective date must be today or a future date';
      }
    }
    if (!lastWorkingDay) {
      newErrors.lastWorkingDay = 'Last working day is required';
    } else if (effectiveFrom) {
      const lastDay = new Date(lastWorkingDay);
      const effectiveDate = new Date(effectiveFrom);
      lastDay.setHours(0, 0, 0, 0);
      effectiveDate.setHours(0, 0, 0, 0);
      if (lastDay < effectiveDate) {
        newErrors.lastWorkingDay = 'Last working day must be on or after effective date';
      }
    }
    if (!reasonNote.trim()) {
      newErrors.reasonNote = 'Reason note is required';
    } else if (reasonNote.trim().length < 30) {
      newErrors.reasonNote = 'Reason note must be at least 30 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    Alert.alert(
      'Confirm Termination',
      'Are you sure you want to terminate this employee? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Terminate',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);

              const payload = {
                employeeId,
                effectiveFrom: effectiveFrom!.toISOString().split('T')[0],
                lastWorkingDay: lastWorkingDay!.toISOString().split('T')[0],
                reasonNote: reasonNote.trim(),
              };

              await callApi({
                method: 'POST',
                url: '/resignations/terminate',
                data: payload,
              });

              Alert.alert('Success', 'Employee terminated successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error: any) {
              console.error('Error terminating employee:', error);
              Alert.alert('Error', error?.response?.data?.message || 'Failed to terminate employee');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const employeeOptions = employees.map((emp) => ({
    label: emp.fullName || `${emp.firstName} ${emp.lastName}`,
    value: emp._id,
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
          <Text style={styles.headerTitle}>Terminate Employee</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Employee */}
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

          {/* Effective From and Last Working Day */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <DatePickerField
                label="Effective From"
                required
                value={effectiveFrom}
                onChange={(selectedDate) => {
                  setEffectiveFrom(selectedDate);
                  if (errors.effectiveFrom) setErrors({ ...errors, effectiveFrom: '' });
                }}
                minimumDate={today}
                error={errors.effectiveFrom}
              />
            </View>
            <View style={styles.column}>
              <DatePickerField
                label="Last Working Day"
                required
                value={lastWorkingDay}
                onChange={(selectedDate) => {
                  setLastWorkingDay(selectedDate);
                  if (errors.lastWorkingDay) setErrors({ ...errors, lastWorkingDay: '' });
                }}
                minimumDate={effectiveFrom || today}
                error={errors.lastWorkingDay}
              />
            </View>
          </View>

          {/* Reason Note */}
          <FormField
            label="Reason Note"
            required
            value={reasonNote}
            onChangeText={(text) => {
              setReasonNote(text);
              if (errors.reasonNote) setErrors({ ...errors, reasonNote: '' });
            }}
            placeholder="Provide a detailed reason for termination (minimum 30 characters)"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            error={errors.reasonNote}
          />
          {reasonNote.length > 0 && reasonNote.length < 30 && (
            <Text style={styles.charCount}>
              {reasonNote.length}/30 characters (minimum required)
            </Text>
          )}
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
            <Text style={styles.submitButtonText}>Terminate</Text>
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
  charCount: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: -12,
    marginBottom: 16,
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
    backgroundColor: '#dc2626',
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

