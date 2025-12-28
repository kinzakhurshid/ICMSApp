import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import DocumentPicker, { DocumentPickerResponse } from 'react-native-document-picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import FormField from '../components/task/FormField';
import DropdownField from '../components/task/DropdownField';
import MultiSelectField from '../components/task/MultiSelectField';
import DatePickerField from '../components/task/DatePickerField';
import FileUploadField from '../components/task/FileUploadField';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

const priorityOptions = [
  { label: 'Low', value: 'Low' },
  { label: 'Medium', value: 'Medium' },
  { label: 'High', value: 'High' },
];

const statusOptions = [
  { label: 'Not Started', value: 'Not Started' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'On Hold', value: 'On Hold' },
  { label: 'Upcoming', value: 'Upcoming' },
];

export default function CreateProjectScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);

  // Back navigation:
  // - If opened from Org Admin projects, go explicitly to OrgProjects
  // - If opened from PM Projects tab, rely on goBack to return to ProjectsTab
  // - Otherwise, just goBack as a sensible default
  const handleBack = () => {
    const from = route.params?.from;

    if (from === 'OrgProjects') {
      (navigation as any).navigate('OrgProjects');
    } else {
      (navigation as any).goBack();
    }
  };

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Upcoming');
  const [projectManager, setProjectManager] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [document, setDocument] = useState<DocumentPickerResponse | null>(null);

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

    if (!name.trim()) newErrors.name = 'Project name is required';
    if (!priority) newErrors.priority = 'Priority is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!status) newErrors.status = 'Status is required';
    if (!projectManager) newErrors.projectManager = 'Project Manager is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (startDate && endDate && endDate < startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!document) newErrors.document = 'Project document is required';

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

      formData.append('name', name.trim());
      formData.append('description', description.trim());
      formData.append('priority', priority);
      formData.append('status', status);
      formData.append('projectManager', projectManager);
      formData.append('startDate', startDate!.toISOString().split('T')[0]);
      formData.append('endDate', endDate!.toISOString().split('T')[0]);
      formData.append('organizationId', (currentUser as any)?.organizationId || '');
      formData.append('uploadedBy', (currentUser as any)?._id || (currentUser as any)?.employeeId || '');

      // Add team members
      teamMembers.forEach((memberId) => {
        formData.append('teamMembers[]', memberId);
      });

      // Add document
      if (document) {
        formData.append('document', {
          uri: document.uri,
          type: document.type || 'application/pdf',
          name: document.name || 'document.pdf',
        } as any);
      }

      await callApi({
        method: 'POST',
        url: '/projects/create',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Project created successfully', [
        {
          text: 'OK',
          onPress: handleBack,
        },
      ]);
    } catch (error: any) {
      console.error('Error creating project:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const employeeOptions = employees.map((emp) => ({
    label: emp.fullName || `${emp.firstName} ${emp.lastName}`,
    value: emp._id,
  }));

  const projectManagerOptions = employees.map((emp) => ({
    label: emp.fullName || `${emp.firstName} ${emp.lastName}`,
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
          <Text style={styles.headerTitle}>Create a New Project</Text>
          <Text style={styles.headerSubtitle}>Set up a new project with your team members</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Project Name and Priority */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <FormField
                label="Project Name"
                required
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="Enter project name"
                error={errors.name}
              />
            </View>
            <View style={styles.column}>
              <DropdownField
                label="Priority"
                required
                value={priority}
                options={priorityOptions}
                onSelect={(value) => {
                  setPriority(value);
                  if (errors.priority) setErrors({ ...errors, priority: '' });
                }}
                placeholder="Select priority"
                error={errors.priority}
              />
            </View>
          </View>

          {/* Description */}
          <FormField
            label="Description"
            required
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            placeholder="Project description"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            error={errors.description}
          />

          {/* Status and Project Manager */}
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
              <DropdownField
                label="Project Manager"
                required
                value={projectManager}
                options={projectManagerOptions}
                onSelect={(value) => {
                  setProjectManager(value);
                  if (errors.projectManager) setErrors({ ...errors, projectManager: '' });
                }}
                placeholder="Select an option"
                error={errors.projectManager}
              />
            </View>
          </View>

          {/* Team Members */}
          <MultiSelectField
            label="Team Members"
            selectedValues={teamMembers}
            options={employeeOptions}
            onSelect={setTeamMembers}
            placeholder="Search employees..."
          />

          {/* Dates */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <DatePickerField
                label="Start Date"
                required
                value={startDate}
                onChange={(date) => {
                  setStartDate(date);
                  if (errors.startDate) setErrors({ ...errors, startDate: '' });
                }}
                error={errors.startDate}
              />
            </View>
            <View style={styles.column}>
              <DatePickerField
                label="Proposed End Date"
                required
                value={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  if (errors.endDate) setErrors({ ...errors, endDate: '' });
                }}
                minimumDate={startDate || undefined}
                error={errors.endDate}
              />
            </View>
          </View>

          {/* Project Document */}
          <FileUploadField
            label="Project Document"
            required
            value={document ? { uri: document.uri, name: document.name || 'document.pdf', type: document.type || 'application/pdf' } : null}
            onChange={(file) => {
              if (file) {
                setDocument({
                  uri: file.uri,
                  name: file.name,
                  type: file.type || 'application/pdf',
                } as DocumentPickerResponse);
              } else {
                setDocument(null);
              }
              if (errors.document) setErrors({ ...errors, document: '' });
            }}
            error={errors.document}
          />
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBack}
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
            <Text style={styles.submitButtonText}>Create Project</Text>
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

