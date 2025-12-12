import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface DaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}

const DAYS = [
  { number: 1, label: '1' },
  { number: 2, label: '2' },
  { number: 3, label: '3' },
  { number: 4, label: '4' },
  { number: 5, label: '5' },
  { number: 6, label: '6' },
  { number: 7, label: '7' },
];

export default function DaySelector({ selectedDays, onChange }: DaySelectorProps) {
  const toggleDay = (dayNumber: number) => {
    if (selectedDays.includes(dayNumber)) {
      onChange(selectedDays.filter((d) => d !== dayNumber));
    } else {
      onChange([...selectedDays, dayNumber].sort());
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Days</Text>
      <View style={styles.daysContainer}>
        {DAYS.map((day) => {
          const isSelected = selectedDays.includes(day.number);
          return (
            <TouchableOpacity
              key={day.number}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}
              onPress={() => toggleDay(day.number)}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.helperText}>(1 = Monday, 7 = Sunday)</Text>
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
  daysContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dayButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  dayTextSelected: {
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});


