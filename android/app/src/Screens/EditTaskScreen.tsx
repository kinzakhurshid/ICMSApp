import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import useAxios from '../hooks/useAxios';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FormSection from '../components/task/FormSection';
import FormField from '../components/task/FormField';
import DropdownField from '../components/task/DropdownField';
import MultiSelectField from '../components/task/MultiSelectField';
import DatePickerField from '../components/task/DatePickerField';
import NumberInputField from '../components/task/NumberInputField';
import FileUploadField from '../components/task/FileUploadField';
import LabelInputField from '../components/task/LabelInputField';

interface TaskData {
  _id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  assignedTo: string[];
  projectId: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  isBug?: boolean;
  expectedResult?: string;
  actualResult?: string;
  sprintId?: string[];
  dependencies?: string[];
  link?: string;
  labels?: string[];
  attachment?: {
    url: string;
    filename: string;
  };
}

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Project {
  _id: string;
  name: string;
}

interface Sprint {
  _id: string;
  name: string;
}

export default function EditTaskScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { taskId } = route.params as { taskId: string };
  const { currentUser } = useSelector((state: RootState) => state.user);
  const { callApi } = useAxios();

  // Smart back navigation: go back if possible, otherwise navigate to TaskDetail or TaskList
  const handleBack = () => {
    if (navigation.canGoBack && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Navigate explicitly to TaskDetail if we have taskId, otherwise TaskList
      if (taskId) {
        navigation.navigate('TaskDetail' as never, { taskId } as never);
      } else {
        navigation.navigate('TaskList' as never);
      }
    }
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [task, setTask] = useState<TaskData | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('todo');
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [isBug, setIsBug] = useState(false);
  const [expectedResult, setExpectedResult] = useState('');
  const [actualResult, setActualResult] = useState('');
  const [sprintId, setSprintId] = useState<string[]>([]);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [link, setLink] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [attachment, setAttachment] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [attachmentAction, setAttachmentAction] = useState<'keep' | 'remove' | 'replace'>('keep');

  // Options data
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    loadInitialData();
  }, [taskId]);

  useEffect(() => {
    if (projectId) {
      loadSprints(projectId);
      loadProjectTasks(projectId);
    }
  }, [projectId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load task details
      const taskResponse = await callApi({
        method: 'GET',
        url: `/task/${taskId}`,
      });

      if (taskResponse?.success && taskResponse?.task) {
        const taskData = taskResponse.task;
        setTask(taskData);
        
        console.log('📋 Task data loaded:', {
          hasAttachment: !!taskData.attachment,
          attachment: taskData.attachment,
          attachments: taskData.attachments,
        });
        
        // Populate form
        setTitle(taskData.title || '');
        setDescription(taskData.description || '');
        setPriority(taskData.priority || 'medium');
        setStatus(taskData.status || 'todo');
        setAssignedTo(taskData.assignedTo?.map((u: any) => u._id || u) || []);
        setProjectId(taskData.projectId?._id || taskData.projectId || '');
        setStartDate(taskData.startDate ? new Date(taskData.startDate) : null);
        setDueDate(taskData.dueDate ? new Date(taskData.dueDate) : null);
        setEstimatedHours(taskData.estimatedHours || 0);
        setIsBug(taskData.isBug || false);
        setExpectedResult(taskData.expectedResult || '');
        setActualResult(taskData.actualResult || '');
        setSprintId(taskData.sprintId || taskData.sprints?.map((s: any) => s._id || s) || []);
        setDependencies(taskData.dependencies?.map((d: any) => d._id || d) || []);
        setLink(taskData.link || '');
        setLabels(taskData.labels || []);
        
        // Handle existing attachment - set attachmentAction to 'keep' if attachment exists
        const hasAttachment = taskData.attachment || (typeof taskData.attachments === 'string' && taskData.attachments.trim() !== '');
        if (hasAttachment) {
          setAttachmentAction('keep');
        }
      }

      // Load employees
      const employeesResponse = await callApi({
        method: 'GET',
        url: '/employee',
      });
      // Handle different response structures
      const employeesList = Array.isArray(employeesResponse) 
        ? employeesResponse 
        : employeesResponse?.data || employeesResponse?.employees || [];
      setEmployees(employeesList);

      // Load running projects
      const projectsResponse = await callApi({
        method: 'GET',
        url: '/projects/running',
      });
      if (projectsResponse?.data) {
        setProjects(Array.isArray(projectsResponse.data) ? projectsResponse.data : []);
      }
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load task data');
      handleBack();
    } finally {
      setLoading(false);
    }
  };

  const loadSprints = async (projectId: string) => {
    try {
      const response = await callApi({
        method: 'GET',
        url: `/sprints/project/${projectId}`,
      });
      
      if (response?.sprints) {
        setSprints(Array.isArray(response.sprints) ? response.sprints : []);
      } else if (response?.data?.sprints) {
        setSprints(Array.isArray(response.data.sprints) ? response.data.sprints : []);
      }
    } catch (error) {
      console.error('Error loading sprints:', error);
    }
  };

  const loadProjectTasks = async (projectId: string) => {
    try {
      const response = await callApi({
        method: 'GET',
        url: `/task/getAll?projectId=${projectId}`,
      });
      
      if (response?.data?.tasks) {
        const tasks = Array.isArray(response.data.tasks) ? response.data.tasks : [];
        // Filter out current task
        setAllTasks(tasks.filter((t: any) => t._id !== taskId));
      }
    } catch (error) {
      console.error('Error loading project tasks:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (assignedTo.length === 0) {
      newErrors.assignedTo = 'At least one assignee is required';
    }
    if (!projectId) {
      newErrors.projectId = 'Project is required';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    }
    if (estimatedHours <= 0) {
      newErrors.estimatedHours = 'Estimated hours must be greater than 0';
    }
    if (isBug) {
      if (!expectedResult.trim()) {
        newErrors.expectedResult = 'Expected result is required for bugs';
      }
      if (!actualResult.trim()) {
        newErrors.actualResult = 'Actual result is required for bugs';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix all errors before submitting');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      // Append core fields
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('priority', priority);
      formData.append('status', status);
      formData.append('projectId', projectId);
      
      // Format dates as YYYY-MM-DD (same as CreateTaskScreen)
      formData.append('startDate', startDate!.toISOString().split('T')[0]);
      formData.append('dueDate', dueDate!.toISOString().split('T')[0]);
      formData.append('estimatedHours', estimatedHours.toString());
      formData.append('isBug', isBug.toString());
      
      // Add assigned users with [] notation
      assignedTo.forEach((userId) => {
        formData.append('assignedTo[]', userId);
      });
      
      // Add bug fields if bug
      if (isBug) {
        formData.append('expectedResult', expectedResult.trim());
        formData.append('actualResult', actualResult.trim());
      }
      
      // Add sprints (can be multiple)
      if (sprintId.length > 0) {
        sprintId.forEach((id) => {
          formData.append('sprintId[]', id);
        });
      }
      
      // Add dependencies
      if (dependencies.length > 0) {
        dependencies.forEach((taskId) => {
          formData.append('dependencies[]', taskId);
        });
      }
      
      // Add labels
      if (labels.length > 0) {
        labels.forEach((label) => {
          formData.append('labels[]', label);
        });
      }
      
      // Add link if present
      if (link.trim()) {
        formData.append('link', link.trim());
      }
      
      // Extra metadata
      const assignedById = (currentUser as any)?._id || (currentUser as any)?.employeeId || (currentUser as any)?.employee?._id;
      const orgId = (currentUser as any)?.organizationId || (currentUser as any)?.organization;
      
      formData.append('assignedBy', assignedById || '');
      formData.append('organizationId', orgId || '');
      
      // Handle attachment - use 'document' to match CreateTaskScreen
      if (attachment && attachmentAction === 'replace') {
        // Upload new document (matching CreateTaskScreen field name)
        formData.append('document', {
          uri: attachment.uri,
          type: attachment.type || 'application/octet-stream',
          name: attachment.name || 'attachment',
        } as any);
        // When document is sent, server should replace the existing one
      } else if (attachmentAction === 'remove') {
        // Send attachmentAction to remove the document
        // Server might accept this field only for removal
        formData.append('attachmentAction', 'remove');
      }
      // For 'keep', don't send any attachment fields - server keeps existing attachment

      console.log('📤 Updating task:', {
        taskId,
        title: title.trim(),
        priority,
        status,
        assignedToCount: assignedTo.length,
        sprintIdCount: sprintId.length,
        dependenciesCount: dependencies.length,
        labelsCount: labels.length,
        hasAttachment: !!attachment,
        attachmentAction: attachmentAction || 'keep',
      });

      const response = await callApi({
        method: 'PUT',
        url: `/task/${taskId}/sprint`,
        data: formData,
      });

      if (response?.success) {
        Alert.alert('Success', 'Task updated successfully', [
          {
            text: 'OK',
            onPress: handleBack,
          },
        ]);
      } else {
        Alert.alert('Error', response?.message || 'Failed to update task');
      }
    } catch (error: any) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading task...</Text>
      </View>
    );
  }

  const employeeOptions = employees.map((emp) => ({
    label: `${emp.firstName} ${emp.lastName}`,
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

  const taskOptions = allTasks.map((task) => ({
    label: task.title,
    value: task._id,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Update Task</Text>
          <Text style={styles.headerSubtitle}>Modify task details, attachments, or dependencies.</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information Section */}
        <FormSection title="Basic Information">
          <FormField
            label="Title"
            required
            value={title}
            onChangeText={setTitle}
            placeholder="Enter task title"
            error={errors.title}
          />

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>
              Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.descriptionInput, errors.description && styles.inputError]}
              placeholder="Enter task description"
              placeholderTextColor="#9ca3af"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          <DropdownField
            label="Priority"
            value={priority}
            options={priorityOptions}
            onSelect={setPriority}
          />

          <DropdownField
            label="Status"
            value={status}
            options={statusOptions}
            onSelect={setStatus}
          />
        </FormSection>

        {/* Assignment Section */}
        <FormSection title="Assignment">
          <MultiSelectField
            label="Assigned To"
            required
            selectedValues={assignedTo}
            options={employeeOptions}
            onSelect={setAssignedTo}
            placeholder="Select employees..."
            error={errors.assignedTo}
          />
        </FormSection>

        {/* Active Sprint Section */}
        <FormSection title="Active Sprint">
          <MultiSelectField
            label="Sprints"
            selectedValues={sprintId}
            options={sprintOptions}
            onSelect={setSprintId}
            placeholder="Select sprints..."
          />
        </FormSection>

        {/* Dependencies Section */}
        <FormSection title="Dependencies">
          <MultiSelectField
            label="Dependencies"
            selectedValues={dependencies}
            options={taskOptions}
            onSelect={setDependencies}
            placeholder="Select options..."
          />
        </FormSection>

        {/* Date and Time Section */}
        <FormSection title="Date and Time">
          <DatePickerField
            label="Start Date"
            required
            value={startDate}
            onChange={setStartDate}
            error={errors.startDate}
          />

          <DatePickerField
            label="Due Date"
            required
            value={dueDate}
            onChange={setDueDate}
            error={errors.dueDate}
          />

          <NumberInputField
            label="Estimated Hours"
            required
            value={estimatedHours}
            onChange={setEstimatedHours}
            min={1}
            error={errors.estimatedHours}
          />
        </FormSection>

        {/* Attachment Section */}
        <FormSection title="Attachment">
          <FileUploadField
            label="File"
            value={attachment}
            onChange={(file) => {
              setAttachment(file);
              setAttachmentAction(file ? 'replace' : 'remove');
            }}
          />
          {/* Show existing attachment info */}
          {(() => {
            // Check for existing attachment - can be task.attachments (string URL) or task.attachment (object)
            const attachmentUrl = typeof task?.attachments === 'string' ? task.attachments.trim() : null;
            const attachmentObject = task?.attachment;
            const hasExistingAttachment = (attachmentUrl && attachmentUrl !== '') || attachmentObject;
            
            // Get attachment name/display text
            let attachmentName = 'Document';
            if (attachmentObject?.filename) {
              attachmentName = attachmentObject.filename;
            } else if (attachmentObject?.name) {
              attachmentName = attachmentObject.name;
            } else if (attachmentUrl) {
              // Extract filename from URL
              const urlParts = attachmentUrl.split('/');
              attachmentName = urlParts[urlParts.length - 1] || 'Document';
            }
            
            return hasExistingAttachment && !attachment ? (
              <View style={styles.attachmentActions}>
                <View style={styles.existingAttachmentInfo}>
                  <Ionicons name="document-text" size={20} color="#6b7280" />
                  <Text style={styles.attachmentInfo}>
                    Current: {attachmentName}
                  </Text>
                </View>
                <View style={styles.attachmentButtons}>
                  <TouchableOpacity
                    style={[styles.attachmentButton, attachmentAction === 'keep' && styles.attachmentButtonActive]}
                    onPress={() => setAttachmentAction('keep')}
                  >
                    <Text style={[styles.attachmentButtonText, attachmentAction === 'keep' && styles.attachmentButtonTextActive]}>
                      Keep
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.attachmentButton, attachmentAction === 'remove' && styles.attachmentButtonActive]}
                    onPress={() => setAttachmentAction('remove')}
                  >
                    <Text style={[styles.attachmentButtonText, attachmentAction === 'remove' && styles.attachmentButtonTextActive]}>
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null;
          })()}
        </FormSection>

        {/* Link Section */}
        <FormSection title="Link">
          <FormField
            label="Reference Link"
            value={link}
            onChangeText={setLink}
            placeholder="Enter reference link..."
          />
        </FormSection>

        {/* Labels Section */}
        <FormSection title="Labels">
          <LabelInputField label="Labels" values={labels} onChange={setLabels} />
        </FormSection>

        {/* Bug Fields (if isBug is true) */}
        {isBug && (
          <FormSection title="Bug Details">
            <FormField
              label="Expected Result"
              required
              value={expectedResult}
              onChangeText={setExpectedResult}
              placeholder="Enter expected result"
              error={errors.expectedResult}
              multiline
            />

            <FormField
              label="Actual Result"
              required
              value={actualResult}
              onChangeText={setActualResult}
              placeholder="Enter actual result"
              error={errors.actualResult}
              multiline
            />
          </FormSection>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleBack}
            disabled={submitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.updateButton, submitting && styles.updateButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  descriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  attachmentActions: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  existingAttachmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  attachmentInfo: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  attachmentButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  attachmentButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  attachmentButtonActive: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  attachmentButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  attachmentButtonTextActive: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  updateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f97316',
    minWidth: 100,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

