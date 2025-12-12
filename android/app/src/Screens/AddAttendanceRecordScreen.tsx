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

const statusOptions = [
  { label: 'Present', value: 'Present' },
  { label: 'Absent', value: 'Absent' },
  { label: 'Late', value: 'Late' },
  { label: 'Half Day', value: 'Half Day' },
];

const arrivalStatusOptions = [
  { label: 'On Time', value: 'On Time' },
  { label: 'Late', value: 'Late' },
];

export default function AddAttendanceRecordScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [status, setStatus] = useState('Present');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [arrivalStatus, setArrivalStatus] = useState('');
  const [notes, setNotes] = useState('');

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
    if (!status) newErrors.status = 'Status is required';
    if (!checkInTime) newErrors.checkInTime = 'Check in time is required';
    if (checkOutTime && checkOutTime <= checkInTime) {
      newErrors.checkOutTime = 'Check out time must be after check in time';
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
        status,
        checkInTime,
        checkOutTime: checkOutTime || undefined,
        arrivalStatus: arrivalStatus || undefined,
        notes: notes.trim() || undefined,
      };

      await callApi({
        method: 'POST',
        url: '/attendance',
        data: payload,
      });

      Alert.alert('Success', 'Attendance record added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error adding attendance record:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to add attendance record');
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
          <Text style={styles.headerTitle}>Add Attendance Record</Text>
          <Text style={styles.headerSubtitle}>Fill in the details below to record attendance.</Text>
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

          {/* Status and Check In Time */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <DropdownField
                label="Status"
                required
                value={status}
                options={statusOptions}
                onSelect={(value) => {
                  setStatus(value);
                  if (errors.status) setErrors({ ...errors, status: '' });
                }}
                placeholder="Select status"
                error={errors.status}
              />
            </View>
            <View style={styles.column}>
              <TimePickerField
                label="Check In Time"
                required
                value={checkInTime}
                onChange={(time) => {
                  setCheckInTime(time);
                  if (errors.checkInTime) setErrors({ ...errors, checkInTime: '' });
                }}
                error={errors.checkInTime}
              />
            </View>
          </View>

          {/* Check Out Time and Arrival Status */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <TimePickerField
                label="Check Out Time"
                value={checkOutTime}
                onChange={(time) => {
                  setCheckOutTime(time);
                  if (errors.checkOutTime) setErrors({ ...errors, checkOutTime: '' });
                }}
                error={errors.checkOutTime}
              />
            </View>
            <View style={styles.column}>
              <DropdownField
                label="Arrival Status (Manual)"
                value={arrivalStatus}
                options={arrivalStatusOptions}
                onSelect={setArrivalStatus}
                placeholder="Select an option"
              />
            </View>
          </View>

          {/* Notes */}
          <FormField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
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
            <Text style={styles.submitButtonText}>Save Attendance</Text>
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

