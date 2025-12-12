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
import FileUploadField from '../components/task/FileUploadField';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

const leaveTypeOptions = [
  { label: 'Sick', value: 'Sick' },
  { label: 'Casual', value: 'Casual' },
  { label: 'Annual', value: 'Annual' },
  { label: 'Maternity', value: 'Maternity' },
  { label: 'Paternity', value: 'Paternity' },
  { label: 'Unpaid', value: 'Unpaid' },
];

const halfDayTypeOptions = [
  { label: 'First Half', value: 'first' },
  { label: 'Second Half', value: 'second' },
];

export default function HRCreateLeaveScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState('');
  const [reason, setReason] = useState('');
  const [document, setDocument] = useState<{ uri: string; name: string; type: string } | null>(null);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    // Reset half day type when half day is unchecked
    if (!isHalfDay) {
      setHalfDayType('');
    }
  }, [isHalfDay]);

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
    if (!leaveType) newErrors.leaveType = 'Leave type is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = 'End date must be after or equal to start date';
    }
    if (isHalfDay && startDate && endDate && startDate.getTime() !== endDate.getTime()) {
      newErrors.endDate = 'End date must be same as start date for half-day leave';
    }
    if (isHalfDay && !halfDayType) {
      newErrors.halfDayType = 'Half-day type is required';
    }
    if (!reason.trim()) newErrors.reason = 'Reason is required';

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

      const formData = new FormData();

      formData.append('EmployeeId', employeeId);
      formData.append('startDate', startDate!.toISOString().split('T')[0]);
      formData.append('endDate', endDate!.toISOString().split('T')[0]);
      formData.append('type', leaveType);
      formData.append('reason', reason.trim());

      if (isHalfDay) {
        formData.append('isHalfDay', 'true');
        formData.append('halfDayType', halfDayType);
      } else {
        formData.append('isHalfDay', 'false');
      }

      if (document) {
        formData.append('document', {
          uri: document.uri,
          type: document.type || 'application/pdf',
          name: document.name || 'document.pdf',
        } as any);
      }

      await callApi({
        method: 'POST',
        url: '/leave',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Leave created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating leave:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create leave');
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
          <Text style={styles.headerTitle}>Create New Leave</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Employee and Leave Type */}
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
              <DropdownField
                label="Leave Type"
                required
                value={leaveType}
                options={leaveTypeOptions}
                onSelect={(value) => {
                  setLeaveType(value);
                  if (errors.leaveType) setErrors({ ...errors, leaveType: '' });
                }}
                placeholder="Select an option"
                error={errors.leaveType}
              />
            </View>
          </View>

          {/* Start Date and End Date */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <DatePickerField
                label="Start Date"
                required
                value={startDate}
                onChange={(selectedDate) => {
                  setStartDate(selectedDate);
                  if (isHalfDay && selectedDate) {
                    setEndDate(selectedDate);
                  }
                  if (errors.startDate) setErrors({ ...errors, startDate: '' });
                }}
                error={errors.startDate}
              />
            </View>
            <View style={styles.column}>
              <DatePickerField
                label="End Date"
                required
                value={endDate}
                onChange={(selectedDate) => {
                  setEndDate(selectedDate);
                  if (errors.endDate) setErrors({ ...errors, endDate: '' });
                }}
                minimumDate={startDate || undefined}
                disabled={isHalfDay}
                error={errors.endDate}
              />
            </View>
          </View>

          {/* Half Day Checkbox */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => {
                setIsHalfDay(!isHalfDay);
                if (!isHalfDay && startDate) {
                  setEndDate(startDate);
                }
                if (errors.isHalfDay) setErrors({ ...errors, isHalfDay: '' });
              }}
            >
              <View style={[styles.checkbox, isHalfDay && styles.checkboxChecked]}>
                {isHalfDay && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={styles.checkboxLabel}>This is a half-day leave</Text>
            </TouchableOpacity>
          </View>

          {/* Half Day Type (shown only if half day is checked) */}
          {isHalfDay && (
            <DropdownField
              label="Half-Day Type"
              required
              value={halfDayType}
              options={halfDayTypeOptions}
              onSelect={(value) => {
                setHalfDayType(value);
                if (errors.halfDayType) setErrors({ ...errors, halfDayType: '' });
              }}
              placeholder="Select an option"
              error={errors.halfDayType}
            />
          )}

          {/* Reason */}
          <FormField
            label="Reason"
            required
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (errors.reason) setErrors({ ...errors, reason: '' });
            }}
            placeholder="Briefly explain the reason for the leave"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            error={errors.reason}
          />

          {/* Supporting Document */}
          <FileUploadField
            label="Supporting Document (optional)"
            value={document}
            onChange={setDocument}
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
            <Text style={styles.submitButtonText}>Submit Leave</Text>
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
  checkboxContainer: {
    marginBottom: 16,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
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

