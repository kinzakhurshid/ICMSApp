import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  required?: boolean;
}

export default function FormSection({ title, children, required = false }: FormSectionProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {title}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 16,
  },
  required: {
    color: '#ef4444',
  },
});


