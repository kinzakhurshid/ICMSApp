import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import useAxios from '../hooks/useAxios'; // Adjust path as needed

export default function EmployeeProfileScreen({ employeeId }) {
  const { callApi } = useAxios();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await callApi({
          method: "GET",
          url: `/employee/${employeeId}`,
        });
        setEmployee(response.data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#f97316" /></View>;
  if (error || !employee) return <View style={styles.centered}><Text>{error || 'Profile not found'}</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.avatarSection}>
        {employee.profileImage ? (
          <Image source={{ uri: employee.profileImage }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{employee.firstName[0]}</Text>
          </View>
        )}
        <Text style={styles.name}>{employee.firstName} {employee.lastName}</Text>
        <Text style={styles.email}>{employee.email}</Text>
        <Text style={styles.roleTag}>{employee.role}</Text>
      </View>
      <View style={styles.detailSection}>
        <DetailRow label="Department" value={employee.department} />
        <DetailRow label="Position" value={employee.position} />
        <DetailRow label="Contact Number" value={employee.contactNumber} />
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarPlaceholder: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 16, color: '#666', marginBottom: 4 },
  roleTag: { fontSize: 14, padding: 6, backgroundColor: '#fef3c7', color: '#b45309', borderRadius: 8 },
  detailSection: { marginTop: 10 },
  detailRow: { flexDirection: 'row', marginBottom: 10 },
  detailLabel: { fontWeight: 'bold', width: 120, color: '#555' },
  detailValue: { color: '#333' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});