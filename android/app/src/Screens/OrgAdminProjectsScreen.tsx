import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import ProjectKpiCard from '../components/ProjectKpiCard';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

const OrgAdminProjectsScreen: React.FC = () => {
  // Mock values; wire to API if needed using existing services
  const totalProjects = 14;
  const inProgress = 11;
  const highPriority = 3;
  const pending = 1;

  const kpiData = useMemo(() => ([
    { title: 'Total Projects', value: totalProjects, icon: 'grid-view', color: '#6b7280' },
    { title: 'Projects in Progress', value: inProgress, icon: 'settings', color: '#10b981' },
    { title: 'High Priority Tasks', value: highPriority, icon: 'inventory', color: '#65a30d' },
    { title: 'Pending Tasks', value: pending, icon: 'schedule', color: '#b45309' },
  ]), [totalProjects, inProgress, highPriority, pending]);

  const kpiScrollRef = useRef<ScrollView>(null);
  const horizontalPadding = 15; const gap = 12;
  const cardWidth = (width - horizontalPadding * 2 - gap) / 2; // 2 at once
  const step = cardWidth + gap;
  const onScroll = (e: any) => { (kpiScrollRef as any).current._scrollPos = e.nativeEvent.contentOffset.x; };
  const scrollBy = (dir: number) => {
    const current = (kpiScrollRef as any).current._scrollPos || 0;
    const next = Math.max(0, current + (dir > 0 ? step : -step));
    kpiScrollRef.current?.scrollTo({ x: next, animated: true });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Projects Overview</Text>
        <View style={styles.arrowRow}>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => scrollBy(-1)}><Text style={styles.arrowText}>{'<'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.arrowBtn} onPress={() => scrollBy(1)}><Text style={styles.arrowText}>{'>'}</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={kpiScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, gap }}
      >
        {kpiData.map(k => (
          <View key={k.title} style={{ width: cardWidth }}>
            <ProjectKpiCard title={k.title} value={k.value} icon={k.icon} color={k.color} />
          </View>
        ))}
      </ScrollView>

      {/* Project list header */}
      <View style={styles.listCard}>
        <Text style={styles.sectionTitle}>Project List</Text>
        <View style={styles.searchRow}>
          <TextInput placeholder="Search..." placeholderTextColor="#9CA3AF" style={styles.searchInput} />
          <TouchableOpacity style={styles.iconBtn}><MaterialIcons name="filter-list" size={20} color="#666" /></TouchableOpacity>
          <TouchableOpacity style={styles.exportBtn}><MaterialIcons name="download" size={16} color="#fff" /><Text style={styles.exportText}>Export All</Text></TouchableOpacity>
        </View>
        {/* Table header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.th,{flex:2}]}>PROJECT NAME</Text>
          <Text style={[styles.th,{flex:1}]}>START DATE</Text>
          <Text style={[styles.th,{flex:1}]}>END DATE</Text>
          <Text style={[styles.th,{flex:1}]}>STATUS</Text>
          <Text style={[styles.th,{flex:1}]}>PRIORITY</Text>
        </View>
        {/* Example row; replace with real data list if needed */}
        <View style={styles.tr}><Text style={[styles.td,{flex:2}]}>Performance Tracker</Text><Text style={[styles.td,{flex:1}]}>Aug 1, 2025</Text><Text style={[styles.td,{flex:1}]}>Nov 30, 2025</Text><View style={[styles.badge,{backgroundColor:'#fde68a'}]}><Text style={styles.badgeText}>In Progress</Text></View><View style={[styles.badge,{backgroundColor:'#fde68a'}]}><Text style={styles.badgeText}>Medium</Text></View></View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, marginTop: 10, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#1F2937' },
  arrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrowBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 16, color: '#6b7280' },
  listCard: { margin: 15, padding: 15, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: '#111827' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, color: '#111827' },
  iconBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', padding: 8, borderRadius: 8 },
  exportBtn: { backgroundColor: '#FF6B35', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  exportText: { color: '#fff', marginLeft: 6, fontWeight: '600', fontSize: 12 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingVertical: 10 },
  th: { fontSize: 12, color: '#374151', fontWeight: '700' },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 8 },
  td: { fontSize: 13, color: '#374151' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#111827' },
});

export default OrgAdminProjectsScreen;


