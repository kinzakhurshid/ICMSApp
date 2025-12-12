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
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import DocumentPicker from 'react-native-document-picker';
import useAxios from '../hooks/useAxios';

interface CreateQueryScreenProps {
  navigation: any;
}

const CreateQueryScreen: React.FC<CreateQueryScreenProps> = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handlePickFiles = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      setFiles(prev => [...prev, ...results]);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick files');
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

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
      // Create FormData for file upload
      const formData = new FormData();

      // Add text fields
      formData.append('subject', subject.trim());
      formData.append('description', description.trim());

      // Add files if any
      files.forEach((file, index) => {
        const fileData = {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || `file_${index}`,
        };
        formData.append('files', fileData as any);
      });

      const response = await callApi({
        method: 'POST',
        url: '/query',
        data: formData,
      });

      if (response?.success !== false) {
        Alert.alert('Success', 'Query submitted successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setSubject('');
              setDescription('');
              setFiles([]);
              // Navigate back
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert('Error', response?.message || 'Failed to submit query');
      }
    } catch (error: any) {
      console.error('Error submitting query:', error);
      Alert.alert('Error', error?.message || 'Failed to submit query. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.formCard}>
        <Text style={styles.title}>Lodge a Complaint / Query</Text>

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
            placeholder="Enter description"
            placeholderTextColor="#9CA3AF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={2000}
          />
        </View>

        {/* File Upload Area */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Attachments</Text>
          <TouchableOpacity style={styles.uploadArea} onPress={handlePickFiles}>
            <Ionicons name="cloud-upload-outline" size={32} color="#6B7280" />
            <Text style={styles.uploadText}>Add More File(s)</Text>
          </TouchableOpacity>

          {/* Selected Files List */}
          {files.length > 0 && (
            <View style={styles.filesList}>
              {files.map((file, index) => (
                <View key={index} style={styles.fileItem}>
                  <Ionicons name="document-outline" size={20} color="#3B82F6" />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name || `File ${index + 1}`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFile(index)}
                    style={styles.removeFileButton}
                  >
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
            <Text style={styles.submitButtonText}>Submit</Text>
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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 24,
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
  uploadArea: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    marginTop: 12,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filesList: {
    marginTop: 12,
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  removeFileButton: {
    padding: 4,
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

export default CreateQueryScreen;

