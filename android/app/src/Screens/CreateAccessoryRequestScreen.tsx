import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';

interface CreateAccessoryRequestScreenProps {
  navigation: any;
}

const CreateAccessoryRequestScreen: React.FC<CreateAccessoryRequestScreenProps> = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Subject is required');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Description is required');
      return;
    }

    setSubmitting(true);

    try {
      console.log('🔶 [CreateAccessoryRequest] Submitting accessory request');

      const response = await callApi({
        method: 'POST',
        url: '/accessory-requests',
        data: {
          subject: subject.trim(),
          description: description.trim(),
        },
      });

      console.log('✅ [CreateAccessoryRequest] Response:', response);

      if (response?.success !== false) {
        Alert.alert('Success', 'Accessory request submitted successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSubject('');
              setDescription('');
              // Navigate back
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response?.message || 'Failed to submit accessory request');
      }
    } catch (error: any) {
      console.error('🔴 [CreateAccessoryRequest] Error submitting accessory request:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          error?.message ||
          'Failed to submit accessory request. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Create New Accessory Request</Text>
            <Text style={styles.subtitle}>Add a new accessory request</Text>
          </View>
        </View>

        {/* Subject Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter subject"
            placeholderTextColor="#9CA3AF"
            value={subject}
            onChangeText={setSubject}
            maxLength={200}
          />
        </View>

        {/* Description Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Explain the issue or request"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Create Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 10,
  },
  submitButton: {
    backgroundColor: '#FB923C',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateAccessoryRequestScreen;








