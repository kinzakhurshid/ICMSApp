import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';

interface FileUploadFieldProps {
  label: string;
  value?: { uri: string; name: string; type: string } | null;
  onChange: (file: { uri: string; name: string; type: string } | null) => void;
  error?: string;
}

export default function FileUploadField({
  label,
  value,
  onChange,
  error,
}: FileUploadFieldProps) {
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      if (result && result.length > 0) {
        const file = result[0];
        onChange({
          uri: file.uri,
          name: file.name || 'file',
          type: file.type || 'application/octet-stream',
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
      <Text style={styles.label}>{label}</Text>
      {value ? (
        <View style={styles.fileContainer}>
          <View style={styles.fileInfo}>
            <Ionicons name="document-text" size={24} color="#6b7280" />
            <Text style={styles.fileName} numberOfLines={1}>
              {value.name}
            </Text>
          </View>
          <TouchableOpacity onPress={handleRemove}>
            <Ionicons name="close-circle" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, error && styles.uploadButtonError]}
          onPress={handlePickDocument}
        >
          <Ionicons name="cloud-upload-outline" size={32} color="#6b7280" />
          <Text style={styles.uploadText}>Click to Upload File</Text>
        </TouchableOpacity>
      )}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  uploadButtonError: {
    borderColor: '#ef4444',
  },
  uploadText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileName: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});


