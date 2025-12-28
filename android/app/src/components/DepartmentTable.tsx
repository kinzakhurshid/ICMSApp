import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import useAxios from '../hooks/useAxios';

type Dept = { _id: string; name: any; description?: any; admin?: any };

const DepartmentTable: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [q, setQ] = useState('');

  const fetchDepartments = async () => {
    try { 
      const res = await callApi({ method: 'GET', url: '/departments' }); 
      setDepts(res || []); 
    } catch (e) {
      console.log('Error fetching departments:', e);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);
  
  // Refresh departments when screen comes into focus (e.g., after creating a department)
  useFocusEffect(
    React.useCallback(() => {
      fetchDepartments();
    }, [])
  );

  const filtered = depts.filter(d => (d.name || '').toLowerCase().includes(q.toLowerCase()));

  const adminLabel = (admin: any): string => {
    if (!admin) return '-';
    if (typeof admin === 'string') return admin;
    if (typeof admin === 'object') {
      const firstLast = [admin.firstName, admin.lastName].filter(Boolean).join(' ');
      return firstLast || admin.name || admin.email || '-';
    }
    try { return String(admin); } catch { return '-'; }
  };

  const safeText = (val: any): string => {
    if (val == null) return '-';
    if (typeof val === 'string') return val;
    try { return String(val); } catch { return '-'; }
  };

  const handleEdit = (deptId: string) => {
    (navigation as any).navigate('EditDepartment', { departmentId: deptId });
  };

  const handleDelete = async (dept: Dept) => {
    Alert.alert(
      'Delete Department',
      `Are you sure you want to delete "${safeText(dept.name)}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await callApi({
                method: 'DELETE',
                url: `/departments/${dept._id}`,
              });

              if (response?.success !== false) {
                Alert.alert('Success', 'Department deleted successfully');
                fetchDepartments(); // Refresh the list
              } else {
                Alert.alert('Error', response?.message || 'Failed to delete department');
              }
            } catch (error: any) {
              console.error('Error deleting department:', error);
              Alert.alert('Error', error?.response?.data?.error || error?.message || 'Failed to delete department');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Departments</Text>
        <TextInput placeholder="Search..." placeholderTextColor="#9CA3AF" value={q} onChangeText={setQ} style={styles.search} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={{ minWidth: 800 }}>
          <View style={styles.thead}>
            <Text style={[styles.th, { width: 200 }]}>NAME</Text>
            <Text style={[styles.th, { width: 250 }]}>DESCRIPTION</Text>
            <Text style={[styles.th, { width: 150 }]}>ADMIN</Text>
            <Text style={[styles.th, { width: 100 }]}>ACTIONS</Text>
          </View>
          {filtered.map(d => (
            <View key={d._id} style={styles.tr}>
              <TouchableOpacity
                style={[styles.tdContainer, { width: 200 }]}
                onPress={() => {
                  (navigation as any).navigate('DepartmentDetail', { departmentId: d._id });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.td}>{safeText(d.name)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tdContainer, { width: 250 }]}
                onPress={() => {
                  (navigation as any).navigate('DepartmentDetail', { departmentId: d._id });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.td}>{safeText(d.description)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tdContainer, { width: 150 }]}
                onPress={() => {
                  (navigation as any).navigate('DepartmentDetail', { departmentId: d._id });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.td}>{adminLabel(d.admin)}</Text>
              </TouchableOpacity>
              <View style={[styles.actionsContainer, { width: 100 }]}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(d._id)}
                >
                  <Icon name="edit" size={16} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(d)}
                >
                  <Icon name="delete" size={16} color="#F44336" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee', marginTop: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  search: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, width: 200, color: '#111827' },
  thead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 10 },
  th: { color: '#374151', fontWeight: '700', fontSize: 12 },
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 12, alignItems: 'center' },
  tdContainer: { justifyContent: 'center', paddingHorizontal: 8 },
  td: { color: '#374151', fontSize: 13 },
  actionsContainer: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
  actionButton: { padding: 4 },
});

export default DepartmentTable;


