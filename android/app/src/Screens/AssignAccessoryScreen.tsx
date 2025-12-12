import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import useAxios from '../hooks/useAxios';
import DropdownField from '../components/task/DropdownField';
import DatePickerField from '../components/task/DatePickerField';

interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
}

interface Accessory {
  _id: string;
  name: string;
  category: string;
  condition: string;
  status: string;
}

const conditionOptions = [
  { label: 'New', value: 'new' },
  { label: 'Good', value: 'good' },
  { label: 'Damaged', value: 'damaged' },
];

export default function AssignAccessoryScreen() {
  const navigation = useNavigation();
  const { callApi } = useAxios();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [employeeId, setEmployeeId] = useState('');
  const [accessoryId, setAccessoryId] = useState('');
  const [issuedDate, setIssuedDate] = useState<Date | null>(null);
  const [conditionOnAssignment, setConditionOnAssignment] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      // Load employees
      const employeesRes = await callApi({
        method: 'GET',
        url: '/employee',
      });
      const employeesList = Array.isArray(employeesRes) ? employeesRes : employeesRes.data || [];
      setEmployees(employeesList.map((emp: Employee) => ({
        ...emp,
        fullName: emp.fullName || `${emp.firstName} ${emp.lastName}`,
      })));

      // Load available accessories
      const accessoriesRes = await callApi({
        method: 'GET',
        url: '/accessories',
        params: {
          page: 1,
          limit: 1000,
          status: 'available',
        },
      });
      const accessoriesList = accessoriesRes?.data || accessoriesRes || [];
      setAccessories(Array.isArray(accessoriesList) ? accessoriesList : []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load employees or accessories');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!employeeId) newErrors.employeeId = 'Employee is required';
    if (!accessoryId) newErrors.accessoryId = 'Accessory is required';
    if (!issuedDate) newErrors.issuedDate = 'Issued date is required';
    if (!conditionOnAssignment) newErrors.conditionOnAssignment = 'Condition is required';

    // Check if accessory is available
    const selectedAccessory = accessories.find(a => a._id === accessoryId);
    if (selectedAccessory && selectedAccessory.status !== 'available') {
      newErrors.accessoryId = 'Selected accessory is not available';
    }

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

      const payload = {
        accessoryId,
        employee: employeeId,
        issuedDate: issuedDate!.toISOString().split('T')[0],
        conditionOnAssignment,
      };

      await callApi({
        method: 'POST',
        url: '/accessories/assign',
        data: payload,
      });

      Alert.alert('Success', 'Accessory assigned successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error assigning accessory:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to assign accessory');
    } finally {
      setSubmitting(false);
    }
  };

  const employeeOptions = employees.map((emp) => ({
    label: emp.fullName || `${emp.firstName} ${emp.lastName}`,
    value: emp._id,
  }));

  const accessoryOptions = accessories
    .filter(a => a.status === 'available')
    .map((acc) => ({
      label: `${acc.name} (${acc.category})`,
      value: acc._id,
    }));

  if (loadingData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Assign Accessory</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Employee */}
          <DropdownField
            label="Employee"
            required
            value={employeeId}
            options={employeeOptions}
            onSelect={(value) => {
              setEmployeeId(value);
              if (errors.employeeId) setErrors({ ...errors, employeeId: '' });
            }}
            placeholder="Select an option"
            error={errors.employeeId}
          />

          {/* Accessory */}
          <DropdownField
            label="Accessory"
            required
            value={accessoryId}
            options={accessoryOptions}
            onSelect={(value) => {
              setAccessoryId(value);
              if (errors.accessoryId) setErrors({ ...errors, accessoryId: '' });
            }}
            placeholder="Select an option"
            error={errors.accessoryId}
          />

          {/* Issued Date and Condition */}
          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <DatePickerField
                label="Issued Date"
                required
                value={issuedDate}
                onChange={(selectedDate) => {
                  setIssuedDate(selectedDate);
                  if (errors.issuedDate) setErrors({ ...errors, issuedDate: '' });
                }}
                error={errors.issuedDate}
              />
            </View>
            <View style={styles.column}>
              <DropdownField
                label="Condition on Assignment"
                required
                value={conditionOnAssignment}
                options={conditionOptions}
                onSelect={(value) => {
                  setConditionOnAssignment(value);
                  if (errors.conditionOnAssignment) setErrors({ ...errors, conditionOnAssignment: '' });
                }}
                placeholder="Select an option"
                error={errors.conditionOnAssignment}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Assign</Text>
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
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  column: {
    flex: 1,
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  submitButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f97316',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

