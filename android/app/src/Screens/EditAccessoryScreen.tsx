import React, { useEffect, useState } from 'react';
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
import FormField from '../components/task/FormField';
import DropdownField from '../components/task/DropdownField';

const conditionOptions = [
  { label: 'New', value: 'new' },
  { label: 'Good', value: 'good' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Lost', value: 'lost' },
];

const statusOptions = [
  { label: 'Available', value: 'available' },
  { label: 'In Use', value: 'in-use' },
  { label: 'Damaged', value: 'damaged' },
  { label: 'Lost', value: 'lost' },
];

interface Accessory {
  _id: string;
  name: string;
  category: string;
  description: string;
  condition: string;
  conditionDescription?: string;
  status: string;
}

export default function EditAccessoryScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { callApi } = useAxios();

  const accessoryId: string = route.params?.accessoryId;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string }[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [condition, setCondition] = useState('');
  const [conditionDescription, setConditionDescription] = useState('');
  const [status, setStatus] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!accessoryId) {
      Alert.alert('Error', 'Missing accessory id');
      navigation.goBack();
      return;
    }
    loadCategoriesAndAccessory();
  }, [accessoryId]);

  const loadCategoriesAndAccessory = async () => {
    try {
      setLoading(true);

      // Load categories
      const catRes = await callApi({ method: 'GET', url: '/accessories/categories' });
      const list: string[] = Array.isArray(catRes) ? catRes : catRes?.data || [];
      setCategoryOptions(
        list.map((c) => ({
          label: c,
          value: c,
        })),
      );

      // Load accessory
      const data: Accessory = await callApi({
        method: 'GET',
        url: `/accessories/${accessoryId}`,
      });

      setName(data.name || '');
      setCategory(data.category || '');
      setDescription(data.description || '');
      setCondition(data.condition || '');
      setConditionDescription(data.conditionDescription || '');
      setStatus(data.status || 'available');
    } catch (error) {
      console.error('Error loading accessory:', error);
      Alert.alert('Error', 'Failed to load accessory details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!category) newErrors.category = 'Category is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!condition) newErrors.condition = 'Condition is required';
    if (!status) newErrors.status = 'Status is required';

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

      // Enforce lost rule: if condition is "lost", status must be "lost"
      let effectiveStatus = status;
      if (condition === 'lost') {
        effectiveStatus = 'lost';
      }

      const payload = {
        name: name.trim(),
        category,
        description: description.trim(),
        condition,
        conditionDescription: conditionDescription.trim() || undefined,
        status: effectiveStatus,
      };

      await callApi({
        method: 'PUT',
        url: `/accessories/${accessoryId}`,
        data: payload,
      });

      Alert.alert('Success', 'Accessory updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error updating accessory:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update accessory');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading accessory...</Text>
      </View>
    );
  }

  // Status editable except when current status is "in-use" (per spec)
  const statusEditable = status !== 'in-use';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Accessory</Text>
          <Text style={styles.headerSubtitle}>Update accessory details and condition</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <FormField
            label="Name"
            required
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            placeholder="Accessory name"
            error={errors.name}
          />

          <DropdownField
            label="Category"
            required
            value={category}
            options={categoryOptions}
            onSelect={(value) => {
              setCategory(value);
              if (errors.category) setErrors({ ...errors, category: '' });
            }}
            placeholder="Select category"
            error={errors.category}
          />

          <DropdownField
            label="Condition"
            required
            value={condition}
            options={conditionOptions}
            onSelect={(value) => {
              setCondition(value);
              if (errors.condition) setErrors({ ...errors, condition: '' });
            }}
            placeholder="Select condition"
            error={errors.condition}
          />

          <DropdownField
            label="Status"
            required
            value={status}
            options={statusOptions}
            onSelect={(value) => {
              if (!statusEditable) return;
              setStatus(value);
              if (errors.status) setErrors({ ...errors, status: '' });
            }}
            placeholder="Select status"
            error={errors.status}
            disabled={!statusEditable}
          />

          <FormField
            label="Description"
            required
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            placeholder="Description of the accessory"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            error={errors.description}
          />

          <FormField
            label="Condition Description"
            value={conditionDescription}
            onChangeText={setConditionDescription}
            placeholder="Details about the condition"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitText}>Save Changes</Text>
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
    marginTop: 10,
    fontSize: 14,
    color: '#666',
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
    flexDirection: 'column',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    gap: 16,
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  cancelText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});










