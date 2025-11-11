import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type Props = { title: string; value: number | string; icon: string; color?: string };

const ProjectKpiCard: React.FC<Props> = ({ title, value, icon, color = '#4b5563' }) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap,{ backgroundColor: 'rgba(255,87,34,0.1)'}]}>
        <MaterialIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{String(value).padStart(2,'0')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  iconWrap: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  title: { color: '#6b7280', fontSize: 13, marginBottom: 8 },
  value: { color: '#111827', fontSize: 22, fontWeight: '800' },
});

export default ProjectKpiCard;








