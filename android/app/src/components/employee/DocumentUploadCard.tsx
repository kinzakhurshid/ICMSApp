import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';

interface DocumentUploadCardProps {
  title: string;
  description?: string;
  value: { uri: string; name: string; type: string } | null;
  onChange: (file: { uri: string; name: string; type: string } | null) => void;
  maxSizeMB?: number;
}

export default function DocumentUploadCard({
  title,
  description = 'PDF or image. Max 50MB.',
  value,
  onChange,
  maxSizeMB = 50,
}: DocumentUploadCardProps) {
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.images,
        ],
      });

      if (result && result.length > 0) {
        const file = result[0];
        const fileSizeMB = (file.size || 0) / (1024 * 1024);

        if (fileSizeMB > maxSizeMB) {
          Alert.alert('Error', `File size exceeds ${maxSizeMB}MB limit`);
          return;
        }

        onChange({
          uri: file.uri,
          name: file.name || 'document',
          type: file.type || 'application/pdf',
        });
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="document-text" size={32} color="#6b7280" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {value ? (
        <View style={styles.fileInfo}>
          <View style={styles.fileDetails}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.fileName} numberOfLines={1}>
              {value.name}
            </Text>
          </View>
          <TouchableOpacity onPress={handleRemove}>
            <Ionicons name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={handlePickDocument}>
          <Ionicons name="cloud-upload-outline" size={24} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload file</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 180,
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  fileDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  fileName: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
  },
});


