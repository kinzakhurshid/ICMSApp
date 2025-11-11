import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import DocumentPicker, { DocumentPickerResponse, types as DocumentTypes } from 'react-native-document-picker';
import Feather from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';

import useAxios from '../hooks/useAxios';
import { RootState } from '../states/store';

const leaveTypeOptions = [
  { label: 'Select leave type', value: '' },
  { label: 'Sick Leave', value: 'Sick' },
  { label: 'Casual Leave', value: 'Casual' },
  { label: 'Annual Leave', value: 'Annual' },
  { label: 'Maternity Leave', value: 'Maternity' },
  { label: 'Paternity Leave', value: 'Paternity' },
  { label: 'Unpaid Leave', value: 'Unpaid' },
];

const halfDayOptions = [
  { label: 'First Half (Morning)', value: 'first' },
  { label: 'Second Half (Afternoon)', value: 'second' },
];

type HalfDayType = '' | 'first' | 'second';
type LeaveType = '' | 'Sick' | 'Casual' | 'Annual' | 'Maternity' | 'Paternity' | 'Unpaid';

type RouteParams = {
  redirectTo?: string;
};

const RequestLeaveScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute();
  const params = (route.params || {}) as RouteParams;

  const { currentUser } = useSelector((state: RootState) => state.user);
  const employeeId = currentUser?.employee?._id;

  const { callApi } = useAxios();

  const [formData, setFormData] = useState({
    type: '' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
    isHalfDay: false,
    halfDayType: '' as HalfDayType,
  });

  const [startPickerVisible, setStartPickerVisible] = useState(false);
  const [endPickerVisible, setEndPickerVisible] = useState(false);
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);
  const [pickerDate, setPickerDate] = useState(new Date());
  const [selectedDocument, setSelectedDocument] = useState<DocumentPickerResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const todayIso = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  }, []);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      startDate: todayIso,
      endDate: todayIso,
    }));
  }, [todayIso]);

  const isSameDay = useMemo(() => {
    if (!formData.startDate || !formData.endDate) return false;
    return new Date(formData.startDate).toDateString() === new Date(formData.endDate).toDateString();
  }, [formData.startDate, formData.endDate]);

  useEffect(() => {
    if (!isSameDay) {
      setFormData(prev => ({ ...prev, isHalfDay: false, halfDayType: '' }));
    }
  }, [isSameDay]);

  const openDatePicker = (type: 'start' | 'end') => {
    const value = type === 'start' ? formData.startDate : formData.endDate;
    const initialDate = value ? new Date(value) : new Date();

    if (Platform.OS === 'ios') {
      setActivePicker(type);
      setPickerDate(initialDate);
    } else {
      if (type === 'start') {
        setStartPickerVisible(true);
        setPickerDate(initialDate);
      } else {
        setEndPickerVisible(true);
        setPickerDate(initialDate);
      }
    }
  };

  const handlePickerChange = (event: DateTimePickerEvent, selectedDate?: Date, type?: 'start' | 'end') => {
    if (event.type === 'dismissed') {
      if (Platform.OS === 'android') {
        setStartPickerVisible(false);
        setEndPickerVisible(false);
      }
      return;
    }

    const pickedDate = selectedDate || pickerDate;
    const isoDate = pickedDate.toISOString().split('T')[0];

    if (type === 'start' || activePicker === 'start') {
      setFormData(prev => ({ ...prev, startDate: isoDate }));
      if (Platform.OS === 'android') {
        setStartPickerVisible(false);
      }
    }

    if (type === 'end' || activePicker === 'end') {
      setFormData(prev => ({ ...prev, endDate: isoDate }));
      if (Platform.OS === 'android') {
        setEndPickerVisible(false);
      }
    }

    if (Platform.OS === 'ios') {
      setPickerDate(pickedDate);
    }
  };

  const applyIosPicker = () => {
    if (!activePicker) {
      setActivePicker(null);
      return;
    }
    const isoDate = pickerDate.toISOString().split('T')[0];
    if (activePicker === 'start') {
      setFormData(prev => ({ ...prev, startDate: isoDate }));
    } else {
      setFormData(prev => ({ ...prev, endDate: isoDate }));
    }
    setActivePicker(null);
  };

  const cancelIosPicker = () => {
    setActivePicker(null);
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.pickSingle({
        presentationStyle: 'fullScreen',
        type: [DocumentTypes.images, DocumentTypes.pdf],
        copyTo: Platform.OS === 'android' ? 'documentDirectory' : 'cachesDirectory',
      });
      setSelectedDocument(result);
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return;
      }
      console.error('Failed to pick document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleInputChange = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.type) {
      Alert.alert('Validation', 'Please select a leave type.');
      return false;
    }

    if (!formData.startDate || !formData.endDate) {
      Alert.alert('Validation', 'Please select both start and end dates.');
      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      Alert.alert('Validation', 'Start date cannot be in the past.');
      return false;
    }

    if (end < start) {
      Alert.alert('Validation', 'End date cannot be before the start date.');
      return false;
    }

    if (!formData.reason.trim()) {
      Alert.alert('Validation', 'Please provide a reason for the leave.');
      return false;
    }

    if (formData.isHalfDay && !formData.halfDayType) {
      Alert.alert('Validation', 'Please choose which half of the day you are requesting.');
      return false;
    }

    if (!employeeId) {
      Alert.alert('Error', 'Employee information missing. Please re-login.');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);

      const payload = new FormData();
      payload.append('EmployeeId', employeeId);
      payload.append('startDate', start.toISOString());
      payload.append('endDate', end.toISOString());
      payload.append('type', formData.type);
      payload.append('reason', formData.reason.trim());
      payload.append('status', 'Pending');

      if (formData.isHalfDay && formData.halfDayType) {
        payload.append('isHalfDay', 'true');
        payload.append('halfDayType', formData.halfDayType);
      }

      if (selectedDocument) {
        const fileUri = selectedDocument.fileCopyUri || selectedDocument.uri;
        payload.append('document', {
          uri: fileUri,
          type: selectedDocument.type || 'application/octet-stream',
          name: selectedDocument.name || `attachment-${Date.now()}`,
        } as any);
      }

      const response = await callApi({
        method: 'POST',
        url: '/leave',
        data: payload,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response?.success) {
        Alert.alert('Success', response?.message || 'Leave request submitted successfully.', [
          {
            text: 'OK',
            onPress: () => {
              if (params.redirectTo) {
                navigation.navigate(params.redirectTo as never);
              } else {
                navigation.goBack();
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error', response?.error || 'Failed to submit leave request.');
      }
    } catch (error: any) {
      const message =
        error?.message ||
        error?.error ||
        'Failed to submit leave request. Please try again.';
      Alert.alert('Error', message);
      console.error('Leave request error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const removeDocument = () => setSelectedDocument(null);

  return (
    <View style={styles.screen}>
      <View style={styles.header}> 
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={20} color="#1F2937" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Leave</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Leave Details</Text>

        {/* Leave Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Leave Type *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={formData.type}
              onValueChange={value => handleInputChange('type', value as LeaveType)}
            >
              {leaveTypeOptions.map(option => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.row}>
          <View style={styles.flexItem}>
            <Text style={styles.label}>Start Date *</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('start')}>
              <Feather name="calendar" size={16} color="#6B7280" />
              <Text style={styles.dateText}>{formData.startDate || 'Select date'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.flexItem}>
            <Text style={styles.label}>End Date *</Text>
            <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('end')}>
              <Feather name="calendar" size={16} color="#6B7280" />
              <Text style={styles.dateText}>{formData.endDate || 'Select date'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Half day */}
        {isSameDay && (
          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Half Day?</Text>
              <Switch
                value={formData.isHalfDay}
                onValueChange={value => handleInputChange('isHalfDay', value)}
                trackColor={{ false: '#D1D5DB', true: '#FFEDD5' }}
                thumbColor={formData.isHalfDay ? '#FB923C' : '#f4f3f4'}
              />
            </View>
            {formData.isHalfDay && (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.halfDayType}
                  onValueChange={value => handleInputChange('halfDayType', value as HalfDayType)}
                >
                  <Picker.Item label="Select half of the day" value="" />
                  {halfDayOptions.map(option => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            )}
          </View>
        )}

        {/* Reason */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason *</Text>
          <TextInput
            style={styles.textArea}
            value={formData.reason}
            onChangeText={value => handleInputChange('reason', value)}
            placeholder="Briefly explain the reason for the leave"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Document */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Supporting Document (optional)</Text>
          <View style={styles.documentRow}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleDocumentPick}>
              <Feather name="upload" size={16} color="#fff" />
              <Text style={styles.uploadButtonText}>Upload File</Text>
            </TouchableOpacity>
            {selectedDocument && (
              <TouchableOpacity style={styles.removeFile} onPress={removeDocument}>
                <Feather name="x" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
          {selectedDocument && (
            <Text style={styles.fileName} numberOfLines={1}>
              {selectedDocument.name}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()} disabled={submitting}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, submitting && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {(startPickerVisible || endPickerVisible) && (
        <DateTimePicker
          mode="date"
          display="calendar"
          value={pickerDate}
          onChange={event =>
            handlePickerChange(
              event,
              event.nativeEvent.timestamp ? new Date(event.nativeEvent.timestamp) : undefined,
              startPickerVisible ? 'start' : 'end'
            )
          }
          minimumDate={
            startPickerVisible
              ? new Date(todayIso)
              : formData.startDate
              ? new Date(formData.startDate)
              : new Date(todayIso)
          }
          maximumDate={
            startPickerVisible && formData.endDate ? new Date(formData.endDate) : undefined
          }
        />
      )}

      {activePicker && Platform.OS === 'ios' && (
        <View style={styles.iosPickerModal}>
          <View style={styles.iosPickerContent}>
            <View style={styles.iosPickerHeader}>
              <TouchableOpacity onPress={cancelIosPicker}>
                <Text style={styles.iosPickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.iosPickerTitle}>
                {activePicker === 'start' ? 'Select Start Date' : 'Select End Date'}
              </Text>
              <TouchableOpacity onPress={applyIosPicker}>
                <Text style={styles.iosPickerApply}>Apply</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display="spinner"
              onChange={event => {
                if (event.type !== 'dismissed' && event.nativeEvent.timestamp) {
                  setPickerDate(new Date(event.nativeEvent.timestamp));
                }
              }}
              minimumDate={
                activePicker === 'end' && formData.startDate
                  ? new Date(formData.startDate)
                  : new Date(todayIso)
              }
              maximumDate={
                activePicker === 'start' && formData.endDate ? new Date(formData.endDate) : undefined
              }
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexItem: {
    flex: 1,
    gap: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#111827',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textArea: {
    minHeight: 120,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
    color: '#111827',
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FB923C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  removeFile: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
  },
  fileName: {
    fontSize: 12,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FB923C',
    minWidth: 160,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#FCD34D',
  },
  primaryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  iosPickerModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  iosPickerContent: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  iosPickerCancel: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '600',
  },
  iosPickerApply: {
    fontSize: 15,
    color: '#FB923C',
    fontWeight: '600',
  },
  rangeSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  rangeSummaryText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
  },
});

export default RequestLeaveScreen;
