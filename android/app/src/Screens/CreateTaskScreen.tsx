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
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import FormSection from '../components/task/FormSection';
import FormField from '../components/task/FormField';
import DropdownField from '../components/task/DropdownField';
import MultiSelectField from '../components/task/MultiSelectField';
import DatePickerField from '../components/task/DatePickerField';
import NumberInputField from '../components/task/NumberInputField';
import FileUploadField from '../components/task/FileUploadField';
import LabelInputField from '../components/task/LabelInputField';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

interface Project {
  _id: string;
  name: string;
}

interface Sprint {
  _id: string;
  name: string;
}

interface Task {
  _id: string;
  title: string;
}

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
];

const statusOptions = [
  { label: 'To Do', value: 'todo' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'In Review', value: 'in_review' },
  { label: 'Completed', value: 'completed' },
  { label: 'Blocked', value: 'blocked' },
];

const bugOptions = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

export default function CreateTaskScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Smart back navigation: go back if possible, otherwise navigate to TaskList
  const handleBack = () => {
    if (navigation.canGoBack && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Navigate explicitly to TaskList
      navigation.navigate('TaskList' as never);
    }
  };
  const { callApi } = useAxios();
  const { currentUser } = useSelector((state: RootState) => state.user);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const initialProjectIdFromRoute = (route.params as any)?.projectId as string | undefined;
  const [projectId, setProjectId] = useState(initialProjectIdFromRoute || '');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [isBug, setIsBug] = useState(false);
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [sprintId, setSprintId] = useState('');
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<{ uri: string; name: string; type: string } | null>(null);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (projectId) {
      loadProjectSprints();
    } else {
      setSprints([]);
      setSprintId('');
    }
  }, [projectId, isBug]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);

      // Load employees
      const employeesResponse = await callApi({
        method: 'GET',
        url: '/employee',
      });
      const employeesList = Array.isArray(employeesResponse) 
        ? employeesResponse 
        : employeesResponse.data || [];
      setEmployees(employeesList.map((emp: Employee) => ({
        ...emp,
        fullName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
      })));

      // Load running projects
      const projectsResponse = await callApi({
        method: 'GET',
        url: '/projects/running',
      });
      if (projectsResponse?.data) {
        const projectsList = Array.isArray(projectsResponse.data) ? projectsResponse.data : [];
        setProjects(projectsList);

        // If we came from a specific project, pre-select it once projects are loaded
        if (initialProjectIdFromRoute && !projectId) {
          const exists = projectsList.some((p: Project) => p._id === initialProjectIdFromRoute);
          if (exists) {
            setProjectId(initialProjectIdFromRoute);
          }
        }
      }

      // Load tasks for dependencies
      const orgId =
        (currentUser as any)?.organizationId ||
        (currentUser as any)?.organization ||
        (currentUser as any)?.employee?.organizationId;
      if (orgId) {
        const tasksResponse = await callApi({
          method: 'GET',
          url: `/task/getAll?organizationId=${orgId}&status=active`,
        });
        if (tasksResponse?.data?.tasks) {
          setTasks(Array.isArray(tasksResponse.data.tasks) ? tasksResponse.data.tasks : []);
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const loadProjectSprints = async () => {
    if (!projectId) return;

    try {
      const response = await callApi({
        method: 'GET',
        url: `/sprints/project/${projectId}?testing=${isBug}`,
      });
      const sprintsList = response.sprints || response.data?.sprints || [];
      setSprints(Array.isArray(sprintsList) ? sprintsList : []);
    } catch (error) {
      console.error('Error loading sprints:', error);
      setSprints([]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim() || title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!priority) newErrors.priority = 'Priority is required';
    if (!status) newErrors.status = 'Status is required';
    if (assignedTo.length === 0) newErrors.assignedTo = 'At least one assignee is required';
    if (!projectId) newErrors.projectId = 'Project is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (startDate && startDate < new Date()) {
      newErrors.startDate = 'Start date cannot be in the past';
    }
    if (!dueDate) newErrors.dueDate = 'Due date is required';
    if (startDate && dueDate && dueDate < startDate) {
      newErrors.dueDate = 'Due date must be after start date';
    }
    if (estimatedHours < 0) newErrors.estimatedHours = 'Estimated hours must be 0 or greater';
    if (isBug) {
      if (!expectedResult.trim()) newErrors.expectedResult = 'Expected result is required for bugs';
      if (!actualResult.trim()) newErrors.actualResult = 'Actual result is required for bugs';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    const orgId =
      (currentUser as any)?.organizationId ||
      (currentUser as any)?.organization ||
      (currentUser as any)?.employee?.organizationId;
    const assignedById =
      (currentUser as any)?._id ||
      (currentUser as any)?.employeeId ||
      (currentUser as any)?.employee?._id;

    if (!orgId || !assignedById) {
      console.warn('CreateTaskScreen: Missing orgId or assignedById', {
        orgId,
        assignedById,
      });
      Alert.alert(
        'Configuration Error',
        'Missing organization or user id for task creation. Please re-login or contact admin.',
      );
      return;
    }

    // Some backends require estimatedHours > 0 (not just >= 0)
    if (estimatedHours <= 0) {
      Alert.alert('Validation Error', 'Estimated hours must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('priority', priority);
      formData.append('status', status);
      formData.append('projectId', projectId);
      formData.append('startDate', startDate!.toISOString().split('T')[0]);
      formData.append('dueDate', dueDate!.toISOString().split('T')[0]);
      formData.append('estimatedHours', estimatedHours.toString());
      formData.append('isBug', isBug.toString());
      formData.append('assignedBy', assignedById);
      formData.append('organizationId', orgId);

      // Add assigned users
      assignedTo.forEach((userId) => {
        formData.append('assignedTo[]', userId);
      });

      // Add bug fields if bug
      if (isBug) {
        formData.append('expectedResult', expectedResult.trim());
        formData.append('actualResult', actualResult.trim());
      }

      // Add sprint if selected
      if (sprintId) {
        formData.append('sprintId', sprintId);
      }

      // Add dependencies
      dependencies.forEach((taskId) => {
        formData.append('dependencies[]', taskId);
      });

      // Add labels
      labels.forEach((label) => {
        formData.append('labels[]', label);
      });

      // Add link
      if (link.trim()) {
        formData.append('link', link.trim());
      }

      // Add attachment
      if (attachment) {
        formData.append('document', {
          uri: attachment.uri,
          type: attachment.type || 'application/octet-stream',
          name: attachment.name,
        } as any);
      }

      await callApi({
        method: 'POST',
        url: '/task/create',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Task created successfully', [
        {
          text: 'OK',
          onPress: handleBack,
        },
      ]);
    } catch (error: any) {
      // Log full response from backend so we can see validation errors
      console.error('Error creating task:', error?.response?.data || error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        null;
      Alert.alert('Error', backendMessage || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  const employeeOptions = employees.map((emp) => ({
    label: emp.fullName || `${emp.firstName} ${emp.lastName}`,
    value: emp._id,
  }));

  const projectOptions = projects.map((proj) => ({
    label: proj.name,
    value: proj._id,
  }));

  const sprintOptions = sprints.map((sprint) => ({
    label: sprint.name,
    value: sprint._id,
  }));

  const taskOptions = tasks
    .filter((task) => task._id !== projectId) // Exclude current task if editing
    .map((task) => ({
      label: task.title,
      value: task._id,
    }));

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading form data...</Text>
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
          <Text style={styles.headerTitle}>Create a New Task</Text>
          <Text style={styles.headerSubtitle}>Set up a new task for your project</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Basic Information Section */}
          <FormSection title="Basic Information">
            <FormField
              label="Title"
              required
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              placeholder="Enter task title"
              error={errors.title}
            />

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <DropdownField
                  label="Project"
                  required
                  value={projectId}
                  options={projectOptions}
                  onSelect={(value) => {
                    setProjectId(value);
                    setSprintId(''); // Reset sprint when project changes
                    if (errors.projectId) setErrors({ ...errors, projectId: '' });
                  }}
                  placeholder="Select an option"
                  error={errors.projectId}
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
                <MultiSelectField
                  label="Assign To"
                  required
                  selectedValues={assignedTo}
                  options={employeeOptions}
                  onSelect={(values) => {
                    setAssignedTo(values);
                    if (errors.assignedTo) setErrors({ ...errors, assignedTo: '' });
                  }}
                  placeholder="Search employees..."
                  error={errors.assignedTo}
                />
              </View>
            </View>

            <FormField
              label="Description"
              required
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              placeholder="Describe the task details..."
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              error={errors.description}
            />
          </FormSection>

          {/* Dates and Hours Section */}
          <FormSection title="Dates and Hours">
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
                  minimumDate={new Date()}
                  error={errors.startDate}
                />
              </View>
              <View style={styles.column}>
                <DatePickerField
                  label="Due Date"
                  required
                  value={dueDate}
                  onChange={(date) => {
                    setDueDate(date);
                    if (errors.dueDate) setErrors({ ...errors, dueDate: '' });
                  }}
                  minimumDate={startDate || undefined}
                  error={errors.dueDate}
                />
              </View>
            </View>

            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <NumberInputField
                  label="Estimated Hours"
                  required
                  value={estimatedHours}
                  onChange={setEstimatedHours}
                  min={0}
                  error={errors.estimatedHours}
                />
              </View>
              <View style={styles.column}>
                <DropdownField
                  label="Is this a Bug?"
                  value={isBug ? 'true' : 'false'}
                  options={bugOptions}
                  onSelect={(value) => {
                    setIsBug(value === 'true');
                    setSprintId(''); // Reset sprint when bug status changes
                    if (errors.isBug) setErrors({ ...errors, isBug: '' });
                  }}
                  placeholder="Select"
                />
              </View>
            </View>

            {/* Bug-specific fields */}
            {isBug && (
              <>
                <FormField
                  label="Expected Result"
                  required
                  value={expectedResult}
                  onChangeText={(text) => {
                    setExpectedResult(text);
                    if (errors.expectedResult) setErrors({ ...errors, expectedResult: '' });
                  }}
                  placeholder="What should happen?"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  error={errors.expectedResult}
                />
                <FormField
                  label="Actual Result"
                  required
                  value={actualResult}
                  onChangeText={(text) => {
                    setActualResult(text);
                    if (errors.actualResult) setErrors({ ...errors, actualResult: '' });
                  }}
                  placeholder="What actually happens?"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  error={errors.actualResult}
                />
              </>
            )}
          </FormSection>

          {/* Sprint and Dependencies Section */}
          <FormSection title="Sprint and Dependencies">
            <View style={styles.twoColumn}>
              <View style={styles.column}>
                <DropdownField
                  label="Active Sprint"
                  value={sprintId}
                  options={sprintOptions}
                  onSelect={setSprintId}
                  placeholder="Select an option"
                  disabled={!projectId || sprints.length === 0}
                />
              </View>
              <View style={styles.column}>
                <MultiSelectField
                  label="Parent Task (Dependencies)"
                  selectedValues={dependencies}
                  options={taskOptions}
                  onSelect={setDependencies}
                  placeholder="Select dependent tasks..."
                />
              </View>
            </View>
          </FormSection>

          {/* Labels Section */}
          <FormSection title="Labels">
            <LabelInputField
              label=""
              values={labels}
              onChange={setLabels}
            />
          </FormSection>

          {/* Attachment Section */}
          <FormSection title="Attachment">
            <FileUploadField
              label=""
              value={attachment}
              onChange={setAttachment}
            />
          </FormSection>

          {/* Link Section */}
          <FormSection title="Link">
            <FormField
              label=""
              value={link}
              onChangeText={setLink}
              placeholder="Enter link"
              keyboardType="url"
            />
          </FormSection>
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
            <Text style={styles.submitButtonText}>Create Task</Text>
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

