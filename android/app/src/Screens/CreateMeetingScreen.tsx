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
import { useNavigation } from '@react-navigation/native';
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

const meetingTypes = [
  { label: 'Daily Standup', value: 'Daily' },
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Sprint', value: 'Sprint' },
  { label: 'One-on-One', value: 'One-on-One' },
  { label: 'Team Meeting', value: 'Team Meeting' },
  { label: 'Other', value: 'Other' },
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
  const [type, setType] = useState('');
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
    if (!meetingLink.trim()) newErrors.meetingLink = 'Meeting link is required';
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

      // Format date and time separately (for separate date/time fields)
      const dateStr = date!.toISOString().split('T')[0];
      const timeStr = `${time!.getHours().toString().padStart(2, '0')}:${time!.getMinutes().toString().padStart(2, '0')}`;
      
      // Calculate startDate and endDate (API expects ISO dates)
      const startDateTime = new Date(date!);
      startDateTime.setHours(time!.getHours(), time!.getMinutes(), 0, 0);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);
      
      const startDateISO = startDateTime.toISOString();
      const endDateISO = endDateTime.toISOString();

      // Get the employee ID from currentUser - API expects creator field with employee ID
      // Try multiple possible locations for employee ID
      const employeeId = (currentUser as any)?.employee?._id || 
                        (currentUser as any)?.employee?.id ||
                        (currentUser as any)?.employeeId ||
                        (currentUser as any)?._id; // Fallback to user ID if employee structure doesn't exist
      
      console.log('Current user object:', JSON.stringify(currentUser, null, 2));
      console.log('Attempting to extract employee ID...');
      console.log('  - currentUser.employee._id:', (currentUser as any)?.employee?._id);
      console.log('  - currentUser.employee.id:', (currentUser as any)?.employee?.id);
      console.log('  - currentUser.employeeId:', (currentUser as any)?.employeeId);
      console.log('  - currentUser._id:', (currentUser as any)?._id);
      console.log('  - Final employeeId:', employeeId);
      
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

      // Get organization ID - can be a string directly or nested in object
      const organizationId = (currentUser as any)?.organizationId || 
                            (currentUser as any)?.organization || // Direct string ID
                            (currentUser as any)?.organization?._id ||
                            (currentUser as any)?.organization?.id ||
                            (currentUser as any)?.employee?.organizationId ||
                            (currentUser as any)?.employee?.organization || // Direct string ID in employee object
                            (currentUser as any)?.employee?.organization?._id;
      
      console.log('Attempting to extract organization ID...');
      console.log('  - currentUser.organizationId:', (currentUser as any)?.organizationId);
      console.log('  - currentUser.organization:', (currentUser as any)?.organization);
      console.log('  - currentUser.organization._id:', (currentUser as any)?.organization?._id);
      console.log('  - currentUser.employee.organizationId:', (currentUser as any)?.employee?.organizationId);
      console.log('  - currentUser.employee.organization:', (currentUser as any)?.employee?.organization);
      console.log('  - Final organizationId:', organizationId);
      
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

      // Build payload with all required fields
      // Ensure creator is included in participants if not already there
      const participantsList = Array.isArray(participants) ? [...participants] : [];
      if (!participantsList.includes(employeeId)) {
        participantsList.push(employeeId);
      }
      
      // Build payload - try createdBy instead of creator as Meeting interface shows createdBy
      const payload: any = {
        name: name.trim(),
        title: name.trim(),
        description: description.trim() || '',
        startDate: startDateISO,
        endDate: endDateISO,
        date: dateStr,
        time: timeStr,
        duration: parseInt(duration.toString()) || 30,
        type: type || 'General',
        status: 'Scheduled',
        participants: participantsList.length > 0 ? participantsList : [employeeId],
        createdBy: employeeId, // Try createdBy instead of creator (matches Meeting interface)
        creator: employeeId, // Keep both just in case
        organizationId: organizationId,
        organization: organizationId, // Try both organization and organizationId
      };
      
      // Add optional fields
      if (meetingLink && meetingLink.trim()) {
        payload.meetingLink = meetingLink.trim();
        payload.meetingUrl = meetingLink.trim();
      }
      
      // Remove undefined fields
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
          delete payload[key];
        }
      });
      
      // Validate that required fields are not empty
      if (!payload.name || !payload.startDate || !payload.endDate || !payload.createdBy || !payload.organizationId) {
        Alert.alert('Error', 'Please fill all required fields');
        setLoading(false);
        return;
      }
      
      console.log('=== Meeting Creation Payload ===');
      console.log('Full Payload:', JSON.stringify(payload, null, 2));
      console.log('Field Check:');
      console.log('  - name:', payload.name);
      console.log('  - title:', payload.title);
      console.log('  - description:', payload.description);
      console.log('  - startDate:', payload.startDate);
      console.log('  - endDate:', payload.endDate);
      console.log('  - date:', payload.date);
      console.log('  - time:', payload.time);
      console.log('  - duration:', payload.duration, typeof payload.duration);
      console.log('  - type:', payload.type);
      console.log('  - status:', payload.status);
      console.log('  - participants:', payload.participants, 'Array?', Array.isArray(payload.participants), 'Length:', payload.participants?.length);
      console.log('  - createdBy:', payload.createdBy);
      console.log('  - creator:', payload.creator);
      console.log('  - organizationId:', payload.organizationId);
      console.log('  - organization:', payload.organization);
      console.log('  - meetingLink:', payload.meetingLink);
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
          onPress: () => navigation.goBack(),
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
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

