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
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
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

interface Meeting {
  _id: string;
  name: string;
  description: string;
  type: string;
  duration: number;
  date: string;
  time: string;
  meetingLink: string;
  participants: Array<{ _id: string; fullName: string }>;
  isCancelled?: boolean;
  isCompleted?: boolean;
}

const meetingTypes = [
  { label: 'Daily', value: 'Daily' },
  { label: 'General', value: 'General' },
  { label: 'Sprint', value: 'Sprint' },
];

export default function EditMeetingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { meetingId } = route.params as { meetingId: string };
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const [loading, setLoading] = useState(false);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [duration, setDuration] = useState(15);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [status, setStatus] = useState('None');

  // Date/Time pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Smart back navigation: go back if possible, otherwise go to Meeting list
  const handleBack = () => {
    try {
      if (
        (navigation as any).canGoBack &&
        typeof (navigation as any).canGoBack === 'function' &&
        (navigation as any).canGoBack()
      ) {
        (navigation as any).goBack();
        return;
      }

      const parent = (navigation as any).getParent?.();
      if (parent) {
        parent.navigate('Meeting' as never);
        return;
      }

      (navigation as any).navigate?.('Meeting' as never);
    } catch (error) {
      console.error('Navigation error in EditMeetingScreen handleBack:', error);
      if ((navigation as any).goBack) {
        (navigation as any).goBack();
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadEmployees();
      await loadMeeting();
    };
    initializeData();
  }, [meetingId]);

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
    } finally {
      setLoadingEmployees(false);
    }
  };

  const loadMeeting = async () => {
    try {
      setLoadingMeeting(true);
      const response = await callApi({
        method: 'GET',
        url: `/meetings/${meetingId}`,
      });

      const meeting: Meeting = response.data || response;

      setName(meeting.name || '');
      setDescription(meeting.description || '');
      setType(meeting.type || '');
      setDuration(meeting.duration || 15);
      setMeetingLink(meeting.meetingLink || '');

      // Parse date
      if (meeting.date) {
        // Handle ISO date format (YYYY-MM-DD)
        const dateObj = new Date(meeting.date);
        if (!isNaN(dateObj.getTime())) {
          setDate(dateObj);
        } else {
          // Fallback for other formats
          const dateParts = meeting.date.split('-');
          if (dateParts.length === 3) {
            setDate(new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
          }
        }
      }

      // Parse time
      if (meeting.time) {
        const timeParts = meeting.time.split(':');
        if (timeParts.length === 2) {
          const timeDate = new Date();
          timeDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0);
          setTime(timeDate);
        }
      }

      // Set participants - extract IDs and filter to only include valid employee IDs
      if (meeting.participants && Array.isArray(meeting.participants)) {
        const validEmployeeIds = new Set(employees.map(emp => emp._id));
        const validParticipantIds = meeting.participants
          .map((p: any) => {
            const participantId = typeof p === 'string' ? p : p._id || p;
            return participantId && typeof participantId === 'string' ? participantId : null;
          })
          .filter((id: string | null): id is string => id !== null && validEmployeeIds.has(id));
        setParticipants(validParticipantIds);
        
        if (validParticipantIds.length !== meeting.participants.length) {
          console.warn('Some participants were filtered out because they are no longer valid employees');
        }
      }

      // Set status
      if (meeting.isCompleted) {
        setStatus('Completed');
      } else if (meeting.isCancelled) {
        setStatus('Cancelled');
      } else {
        setStatus('None');
      }
    } catch (error) {
      console.error('Error loading meeting:', error);
      Alert.alert('Error', 'Failed to load meeting details');
      navigation.goBack();
    } finally {
      setLoadingMeeting(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Meeting title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
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

      // Format date and time
      const dateStr = date!.toISOString().split('T')[0];
      const timeStr = `${time!.getHours().toString().padStart(2, '0')}:${time!.getMinutes().toString().padStart(2, '0')}`;

      // Get employee ID as per API spec: currentUser.employee._id
      const employeeId = (currentUser as any)?.employee?._id;
      
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
      
      console.log('Original participants:', participants);
      console.log('Valid participants:', validParticipants);
      console.log('Available employee IDs:', Array.from(validEmployeeIds));
      
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
        isCancelled: status === 'Cancelled',
        isCompleted: status === 'Completed',
      };

      await callApi({
        method: 'PUT',
        url: `/meetings/${meetingId}`,
        data: payload,
      });

      Alert.alert('Success', 'Meeting updated successfully', [
        {
          text: 'OK',
          onPress: handleBack,
        },
      ]);
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update meeting');
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

  const statusOptions = [
    { label: 'None', value: 'None' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

  const employeeOptions = employees.map((emp) => ({
    label: emp.fullName,
    value: emp._id,
  }));

  if (loadingMeeting) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading meeting details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Meeting</Text>
          <Text style={styles.headerSubtitle}>Update your meeting details</Text>
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
                      if (!date) {
                        setShowDatePicker(true);
                      } else if (!time) {
                        setShowTimePicker(true);
                      } else {
                        setShowDatePicker(true);
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

          {/* Participants & Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Participants & Status</Text>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
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
              <View style={styles.column}>
                <DropdownField
                  label="Status"
                  value={status}
                  options={statusOptions}
                  onSelect={setStatus}
                  placeholder="Select status"
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
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
            <Text style={styles.submitButtonText}>Update</Text>
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

