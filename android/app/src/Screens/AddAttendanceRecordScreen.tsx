import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
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
  // Values are API values; labels are user‑friendly
  { label: 'Present', value: 'Present' },
  { label: 'Absent', value: 'Absent' },
  { label: 'Half Day', value: 'Half-day' },
  { label: 'On Leave', value: 'Leave' },
];

const arrivalStatusOptions = [
  { label: 'On Time', value: 'On Time' },
  { label: 'Late', value: 'Late' },
];

const halfDayTypeOptions = [
  { label: 'First Half (Before 1 PM)', value: 'first' },
  { label: 'Second Half (After 1 PM)', value: 'second' },
];

export default function AddAttendanceRecordScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const redirectTo = (route.params as any)?.redirectTo as string | undefined;
  const { callApi } = useAxios();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [status, setStatus] = useState('Present'); // API value
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [arrivalStatus, setArrivalStatus] = useState('');
  const [halfDayType, setHalfDayType] = useState(''); // 'first' or 'second' for Half-day
  const [notes, setNotes] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmployees();
  }, []);

  // Reset form when screen is focused (user navigates to this screen)
  useFocusEffect(
    useCallback(() => {
      // Reset form to default state when screen is focused
      setEmployeeId('');
      setDate(null);
      setStatus('Present');
      setCheckInTime('');
      setCheckOutTime('');
      setArrivalStatus('');
      setHalfDayType('');
      setNotes('');
      setErrors({});
    }, [])
  );

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

    // Validate that date is not in the past
    if (date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Past attendance cannot be added. Please select today\'s date or a future date.';
      }
    }

    // If status is Absent or Leave, don't require times or arrival status
    if (status === 'Absent' || status === 'Leave') {
      setCheckInTime('');
      setCheckOutTime('');
      setArrivalStatus('');
      setHalfDayType('');
    } else if (status === 'Half-day') {
      // For Half-day, require check-in time and half-day type
      if (!checkInTime) newErrors.checkInTime = 'Check in time is required';
      if (!halfDayType) newErrors.halfDayType = 'Half-day type is required (First or Second half)';
      if (checkOutTime && checkOutTime <= checkInTime) {
        newErrors.checkOutTime = 'Check out time must be after check in time';
      }
      // Arrival status is optional for half-day
    } else {
      // For Present status, require check-in time and arrival status
      if (!checkInTime) newErrors.checkInTime = 'Check in time is required';
      if (checkOutTime && checkOutTime <= checkInTime) {
        newErrors.checkOutTime = 'Check out time must be after check in time';
      }
      if (!arrivalStatus) newErrors.arrivalStatus = 'Arrival status is required';
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

      const payload: any = {
        employeeId,
        date: date!.toISOString().split('T')[0],
        status,
        notes: notes.trim() || undefined,
      };

      // Only include times and arrival status if not Absent or Leave
      if (status !== 'Absent' && status !== 'Leave') {
        payload.checkInTime = checkInTime;
        if (checkOutTime) payload.checkOutTime = checkOutTime;
        if (arrivalStatus) payload.arrivalStatus = arrivalStatus;
      }

      // For Half-day, include halfDayType
      if (status === 'Half-day' && halfDayType) {
        payload.halfDayType = halfDayType;
      }

      await callApi({
        method: 'POST',
        url: '/attendance',
        data: payload,
      });

      // Reset form after successful submission
      setEmployeeId('');
      setDate(null);
      setStatus('Present');
      setCheckInTime('');
      setCheckOutTime('');
      setArrivalStatus('');
      setHalfDayType('');
      setNotes('');
      setErrors({});

      Alert.alert('Success', 'Attendance record added successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (redirectTo) {
              (navigation as any).navigate(redirectTo);
            } else {
              navigation.goBack();
            }
          },
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
        <TouchableOpacity
          onPress={() => {
            if (redirectTo) {
              (navigation as any).navigate(redirectTo);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
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
                  // Check if the selected date is in the past
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const selected = new Date(selectedDate);
                  selected.setHours(0, 0, 0, 0);
                  
                  if (selected < today) {
                    Alert.alert('Invalid Date', 'Past attendance cannot be added. Please select today\'s date or a future date.');
                    return;
                  }
                  
                  setDate(selectedDate);
                  if (errors.date) setErrors({ ...errors, date: '' });
                }}
                maximumDate={new Date()}
                minimumDate={new Date()}
                preventPastDates={true}
                pastDateMessage="Past attendance cannot be added. Please select today's date or a future date."
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
                  // Clear times and arrival status if Absent or Leave
                  if (value === 'Absent' || value === 'Leave') {
                    setCheckInTime('');
                    setCheckOutTime('');
                    setArrivalStatus('');
                    setHalfDayType('');
                  } else if (value !== 'Half-day') {
                    // Clear half-day type if not half-day
                    setHalfDayType('');
                  }
                }}
                placeholder="Select status"
                error={errors.status}
              />
            </View>
            <View style={styles.column}>
              <TimePickerField
                label="Check In Time"
                required={status !== 'Absent' && status !== 'Leave'}
                value={checkInTime}
                onChange={(time) => {
                  setCheckInTime(time);
                  if (errors.checkInTime) setErrors({ ...errors, checkInTime: '' });
                }}
                error={errors.checkInTime}
                disabled={status === 'Absent' || status === 'Leave'}
              />
            </View>
          </View>

          {/* Half Day Type - Only show for Half-day status */}
          {status === 'Half-day' && (
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <DropdownField
                  label="Half Day Type"
                  required
                  value={halfDayType}
                  options={halfDayTypeOptions}
                  onSelect={(value) => {
                    setHalfDayType(value);
                    if (errors.halfDayType) setErrors({ ...errors, halfDayType: '' });
                  }}
                  placeholder="Select half day type"
                  error={errors.halfDayType}
                />
              </View>
              <View style={styles.column}>
                {/* Empty column for spacing */}
              </View>
            </View>
          )}

          {/* Check Out Time and Arrival Status */}
          {status !== 'Absent' && status !== 'Leave' && (
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
                  label="Arrival Status"
                  required={status === 'Present'}
                  value={arrivalStatus}
                  options={arrivalStatusOptions}
                  onSelect={(value) => {
                    setArrivalStatus(value);
                    if (errors.arrivalStatus) {
                      setErrors({ ...errors, arrivalStatus: '' });
                    }
                  }}
                  placeholder="Select an option"
                  error={errors.arrivalStatus}
                />
              </View>
            </View>
          )}

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
          onPress={() => {
            if (redirectTo) {
              (navigation as any).navigate(redirectTo);
            } else {
              navigation.goBack();
            }
          }}
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

