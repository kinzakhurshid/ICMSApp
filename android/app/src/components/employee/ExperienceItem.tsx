import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FormField from '../task/FormField';
import DropdownField from '../task/DropdownField';
import DatePickerField from '../task/DatePickerField';

export interface Experience {
  position: string;
  company: string;
  jobType: string;
  startDate: Date | null;
  endDate: Date | null;
  isCurrent: boolean;
  description: string;
}

interface ExperienceItemProps {
  experience: Experience;
  index: number;
  onChange: (experience: Experience) => void;
  onRemove: () => void;
  jobTypeOptions: Array<{ label: string; value: string }>;
}

export default function ExperienceItem({
  experience,
  index,
  onChange,
  onRemove,
  jobTypeOptions,
}: ExperienceItemProps) {
  const updateField = (field: keyof Experience, value: any) => {
    onChange({ ...experience, [field]: value });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Experience {index + 1}</Text>
        <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
          <Ionicons name="close-circle" size={24} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <FormField
            label="Position"
            required
            value={experience.position}
            onChangeText={(text) => updateField('position', text)}
            placeholder="Enter position"
          />
        </View>
        <View style={styles.column}>
          <FormField
            label="Company"
            required
            value={experience.company}
            onChangeText={(text) => updateField('company', text)}
            placeholder="Enter company"
          />
        </View>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <DropdownField
            label="Job Type"
            required
            value={experience.jobType}
            options={jobTypeOptions}
            onSelect={(value) => updateField('jobType', value)}
            placeholder="Select job type"
          />
        </View>
        <View style={styles.column}>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => updateField('isCurrent', !experience.isCurrent)}
            >
              {experience.isCurrent && (
                <Ionicons name="checkmark" size={20} color="#f97316" />
              )}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>I currently work here</Text>
          </View>
        </View>
      </View>

      <View style={styles.twoColumn}>
        <View style={styles.column}>
          <DatePickerField
            label="Start Date"
            required
            value={experience.startDate}
            onChange={(date) => updateField('startDate', date)}
          />
        </View>
        <View style={styles.column}>
          <DatePickerField
            label="End Date"
            value={experience.isCurrent ? null : experience.endDate}
            onChange={(date) => updateField('endDate', date)}
            disabled={experience.isCurrent}
            minimumDate={experience.startDate || undefined}
          />
        </View>
      </View>

      <FormField
        label="Description"
        value={experience.description}
        onChangeText={(text) => updateField('description', text)}
        placeholder="Describe your responsibilities"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  removeButton: {
    padding: 4,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#374151',
  },
});


