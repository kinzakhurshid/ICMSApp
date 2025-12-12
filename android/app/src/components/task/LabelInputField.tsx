import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface LabelInputFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  error?: string;
}

export default function LabelInputField({ label, values, onChange, error }: LabelInputFieldProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddLabel = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onChange([...values, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    onChange(values.filter((l) => l !== labelToRemove));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      {values.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.labelsContainer}>
          {values.map((labelValue, index) => (
            <View key={index} style={styles.labelTag}>
              <Text style={styles.labelTagText}>{labelValue}</Text>
              <TouchableOpacity onPress={() => handleRemoveLabel(labelValue)}>
                <Ionicons name="close-circle" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="Add label"
          placeholderTextColor="#9ca3af"
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={handleAddLabel}
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddLabel}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
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
  labelsContainer: {
    marginBottom: 8,
  },
  labelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    gap: 6,
  },
  labelTagText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});


