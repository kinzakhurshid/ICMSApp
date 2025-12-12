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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
import FormField from '../components/task/FormField';
import DropdownField from '../components/task/DropdownField';
import DatePickerField from '../components/task/DatePickerField';
import FileUploadField from '../components/task/FileUploadField';

type HREditLeaveRouteParams = {
  HREditLeave: {
    leaveId: string;
  };
};

const leaveTypeOptions = [
  { label: 'Sick', value: 'Sick' },
  { label: 'Casual', value: 'Casual' },
  { label: 'Annual', value: 'Annual' },
  { label: 'Maternity', value: 'Maternity' },
  { label: 'Paternity', value: 'Paternity' },
  { label: 'Unpaid Leave', value: 'Unpaid' },
];

export default function HREditLeaveScreen() {
  const route = useRoute<RouteProp<HREditLeaveRouteParams, 'HREditLeave'>>();
  const { leaveId } = route.params;
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState('');
  const [document, setDocument] = useState<{ uri: string; name: string; type: string } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLeaveDetails();
  }, [leaveId]);

  const loadLeaveDetails = async () => {
    try {
      setLoading(true);
      const res = await callApi({
        method: 'GET',
        url: `/leave/${leaveId}`,
      });

      const data = res?.data || res;

      setLeaveType(data?.type || '');
      setReason(data?.reason || '');
      setIsHalfDay(!!data?.isHalfDay);
      setHalfDayType(data?.halfDayType || '');

      if (data?.startDate) {
        setStartDate(new Date(data.startDate));
      }
      if (data?.endDate) {
        setEndDate(new Date(data.endDate));
      }
    } catch (error) {
      console.error('Error loading leave details:', error);
      Alert.alert('Error', 'Failed to load leave details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!leaveType) newErrors.leaveType = 'Leave type is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = 'End date must be after or equal to start date';
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

      const updateData = new FormData();
      updateData.append('startDate', startDate!.toISOString());
      updateData.append('endDate', endDate!.toISOString());
      updateData.append('type', leaveType);
      updateData.append('reason', reason.trim());
      updateData.append('isHalfDay', isHalfDay ? 'true' : 'false');
      updateData.append('halfDayType', halfDayType || '');

      if (document) {
        updateData.append('document', {
          uri: document.uri,
          type: document.type || 'application/pdf',
          name: document.name || 'document.pdf',
        } as any);
      }

      await callApi({
        method: 'PUT',
        url: `/leave/${leaveId}`,
        data: updateData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Leave updated successfully', [
        {
          text: 'OK',
          onPress: () => (navigation as any).navigate('LeavesScreen'),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating leave:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update leave');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading leave...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Leave Request</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Leave Type */}
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

          {/* Start & End Date */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <DatePickerField
                label="Start Date"
                required
                value={startDate}
                onChange={(selectedDate) => {
                  setStartDate(selectedDate);
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
                error={errors.endDate}
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
            placeholder="Provide a reason for this leave"
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
          disabled={submitting}
          onPress={() => (global as any).navigation?.goBack?.()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Update Leave</Text>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 12,
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
    gap: 16,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 16,
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


