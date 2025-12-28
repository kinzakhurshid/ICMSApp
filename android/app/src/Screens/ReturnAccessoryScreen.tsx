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
import DropdownField from '../components/task/DropdownField';
import FormField from '../components/task/FormField';

interface Assignment {
  _id: string;
  accessory: {
    _id: string;
    name: string;
    category: string;
  };
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

const conditionOptions = [
  { label: 'New', value: 'new' },
  { label: 'Good', value: 'good' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Lost', value: 'lost' },
];

export default function ReturnAccessoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const redirectTo = (route.params as any)?.redirectTo as string | undefined;
  const { callApi } = useAxios();

  const [submitting, setSubmitting] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [assignmentId, setAssignmentId] = useState('');
  const [conditionOnReturn, setConditionOnReturn] = useState('');
  const [conditionDescription, setConditionDescription] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get initial assignment from route params if available
  const initialAssignment = (route.params as any)?.assignmentId;

  useEffect(() => {
    loadAssignments();
    if (initialAssignment) {
      setAssignmentId(initialAssignment);
    }
  }, []);

  const loadAssignments = async () => {
    try {
      setLoadingData(true);
      const response = await callApi({
        method: 'GET',
        url: '/accessories/assignments',
        params: {
          page: 1,
          limit: 1000,
          status: 'active', // Only active assignments
        },
      });
      const assignmentsList = response?.data || response || [];
      setAssignments(Array.isArray(assignmentsList) ? assignmentsList : []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      Alert.alert('Error', 'Failed to load assignments');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!assignmentId) newErrors.assignmentId = 'Assignment is required';
    if (!conditionOnReturn) newErrors.conditionOnReturn = 'Condition is required';

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

      const selectedAssignment = assignments.find(a => a._id === assignmentId);
      const payload: any = {
        assignmentId,
        conditionOnReturn,
      };

      if (conditionDescription.trim()) {
        payload.conditionDescription = conditionDescription.trim();
      }

      // If no assignmentId, use accessoryId
      if (!selectedAssignment) {
        payload.accessoryId = assignmentId;
        delete payload.assignmentId;
      }

      await callApi({
        method: 'POST',
        url: '/accessories/return',
        data: payload,
      });

      Alert.alert('Success', 'Accessory returned successfully', [
        {
          text: 'OK',
          onPress: () => {
            if (redirectTo) {
              (navigation as any).navigate(redirectTo);
            } else {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error returning accessory:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to return accessory');
    } finally {
      setSubmitting(false);
    }
  };

  const assignmentOptions = assignments.map((assignment) => ({
    label: `${assignment.accessory?.name || 'Unknown'} - ${assignment.employee?.firstName || ''} ${assignment.employee?.lastName || ''}`,
    value: assignment._id,
  }));

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading assignments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Return Accessory</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Assignment */}
          <DropdownField
            label="Assignment"
            required
            value={assignmentId}
            options={assignmentOptions}
            onSelect={(value) => {
              setAssignmentId(value);
              if (errors.assignmentId) setErrors({ ...errors, assignmentId: '' });
            }}
            placeholder="Select an option"
            error={errors.assignmentId}
          />

          {/* Condition on Return */}
          <DropdownField
            label="Condition on Return"
            required
            value={conditionOnReturn}
            options={conditionOptions}
            onSelect={(value) => {
              setConditionOnReturn(value);
              if (errors.conditionOnReturn) setErrors({ ...errors, conditionOnReturn: '' });
            }}
            placeholder="Select an option"
            error={errors.conditionOnReturn}
          />

          {/* Condition Description */}
          <FormField
            label="Condition Description (optional)"
            value={conditionDescription}
            onChangeText={(text) => setConditionDescription(text)}
            placeholder="Describe the condition of the accessory"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
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
            <Text style={styles.submitButtonText}>Return</Text>
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

