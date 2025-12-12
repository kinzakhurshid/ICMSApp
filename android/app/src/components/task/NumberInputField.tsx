import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface NumberInputFieldProps {
  label: string;
  required?: boolean;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
}

export default function NumberInputField({
  label,
  required = false,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  error,
}: NumberInputFieldProps) {
  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleTextChange = (text: string) => {
    const numValue = parseInt(text, 10);
    if (!isNaN(numValue) && numValue >= min && (max === undefined || numValue <= max)) {
      onChange(numValue);
    } else if (text === '') {
      onChange(min);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={value.toString()}
          onChangeText={handleTextChange}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor="#9ca3af"
        />
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, value <= min && styles.controlButtonDisabled]}
            onPress={handleIncrement}
            disabled={max !== undefined && value >= max}
          >
            <Ionicons name="chevron-up" size={16} color={value <= min ? '#d1d5db' : '#6b7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, value <= min && styles.controlButtonDisabled]}
            onPress={handleDecrement}
            disabled={value <= min}
          >
            <Ionicons name="chevron-down" size={16} color={value <= min ? '#d1d5db' : '#6b7280'} />
          </TouchableOpacity>
        </View>
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
  required: {
    color: '#ef4444',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  controls: {
    flexDirection: 'column',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
  },
  controlButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
});


