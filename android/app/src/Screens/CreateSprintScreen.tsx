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
import FormSection from '../components/task/FormSection';
import FormField from '../components/task/FormField';
import DropdownField from '../components/task/DropdownField';
import DatePickerField from '../components/task/DatePickerField';
import MultiSelectField from '../components/task/MultiSelectField';

interface Project {
  _id: string;
  name: string;
}

const typeOptions = [
  { label: 'Normal', value: 'normal' },
  { label: 'Testing', value: 'testing' },
];

export default function CreateSprintScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [type, setType] = useState('normal');
  const [color, setColor] = useState('#3b82f6');
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [goal, setGoal] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoadingProjects(true);
      const response = await callApi({
        method: 'GET',
        url: '/projects/running',
      });
      if (response?.data) {
        setProjects(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Sprint name is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (startDate && startDate < new Date()) {
      newErrors.startDate = 'Start date cannot be in the past';
    }
    if (!endDate) newErrors.endDate = 'End date is required';
    if (startDate && endDate && endDate <= startDate) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (projectIds.length === 0) newErrors.projectIds = 'At least one project is required';

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

      const payload = {
        name: name.trim(),
        projectIds,
        startDate: startDate!.toISOString().split('T')[0],
        endDate: endDate!.toISOString().split('T')[0],
        goal: goal.trim() || undefined,
        color,
        testing: type === 'testing',
      };

      await callApi({
        method: 'POST',
        url: '/sprints/create',
        data: payload,
      });

      Alert.alert('Success', 'Sprint created successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error creating sprint:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create sprint');
    } finally {
      setSubmitting(false);
    }
  };

  const projectOptions = projects.map((proj) => ({
    label: proj.name,
    value: proj._id,
  }));

  if (loadingProjects) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Create a sprint</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Left Column */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <FormField
                label="Sprint Name"
                required
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="Enter sprint name"
                error={errors.name}
              />

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

              <DropdownField
                label="Sprint Type"
                value={type}
                options={typeOptions}
                onSelect={setType}
                placeholder="Select type"
              />

              <FormField
                label="Color"
                value={color}
                onChangeText={setColor}
                placeholder="#3b82f6"
              />
            </View>

            {/* Right Column */}
            <View style={styles.column}>
              <MultiSelectField
                label="Projects"
                required
                selectedValues={projectIds}
                options={projectOptions}
                onSelect={(values) => {
                  setProjectIds(values);
                  if (errors.projectIds) setErrors({ ...errors, projectIds: '' });
                }}
                placeholder="Select options..."
                error={errors.projectIds}
              />

              <DatePickerField
                label="End Date"
                required
                value={endDate}
                onChange={(date) => {
                  setEndDate(date);
                  if (errors.endDate) setErrors({ ...errors, endDate: '' });
                }}
                minimumDate={startDate || undefined}
                error={errors.endDate}
              />

              <FormField
                label="Goal"
                value={goal}
                onChangeText={setGoal}
                placeholder="Enter sprint goal"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
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
            <Text style={styles.submitButtonText}>Create Sprint</Text>
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


