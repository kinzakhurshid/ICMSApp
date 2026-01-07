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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
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
  checkInTime?: string; // API field name
  checkOutTime?: string; // API field name
  timeIn?: string;
  timeOut?: string;
  arrivalStatus?: 'On Time' | 'Late' | 'Early';
  notes?: string;
}

const statusOptions = [
  { label: 'Present', value: 'Present' },
  { label: 'Absent', value: 'Absent' },
  { label: 'Half Day', value: 'Half-day' }, // API expects 'Half-day' with hyphen
  { label: 'On Leave', value: 'Leave' }, // API expects 'Leave' not 'On Leave'
];

const arrivalStatusOptions = [
  { label: 'On Time', value: 'On Time' },
  { label: 'Late', value: 'Late' },
  { label: 'Early', value: 'Early' },
];

const halfDayTypeOptions = [
  { label: 'First Half (Before 1 PM)', value: 'first' },
  { label: 'Second Half (After 1 PM)', value: 'second' },
];

export default function EditAttendanceRecordScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const initialRecord: AttendanceRecord | undefined = route.params?.record;
  
  // Check if user is super admin/org admin
  const displayUser = currentUser || (useSelector((state: RootState) => state.user) as any).user;
  const isOrgAdmin = ['ORG_ADMIN','OrgAdmin','org_admin','Org Admin','ORGADMIN','orgadmin','ORG'].includes(((displayUser as any)?.role || '').toString());

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [status, setStatus] = useState<'Present' | 'Absent' | 'Late' | 'Half-day' | 'Leave'>('Present');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [arrivalStatus, setArrivalStatus] = useState<'On Time' | 'Late' | 'Early' | ''>('');
  const [halfDayType, setHalfDayType] = useState(''); // 'first' or 'second' for Half-day
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (initialRecord) {
      // Only check for past dates if user is NOT super admin/org admin
      if (!isOrgAdmin) {
        const recordDate = initialRecord.date ? new Date(initialRecord.date) : null;
        if (recordDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const recordDateOnly = new Date(recordDate);
          recordDateOnly.setHours(0, 0, 0, 0);
          
          if (recordDateOnly < today) {
            Alert.alert(
              'Cannot Edit Past Attendance',
              'Past attendance cannot be edited. Please contact your administrator if you need to make changes.',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to attendance screen instead of main screen
                    const redirectTo = route.params?.redirectTo || 'HRAttendance';
                    (navigation as any).navigate(redirectTo);
                  },
                },
              ]
            );
            setLoading(false);
            return;
          }
        }
      }
      
      hydrateFromRecord(initialRecord);
      setLoading(false);
    }
  }, [initialRecord, isOrgAdmin]);

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
    // Map status values to match API format
    let mappedStatus = rec.status || 'Present';
    if (mappedStatus === 'Half Day') mappedStatus = 'Half-day';
    if (mappedStatus === 'On Leave') mappedStatus = 'Leave';
    setStatus(mappedStatus as any);
    
    // Fix: Extract time from checkInTime (API), checkIn, or timeIn - handle both date-time strings and time-only strings
    const checkInValue = rec.checkInTime || rec.checkIn || rec.timeIn || '';
    if (checkInValue) {
      // If it's a date-time string, extract just the time part
      if (checkInValue.includes('T') || checkInValue.includes(' ')) {
        try {
          const date = new Date(checkInValue);
          if (!isNaN(date.getTime())) {
            // Format as HH:mm
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            setCheckInTime(`${hours}:${minutes}`);
          } else {
            setCheckInTime(checkInValue);
          }
        } catch (e) {
          setCheckInTime(checkInValue);
        }
      } else {
        setCheckInTime(checkInValue);
      }
    } else {
      setCheckInTime('');
    }
    
    // Same for checkOut - check checkOutTime (API), checkOut, or timeOut
    const checkOutValue = rec.checkOutTime || rec.checkOut || rec.timeOut || '';
    if (checkOutValue) {
      if (checkOutValue.includes('T') || checkOutValue.includes(' ')) {
        try {
          const date = new Date(checkOutValue);
          if (!isNaN(date.getTime())) {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            setCheckOutTime(`${hours}:${minutes}`);
          } else {
            setCheckOutTime(checkOutValue);
          }
        } catch (e) {
          setCheckOutTime(checkOutValue);
        }
      } else {
        setCheckOutTime(checkOutValue);
      }
    } else {
      setCheckOutTime('');
    }
    
    setArrivalStatus((rec.arrivalStatus as any) || '');
    setHalfDayType((rec.halfDayType as any) || '');
    setNotes(rec.notes || '');
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!employeeId) newErrors.employeeId = 'Employee is required';
    if (!date) newErrors.date = 'Date is required';
    if (!status) newErrors.status = 'Status is required';

    // Only validate past dates if user is NOT super admin/org admin
    if (date && !isOrgAdmin) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'Past attendance cannot be edited. Please select today\'s date or a future date.';
      }
    }
    
    // If status is Absent or Leave, don't require check-in/check-out times
    if (status === 'Absent' || status === 'Leave') {
      // Clear check-in/check-out times and arrival status for absent/leave employees
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
    if (!validateForm() || !initialRecord) {
      if (!initialRecord) {
        Alert.alert('Error', 'Missing attendance record to edit');
      }
      return;
    }

    try {
      setSubmitting(true);

      // Combine local form state into attendance object
      // Match the API format used in AddAttendanceRecordScreen
      const attendance: any = {
        employeeId,
        date: date!.toISOString().split('T')[0],
        status,
      };

      // Only add notes if they exist
      if (notes && notes.trim()) {
        attendance.notes = notes.trim();
      }

      // Only include times and arrival status if not Absent or Leave
      if (status !== 'Absent' && status !== 'Leave') {
        // Send both checkInTime (as time string) and checkIn (as date-time string)
        // The API might need both formats to properly save the times
        if (checkInTime && checkInTime.trim() && date) {
          // Send time string as-is (HH:mm format)
          attendance.checkInTime = checkInTime.trim();
          
          // Also construct and send full date-time string for checkIn field
          const [hours, minutes] = checkInTime.trim().split(':');
          if (hours && minutes) {
            const checkInDateTime = new Date(date);
            checkInDateTime.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            attendance.checkIn = checkInDateTime.toISOString();
          }
        }
        
        // Same for checkOutTime
        if (checkOutTime && checkOutTime.trim() && date) {
          // Send time string as-is (HH:mm format)
          attendance.checkOutTime = checkOutTime.trim();
          
          // Also construct and send full date-time string for checkOut field
          const [hours, minutes] = checkOutTime.trim().split(':');
          if (hours && minutes) {
            const checkOutDateTime = new Date(date);
            checkOutDateTime.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            attendance.checkOut = checkOutDateTime.toISOString();
          }
        }
        
        // Include arrivalStatus if provided
        if (arrivalStatus && arrivalStatus.trim()) {
          attendance.arrivalStatus = arrivalStatus.trim();
        }
        
        // For Half-day, include halfDayType
        if (status === 'Half-day' && halfDayType) {
          attendance.halfDayType = halfDayType;
        }
      } else {
        // For Absent/Leave, explicitly set times to undefined (don't send empty strings)
        attendance.checkInTime = undefined;
        attendance.checkOutTime = undefined;
        attendance.checkIn = undefined;
        attendance.checkOut = undefined;
        attendance.arrivalStatus = undefined;
      }

      console.log('📤 Updating attendance with data:', JSON.stringify(attendance, null, 2));
      console.log('📤 Record ID:', initialRecord._id);
      console.log('📤 CheckInTime:', checkInTime);
      console.log('📤 CheckOutTime:', checkOutTime);

      const response = await callApi({
        method: 'PUT',
        url: `/attendance/${initialRecord._id}`,
        data: attendance,
      });

      console.log('✅ Attendance update response:', JSON.stringify(response, null, 2));
      console.log('✅ Response data:', JSON.stringify(response?.data, null, 2));
      console.log('✅ CheckInTime in response:', response?.data?.checkInTime);
      console.log('✅ CheckOutTime in response:', response?.data?.checkOutTime);
      console.log('✅ CheckIn in response:', response?.data?.checkIn);
      console.log('✅ CheckOut in response:', response?.data?.checkOut);
      
      // Note: The API response doesn't always include checkIn/checkOut immediately
      // The table will refetch when navigating back, which should include the updated times

      Alert.alert('Success', 'Attendance updated successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to attendance screen - it will auto-refresh via navigation listener
            const redirectTo = route.params?.redirectTo || 'HRAttendance';
            (navigation as any).navigate(redirectTo);
          },
        },
      ]);
    } catch (error: any) {
      console.error('❌ Error updating attendance:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Error', error?.response?.data?.message || error?.message || 'Failed to update attendance');
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
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
                  // Only check for past dates if user is NOT super admin/org admin
                  if (!isOrgAdmin) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selected = new Date(selectedDate);
                    selected.setHours(0, 0, 0, 0);
                    
                    if (selected < today) {
                      Alert.alert('Invalid Date', 'Past attendance cannot be edited. Please select today\'s date or a future date.');
                      return;
                    }
                  }
                  
                  setDate(selectedDate);
                  if (errors.date) setErrors({ ...errors, date: '' });
                }}
                maximumDate={isOrgAdmin ? undefined : new Date()}
                minimumDate={isOrgAdmin ? undefined : new Date()}
                preventPastDates={!isOrgAdmin}
                pastDateMessage={isOrgAdmin ? undefined : "Past attendance cannot be edited. Please select today's date or a future date."}
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
                  // Clear times and arrival status if Absent or Leave
                  if (value === 'Absent' || value === 'Leave') {
                    setCheckInTime('');
                    setCheckOutTime('');
                    setArrivalStatus('');
                    setHalfDayType('');
                  } else if (value !== 'Half-day') {
                    // Clear half-day type if not half-day
                    setHalfDayType('');
                  } else if (value === 'Half-day' && checkInTime) {
                    // Auto-suggest half-day type based on check-in time
                    const [hours] = checkInTime.split(':');
                    const hour = parseInt(hours, 10);
                    if (hour < 13) {
                      // Before 1 PM = first half
                      setHalfDayType('first');
                    } else {
                      // After 1 PM = second half
                      setHalfDayType('second');
                    }
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
                  
                  // Auto-suggest half-day type based on check-in time when status is Half-day
                  if (status === 'Half-day' && time) {
                    const [hours] = time.split(':');
                    const hour = parseInt(hours, 10);
                    if (hour < 13) {
                      // Before 1 PM = first half
                      setHalfDayType('first');
                    } else {
                      // After 1 PM = second half
                      setHalfDayType('second');
                    }
                  }
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
                  value={arrivalStatus}
                  options={arrivalStatusOptions}
                  onSelect={(value) => setArrivalStatus(value as any)}
                  placeholder="Select an option"
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
  backButton: {
    marginRight: 12,
    padding: 4,
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


