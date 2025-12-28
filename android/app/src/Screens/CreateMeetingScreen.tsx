import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
import { navigationRef } from '../Services/NavigationService';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import FormField from '../components/task/FormField';
import DropdownField from '../components/task/DropdownField';
import NumberInputField from '../components/task/NumberInputField';
import MultiSelectField from '../components/task/MultiSelectField';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

interface Employee {
  _id: string;
  fullName: string;
  email: string;
  profilePic?: string;
}

const meetingTypes = [
  { label: 'Daily', value: 'Daily' },
  { label: 'General', value: 'General' },
  { label: 'Sprint', value: 'Sprint' },
];

export default function CreateMeetingScreen({ route }: any) {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('General');
  const [duration, setDuration] = useState(15);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);

  // Date/Time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Smart back navigation: navigate to Meeting screen
  const handleBack = () => {
    // Use navigationRef to navigate to Meeting drawer route
    if (navigationRef.isReady() && navigationRef.current) {
      try {
        navigationRef.current.dispatch(
          CommonActions.navigate({
            name: 'Meeting',
          })
        );
        return;
      } catch (err) {
        console.error('Navigation error:', err);
      }
    }

    // Fallback: Try parent navigator
    const parent = (navigation as any).getParent?.();
    if (parent) {
      try {
        (parent as any).navigate('Meeting');
        return;
      } catch (err) {
        console.error('Parent navigation error:', err);
      }
    }

    // Last resort: goBack
    if ((navigation as any).canGoBack && typeof (navigation as any).canGoBack === 'function' && (navigation as any).canGoBack()) {
      (navigation as any).goBack();
    }
  };

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
      setEmployees(Array.isArray(response) ? response : response.data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      Alert.alert('Error', 'Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Meeting title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (description.length > 500) newErrors.description = 'Description must be 500 characters or less';
    if (!type) newErrors.type = 'Meeting type is required';
    if (duration < 5 || duration > 240) newErrors.duration = 'Duration must be between 5 and 240 minutes';
    if (!date) newErrors.date = 'Date is required';
    if (!time) newErrors.time = 'Time is required';
    if (!meetingLink.trim()) {
      newErrors.meetingLink = 'Meeting link is required';
    } else {
      // Validate URL format (should have protocol)
      const link = meetingLink.trim();
      if (!link.match(/^https?:\/\/.+/i)) {
        newErrors.meetingLink = 'Meeting link must be a valid URL (e.g., https://meet.google.com/abc-xyz)';
      }
    }
    if (participants.length === 0) newErrors.participants = 'At least one participant is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    try {
      setLoading(true);

      // Format date and time as per API spec: date = "YYYY-MM-DD", time = "HH:mm"
      const dateStr = date!.toISOString().split('T')[0];
      const timeStr = `${time!.getHours().toString().padStart(2, '0')}:${time!.getMinutes().toString().padStart(2, '0')}`;

      // Get the employee ID from currentUser - API expects createdBy field with employee ID
      const employeeId = (currentUser as any)?.employee?._id;
      
      if (!employeeId) {
        Alert.alert(
          'Error', 
          'Unable to identify your employee profile. Please ensure you have an employee account linked to your user profile. Contact your administrator if this issue persists.',
          [{ text: 'OK' }]
        );
        console.error('Employee ID not found. Current user structure:', JSON.stringify(currentUser, null, 2));
        setLoading(false);
        return;
      }

      // Get organization ID - API expects currentUser.organization
      const organizationId = (currentUser as any)?.organization;
      
      if (!organizationId) {
        Alert.alert(
          'Error', 
          'Unable to identify your organization. Please ensure you have an organization linked to your account.',
          [{ text: 'OK' }]
        );
        console.error('Organization ID not found. Current user:', JSON.stringify(currentUser, null, 2));
        setLoading(false);
        return;
      }

      // Validate and format meetingLink to ensure it's a full URL with protocol
      let formattedMeetingLink = meetingLink.trim();
      if (formattedMeetingLink && !formattedMeetingLink.match(/^https?:\/\//i)) {
        // If it doesn't start with http:// or https://, add https://
        formattedMeetingLink = 'https://' + formattedMeetingLink;
      }

      // Ensure type is one of the allowed values: "Daily", "General", "Sprint"
      const validType = type === 'Daily' || type === 'General' || type === 'Sprint' ? type : 'General';

      // Validate participants: filter to only include valid employee IDs that exist in the employees list
      const validEmployeeIds = new Set(employees.map(emp => emp._id));
      const validParticipants = Array.isArray(participants) 
        ? participants.filter((p: any) => {
            const participantId = typeof p === 'string' ? p : p._id || p;
            return participantId && typeof participantId === 'string' && validEmployeeIds.has(participantId);
          })
        : [];

      // Build payload exactly as per API specification
      const payload = {
        name: name.trim(),
        description: description.trim(),
        date: dateStr,                    // "YYYY-MM-DD"
        time: timeStr,                    // "HH:mm"
        duration: parseInt(duration.toString()),
        type: validType,                  // Must be "Daily" | "General" | "Sprint"
        meetingLink: formattedMeetingLink, // Must be full URL with protocol
        participants: validParticipants,   // Only valid employee IDs
        createdBy: employeeId,            // employee id of creator
        organizationId: organizationId,   // org id
      };
      
      console.log('=== Meeting Creation Payload ===');
      console.log('Full Payload:', JSON.stringify(payload, null, 2));
      console.log('================================');

      await callApi({
        method: 'POST',
        url: '/meetings',
        data: payload,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      Alert.alert('Success', 'Meeting created successfully', [
        {
          text: 'OK',
          onPress: handleBack,
        },
      ]);
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = () => {
    if (!date || !time) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHours = hours % 12 || 12;
    return `${day} / ${month} / ${year}, ${displayHours}:${minutes} ${ampm}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
      if (Platform.OS === 'ios') {
        setShowTimePicker(false);
      }
    }
  };

  const employeeOptions = employees.map((emp) => ({
    label: emp.fullName,
    value: emp._id,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Schedule New Meeting</Text>
          <Text style={styles.headerSubtitle}>Set up a new meeting with your team members</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Meeting Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meeting Details</Text>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <FormField
                  label="Meeting Title"
                  required
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="Enter meeting title"
                  error={errors.name}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Description"
                  required
                  value={description}
                  onChangeText={(text) => {
                    setDescription(text);
                    if (errors.description) setErrors({ ...errors, description: '' });
                  }}
                  placeholder="Meeting agenda and details..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  error={errors.description}
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <DropdownField
                  label="Meeting Type"
                  required
                  value={type}
                  options={meetingTypes}
                  onSelect={(value) => {
                    setType(value);
                    if (errors.type) setErrors({ ...errors, type: '' });
                  }}
                  placeholder="Select meeting type"
                  error={errors.type}
                />
              </View>
              <View style={styles.column}>
                <NumberInputField
                  label="Duration (minutes)"
                  required
                  value={duration}
                  onChange={setDuration}
                  min={5}
                  max={240}
                  step={5}
                  error={errors.duration}
                />
              </View>
            </View>
          </View>

          {/* Scheduling Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scheduling</Text>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <View style={styles.container}>
                  <Text style={styles.label}>
                    Date & Time <Text style={styles.required}> *</Text>
                  </Text>
                  <TouchableOpacity
                    style={[styles.dateTimeButton, errors.date || errors.time ? styles.inputError : null]}
                    onPress={() => {
                      if (Platform.OS === 'ios') {
                        // On iOS, show date picker first, then time picker
                        if (!date) {
                          setShowDatePicker(true);
                        } else {
                          setShowTimePicker(true);
                        }
                      } else {
                        // On Android, show date picker first
                        if (!date) {
                          setShowDatePicker(true);
                        } else {
                          setShowTimePicker(true);
                        }
                      }
                    }}
                  >
                    <Text style={[styles.dateTimeText, !date && !time && styles.placeholder]}>
                      {formatDateTime() || 'Select date and time'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  </TouchableOpacity>
                  {(errors.date || errors.time) && (
                    <Text style={styles.errorText}>{errors.date || errors.time}</Text>
                  )}
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={date || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}

                {showTimePicker && (
                  <DateTimePicker
                    value={time || new Date()}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                )}
              </View>
              <View style={styles.column}>
                <FormField
                  label="Meeting Link"
                  required
                  value={meetingLink}
                  onChangeText={(text) => {
                    setMeetingLink(text);
                    if (errors.meetingLink) setErrors({ ...errors, meetingLink: '' });
                  }}
                  placeholder="https://meet.google.com/abc-xyz"
                  error={errors.meetingLink}
                />
              </View>
            </View>
          </View>

          {/* Participants Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Participants</Text>

            <MultiSelectField
              label="Select Participants"
              required
              selectedValues={participants}
              options={employeeOptions}
              onSelect={(values) => {
                setParticipants(values);
                if (errors.participants) setErrors({ ...errors, participants: '' });
              }}
              placeholder="Search team members..."
              error={errors.participants}
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBack}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Schedule Meeting</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  dateTimeText: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  placeholder: {
    color: '#9ca3af',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
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

