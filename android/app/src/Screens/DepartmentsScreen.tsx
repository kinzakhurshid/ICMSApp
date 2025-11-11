import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import useAxios from '../hooks/useAxios';
import DepartmentEmployeeChart from '../components/DepartmentEmployeeChart';
import SalaryStatistics from '../components/SalaryStatistics';
import DepartmentTable from '../components/DepartmentTable';

interface EmployeeCount { department: string; employeeCount: number }
interface SalaryStat { department: string; totalSalary: number; employees?: number }

const DepartmentsScreen: React.FC = () => {
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={styles.header}>Department Management</Text>
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
  header: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  gridTwo: { flexDirection: 'column', gap: 12 },
});

export default DepartmentsScreen;


