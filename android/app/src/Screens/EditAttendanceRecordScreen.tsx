import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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

interface AttendanceRecord {
  _id: string;
  employeeId?: string | Employee;
  EmployeeId?: Employee;
  employee?: Employee;
  employeeName?: string;
  firstName?: string;
  lastName?: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave';
  checkIn?: string;
  checkOut?: string;
  timeIn?: string;
  timeOut?: string;
  arrivalStatus?: 'On Time' | 'Late' | 'Early';
  notes?: string;
}

const statusOptions = [
  { label: 'Present', value: 'Present' },
  { label: 'Absent', value: 'Absent' },
  { label: 'Late', value: 'Late' },
  { label: 'Half Day', value: 'Half Day' },
  { label: 'On Leave', value: 'On Leave' },
];

const arrivalStatusOptions = [
  { label: 'On Time', value: 'On Time' },
  { label: 'Late', value: 'Late' },
  { label: 'Early', value: 'Early' },
];

export default function EditAttendanceRecordScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { callApi } = useAxios();

  const initialRecord: AttendanceRecord | undefined = route.params?.record;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave'>('Present');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [arrivalStatus, setArrivalStatus] = useState<'On Time' | 'Late' | 'Early' | ''>('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (initialRecord) {
      hydrateFromRecord(initialRecord);
      setLoading(false);
    }
  }, [initialRecord]);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await callApi({
        method: 'GET',
        url: '/employee',
      });
      const employeesList = Array.isArray(response) ? response : response.data || [];
      setEmployees(
        employeesList.map((emp: Employee) => ({
          ...emp,
          fullName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
        })),
      );
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const hydrateFromRecord = (rec: AttendanceRecord) => {
    const empObj =
      (rec.employee as Employee) ||
      (rec.EmployeeId as Employee) ||
      (typeof rec.employeeId === 'object' ? (rec.employeeId as Employee) : undefined);

    const empId =
      (typeof rec.employeeId === 'string' && rec.employeeId) ||
      empObj?._id ||
      '';

    setEmployeeId(empId);
    setDate(rec.date ? new Date(rec.date) : null);
    setStatus(rec.status || 'Present');
    setCheckInTime(rec.checkIn || rec.timeIn || '');
    setCheckOutTime(rec.checkOut || rec.timeOut || '');
    setArrivalStatus((rec.arrivalStatus as any) || '');
    setNotes(rec.notes || '');
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
    if (!validateForm() || !initialRecord) {
      if (!initialRecord) {
        Alert.alert('Error', 'Missing attendance record to edit');
      }
      return;
    }

    try {
      setSubmitting(true);

      // Combine local form state into attendance object
      const attendance = {
        employeeId,
        date: date!.toISOString().split('T')[0],
        status,
        notes: notes.trim() || undefined,
        arrivalStatus: arrivalStatus || undefined,
      };

      const combinedCheckIn = checkInTime || undefined;
      const combinedCheckOut = checkOutTime || undefined;

      await callApi({
        method: 'PUT',
        url: `/attendance/${initialRecord._id || initialRecord.id}`,
        data: {
          ...attendance,
          checkIn: combinedCheckIn,
          checkOut: combinedCheckOut,
          arrivalStatus: attendance.arrivalStatus,
        },
      });

      Alert.alert('Success', 'Attendance updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const employeeOptions = employees.map((emp) => ({
    label: emp.fullName || `${emp.firstName} ${emp.lastName}`,
    value: emp._id,
  }));

  if (loading || loadingEmployees) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading attendance record...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View className="header" style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Attendance Record</Text>
          <Text style={styles.headerSubtitle}>Update the attendance details below</Text>
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
                  setStatus(value as any);
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
                label="Arrival Status"
                value={arrivalStatus}
                options={arrivalStatusOptions}
                onSelect={(value) => setArrivalStatus(value as any)}
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

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.updateText}>Update Attendance</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerContent: {
    flexDirection: 'column',
    gap: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
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
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  cancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  updateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});


