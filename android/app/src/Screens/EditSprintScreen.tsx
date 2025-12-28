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
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
import { ISprint, Project } from './types';
import FormSection from '../components/task/FormSection';
import FormField from '../components/task/FormField';
import DropdownField from '../components/task/DropdownField';
import DatePickerField from '../components/task/DatePickerField';
import MultiSelectField from '../components/task/MultiSelectField';

export default function EditSprintScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { sprintId } = route.params as { sprintId: string };
  const { callApi } = useAxios();

  // Smart back navigation: go back if possible, otherwise navigate to SprintDetail
  const handleBack = () => {
    if (navigation.canGoBack && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Navigate explicitly to SprintDetail if we have sprintId
      if (sprintId) {
        const parent = navigation.getParent();
        if (parent) {
          try {
            parent.navigate('SprintBoard' as never, { screen: 'SprintDetailNew' as never, params: { sprintId } } as never);
          } catch {
            if (navigation.goBack) navigation.goBack();
          }
        } else if (navigation.goBack) {
          navigation.goBack();
        }
      } else if (navigation.goBack) {
        navigation.goBack();
      }
    }
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sprint, setSprint] = useState<ISprint | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [goal, setGoal] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [testing, setTesting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeOptions = [
    { label: 'Normal', value: 'normal' },
    { label: 'Testing', value: 'testing' },
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Completed', value: 'completed' },
  ];

  useEffect(() => {
    loadInitialData();
  }, [sprintId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load sprint details
      const sprintResponse = await callApi({
        method: 'GET',
        url: `/sprints/${sprintId}`,
      });

      if (sprintResponse) {
        setSprint(sprintResponse);
        setName(sprintResponse.name || '');
        setProjectIds(
          Array.isArray(sprintResponse.projectId)
            ? sprintResponse.projectId.map((p: Project) => p._id)
            : []
        );
        setStartDate(sprintResponse.startDate ? new Date(sprintResponse.startDate) : null);
        setEndDate(sprintResponse.endDate ? new Date(sprintResponse.endDate) : null);
        setGoal(sprintResponse.goal || '');
        setColor(sprintResponse.color || '#3b82f6');
        setTesting(sprintResponse.testing || false);
        setCompleted(sprintResponse.completed || false);
      }

      // Load running projects
      const projectsResponse = await callApi({
        method: 'GET',
        url: '/projects/running',
      });
      if (projectsResponse?.data) {
        setProjects(Array.isArray(projectsResponse.data) ? projectsResponse.data : []);
      }
    } catch (error: any) {
      console.error('Error loading sprint data:', error);
      Alert.alert('Error', 'Failed to load sprint data');
      handleBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Sprint name is required';
    }
    if (projectIds.length === 0) {
      newErrors.projectIds = 'At least one project is required';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'End date must be after start date';
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

      const response = await callApi({
        method: 'PUT',
        url: `/sprints/${sprintId}`,
        data: {
          name: name.trim(),
          projectIds,
          startDate: startDate!.toISOString(),
          endDate: endDate!.toISOString(),
          goal: goal.trim() || undefined,
          color,
          testing,
          completed,
        },
      });

      if (response?.success || response) {
        Alert.alert('Success', 'Sprint updated successfully', [
          {
            text: 'OK',
            onPress: handleBack,
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to update sprint');
      }
    } catch (error: any) {
      console.error('Error updating sprint:', error);
      Alert.alert('Error', 'Failed to update sprint');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading sprint...</Text>
      </View>
    );
  }

  const projectOptions = projects.map((proj) => ({
    label: proj.name,
    value: proj._id,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit a sprint</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Two Column Layout */}
        <View style={styles.twoColumnLayout}>
          {/* Left Column */}
          <View style={styles.column}>
            <FormField
              label="Sprint Name"
              required
              value={name}
              onChangeText={setName}
              placeholder="Enter sprint name"
              error={errors.name}
            />

            <DatePickerField
              label="Start Date"
              required
              value={startDate}
              onChange={setStartDate}
              error={errors.startDate}
            />

            <DropdownField
              label="Type"
              value={testing ? 'testing' : 'normal'}
              options={typeOptions}
              onSelect={(value) => setTesting(value === 'testing')}
            />

            <View style={styles.goalContainer}>
              <Text style={styles.goalLabel}>Goal</Text>
              <FormField
                label=""
                value={goal}
                onChangeText={setGoal}
                placeholder="Enter sprint goal"
                multiline
                numberOfLines={4}
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.column}>
            <MultiSelectField
              label="Projects"
              required
              selectedValues={projectIds}
              options={projectOptions}
              onSelect={setProjectIds}
              placeholder="Select projects..."
              error={errors.projectIds}
            />

            <DatePickerField
              label="End Date"
              required
              value={endDate}
              onChange={setEndDate}
              error={errors.endDate}
            />

            <DropdownField
              label="Status"
              value={completed ? 'completed' : 'active'}
              options={statusOptions}
              onSelect={(value) => setCompleted(value === 'completed')}
            />

            <FormField
              label="Color"
              value={color}
              onChangeText={setColor}
              placeholder="#3b82f6"
            />
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionButtonContainer}>
          <TouchableOpacity
            style={[styles.updateButton, submitting && styles.updateButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update Sprint</Text>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  column: {
    flex: 1,
  },
  goalContainer: {
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  actionButtonContainer: {
    marginTop: 24,
    alignItems: 'flex-end',
  },
  updateButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});


