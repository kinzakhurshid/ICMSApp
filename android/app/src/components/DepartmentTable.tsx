import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAxios from '../hooks/useAxios';

type Dept = { _id: string; name: any; description?: any; admin?: any };

const DepartmentTable: React.FC = () => {
  const navigation = useNavigation();
  const { callApi } = useAxios();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => { (async () => {
    try { const res = await callApi({ method: 'GET', url: '/departments' }); setDepts(res || []); } catch {}
  })(); }, []);

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

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Departments</Text>
        <TextInput placeholder="Search..." placeholderTextColor="#9CA3AF" value={q} onChangeText={setQ} style={styles.search} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={{ minWidth: 700 }}>
          <View style={styles.thead}>
            <Text style={[styles.th, { width: 280 }]}>NAME</Text>
            <Text style={[styles.th, { width: 300 }]}>DESCRIPTION</Text>
            <Text style={[styles.th, { width: 120 }]}>ADMIN</Text>
          </View>
          {filtered.map(d => (
            <TouchableOpacity
              key={d._id}
              style={styles.tr}
              onPress={() => {
                (navigation as any).navigate('DepartmentDetail', { departmentId: d._id });
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.td, { width: 280 }]}>{safeText(d.name)}</Text>
              <Text style={[styles.td, { width: 300 }]}>{safeText(d.description)}</Text>
              <Text style={[styles.td, { width: 120 }]}>{adminLabel(d.admin)}</Text>
            </TouchableOpacity>
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
  tr: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingVertical: 12 },
  td: { color: '#374151', fontSize: 13 },
});

export default DepartmentTable;


