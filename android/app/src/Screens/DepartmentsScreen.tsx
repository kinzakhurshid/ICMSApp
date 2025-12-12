import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import useAxios from '../hooks/useAxios';
import DepartmentEmployeeChart from '../components/DepartmentEmployeeChart';
import SalaryStatistics from '../components/SalaryStatistics';
import DepartmentTable from '../components/DepartmentTable';

interface EmployeeCount { department: string; employeeCount: number }
interface SalaryStat { department: string; totalSalary: number; employees?: number }

const DepartmentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const [employeeCounts, setEmployeeCounts] = useState<EmployeeCount[]>([]);
  const [salaryStats, setSalaryStats] = useState<SalaryStat[]>([]);
  const fetchStats = async () => {
    try {
      const res = await callApi({ method: 'GET', url: '/departments/employeeCounts' });
      setEmployeeCounts(res?.employeeCounts || []);
      setSalaryStats(res?.salaryStats || []);
    } catch (e) {
      console.log('Dept stats error', e);
    }
  };
  useEffect(() => { fetchStats(); }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Department Management</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => (navigation as any).navigate('CreateDepartment')}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.gridTwo}>
        <DepartmentEmployeeChart data={employeeCounts.map(d => ({ name: d.department, employeeCount: d.employeeCount }))} />
        <SalaryStatistics data={salaryStats} />
      </View>
      <DepartmentTable />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  header: { fontSize: 22, fontWeight: '700', color: '#111827' },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FB923C',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  gridTwo: { flexDirection: 'column', gap: 12 },
});

export default DepartmentsScreen;


