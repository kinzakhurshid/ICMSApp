import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';

type Employee = { _id: string; firstName: string; lastName: string };
type Activity = { _id: string; type: string; status: string; createdAt: string; employee: { _id: string; firstName: string; lastName: string } };

const OrgAdminActivitiesScreen: React.FC = () => {
  const { callApi } = useAxios();
  const currentUser = useSelector((s: any) => s.user.currentUser);
  const [activeTab, setActiveTab] = useState<'overview'|'activities'|'screenshots'>('overview');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [todayStats, setTodayStats] = useState({ totalToday: 0, activeEmployeesToday: 0 });
  // Screenshots state
  const [shots, setShots] = useState<Array<{ _id: string; url: string; appName?: string; timestamp: string }>>([]);
  const [shotDate, setShotDate] = useState<string>(new Date().toISOString().slice(0,10));
  const [shotApp, setShotApp] = useState<string>('all');
  const [shotPage, setShotPage] = useState<number>(1);
  const [shotTotalPages, setShotTotalPages] = useState<number>(1);
  const orgId = currentUser?.organization;

  useEffect(() => { (async () => {
    try { const list = await callApi({ method: 'GET', url: '/employee' }); setEmployees(list || []); } catch (e) {}
  })(); }, []);

  const fetchActivities = async (page = 1) => {
    try {
      const res = await callApi({ method: 'GET', url: `/activities/org/${orgId}`, params: { page, limit: 10, employeeId: selectedEmployeeId || undefined } });
      setActivities(res?.activities || []); setTotal(res?.total || 0);
    } catch {}
  };

  const fetchToday = async () => {
    try {
      const today = new Date().toISOString().slice(0,10);
      const res = await callApi({ method: 'GET', url: `/activities/org/${orgId}`, params: { date: today, limit: 1000, employeeId: selectedEmployeeId || undefined } });
      const totalToday = res?.total || 0;
      const active = new Set((res?.activities || []).map((a: Activity) => a.employee?._id)).size;
      setTodayStats({ totalToday, activeEmployeesToday: active });
    } catch {}
  };

  useEffect(() => { fetchActivities(); fetchToday(); }, [selectedEmployeeId, activeTab]);

  // Fetch screenshots - adjust endpoint if your API differs
  const fetchScreenshots = async (page = 1) => {
    try {
      const res = await callApi({ method: 'GET', url: `/activities/org/${orgId}`, params: { page, limit: 12, employeeId: selectedEmployeeId || undefined, hasScreenshot: 'true', date: shotDate || undefined, appName: shotApp === 'all' ? undefined : shotApp } });
      const list = res?.activities || [];
      const normalized = list.map((s: any) => ({ _id: s._id, url: s.screenshot, appName: s.appName, timestamp: s.timestamp || s.createdAt }));
      if (page === 1) setShots(normalized); else setShots(prev => [...prev, ...normalized]);
      const total = res?.total || normalized.length;
      const totalPages = Math.max(1, Math.ceil(total / 12));
      setShotPage(page);
      setShotTotalPages(totalPages);
    } catch (e) {
      if (page === 1) setShots([]);
    }
  };

  useEffect(() => { if (activeTab==='screenshots') fetchScreenshots(1); }, [activeTab, shotDate, shotApp, selectedEmployeeId]);

  const productivity = employees.length ? Math.round((todayStats.activeEmployeesToday / employees.length) * 100) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.header}>Activities Overview</Text>
      {/* Employee selector */}
      <View style={styles.selectorRow}>
        <Text style={styles.selectorLabel}>Select Employee</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity style={[styles.chip, !selectedEmployeeId && styles.chipActive]} onPress={() => setSelectedEmployeeId('')}>
            <Text style={[styles.chipText, !selectedEmployeeId && styles.chipTextActive]}>All Employees</Text>
          </TouchableOpacity>
          {employees.map(e => (
            <TouchableOpacity key={e._id} style={[styles.chip, selectedEmployeeId===e._id && styles.chipActive]} onPress={() => setSelectedEmployeeId(e._id)}>
              <Text style={[styles.chipText, selectedEmployeeId===e._id && styles.chipTextActive]}>{e.firstName} {e.lastName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Summary cards */}
      <View style={styles.kpiRow}>
        <View style={styles.card}><Text style={styles.cardLabel}>Activities Today</Text><Text style={styles.cardValue}>{todayStats.totalToday}</Text><Text style={styles.cardHint}>Real-time count</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Total Activities</Text><Text style={styles.cardValue}>{total}</Text><Text style={styles.cardHint}>All time</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Active Employees</Text><Text style={styles.cardValue}>{todayStats.activeEmployeesToday}</Text><Text style={styles.cardHint}>Today</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Productivity Rate</Text><Text style={styles.cardValue}>{productivity}%</Text><View style={styles.barBg}><View style={[styles.barFill,{ width: `${productivity}%`}]} /></View></View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['overview','activities','screenshots'].map(t => (
          <TouchableOpacity key={t} style={[styles.tabBtn, activeTab===t && styles.tabActive]} onPress={() => setActiveTab(t as any)}>
            <Text style={[styles.tabText, activeTab===t && styles.tabTextActive]}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.panel}>
        {activeTab==='overview' && (
          <Text style={{ color:'#6b7280' }}>Select an employee to view detailed metrics.</Text>
        )}
        {activeTab==='activities' && (
          <>
            <View style={styles.tableHeader}><Text style={[styles.th,{flex:2}]}>EMPLOYEE</Text><Text style={[styles.th,{flex:1}]}>TYPE</Text><Text style={[styles.th,{flex:1}]}>STATUS</Text><Text style={[styles.th,{flex:1}]}>DATE</Text></View>
            {activities.map((a) => (
              <View key={a._id} style={styles.tr}><Text style={[styles.td,{flex:2}]}>{a.employee?.firstName} {a.employee?.lastName}</Text><Text style={[styles.td,{flex:1}]}>{a.type}</Text><Text style={[styles.td,{flex:1}]}>{a.status}</Text><Text style={[styles.td,{flex:1}]}>{new Date(a.createdAt).toLocaleString()}</Text></View>
            ))}
          </>
        )}
        {activeTab==='screenshots' && (
          <>
            {/* Filters row (date + app) */}
            <View style={styles.shotFilters}>
              <TextInput
                style={styles.dateInput}
                value={shotDate}
                onChangeText={setShotDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {['all','Slack','Chrome','UnrealEditor','VSCode'].map(app => (
                  <TouchableOpacity key={app} style={[styles.chip, shotApp===app && styles.chipActive]} onPress={() => setShotApp(app)}>
                    <Text style={[styles.chipText, shotApp===app && styles.chipTextActive]}>{app === 'all' ? 'All Applications' : app}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {/* Grid */}
            <View style={styles.grid}> 
              {shots.map(s => (
                <View key={s._id} style={styles.shotCard}>
                  {s.url ? (
                    <Image source={{ uri: s.url }} style={styles.shotImage} resizeMode='cover' />
                  ) : (
                    <View style={[styles.shotImage,{ backgroundColor:'#111' }]} />
                  )}
                  <View style={styles.shotOverlay}>
                    <View style={styles.shotLabel}><Text style={styles.shotLabelText}>{s.appName || 'App'}</Text><Text style={styles.shotLabelTime}>{new Date(s.timestamp).toLocaleString()}</Text></View>
                  </View>
                </View>
              ))}
              {shots.length === 0 && (
                <Text style={{ color:'#6b7280' }}>No screenshots found for selected filters.</Text>
              )}
            </View>
            {shotPage < shotTotalPages && (
              <View style={{ alignItems:'center', marginTop:12 }}>
                <TouchableOpacity onPress={() => fetchScreenshots(shotPage+1)} style={{ backgroundColor:'#f97316', paddingHorizontal:14, paddingVertical:8, borderRadius:8 }}>
                  <Text style={{ color:'#fff', fontWeight:'600' }}>Load More</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  header: { fontSize: 22, fontWeight:'700', color:'#111827', marginBottom: 10 },
  selectorRow: { backgroundColor:'#fff', borderRadius:12, borderWidth:1, borderColor:'#eee', padding:12, marginBottom:12 },
  selectorLabel: { color:'#ea580c', fontWeight:'600', marginBottom:8 },
  chip: { paddingHorizontal:10, paddingVertical:6, borderRadius:999, backgroundColor:'#F3F4F6' },
  chipActive: { backgroundColor:'rgba(255,87,34,0.12)' },
  chipText: { color:'#6b7280' },
  chipTextActive: { color:'#111827', fontWeight:'700' },
  kpiRow: { flexDirection:'row', flexWrap:'wrap', gap:12, marginBottom:12 },
  card: { flex:1, minWidth:'48%', backgroundColor:'#fff', borderRadius:12, padding:12, borderWidth:1, borderColor:'#eee' },
  cardLabel: { color:'#ea580c' },
  cardValue: { fontSize:22, fontWeight:'800', color:'#111827', marginTop:4 },
  cardHint: { color:'#6b7280', fontSize:12, marginTop:2 },
  barBg: { height:6, backgroundColor:'#E5E7EB', borderRadius:999, marginTop:8 },
  barFill: { height:'100%', backgroundColor:'#f97316', borderRadius:999 },
  tabRow: { flexDirection:'row', borderBottomWidth:1, borderBottomColor:'#E5E7EB', marginBottom:10 },
  tabBtn: { paddingHorizontal:12, paddingVertical:8 },
  tabActive: { borderBottomWidth:2, borderBottomColor:'#f97316' },
  tabText: { color:'#6b7280', fontWeight:'600' },
  tabTextActive: { color:'#111827' },
  panel: { backgroundColor:'#fff', borderRadius:12, borderWidth:1, borderColor:'#eee', padding:12 },
  tableHeader: { flexDirection:'row', borderBottomWidth:1, borderBottomColor:'#E5E7EB', paddingVertical:10 },
  th: { fontSize:12, color:'#374151', fontWeight:'700' },
  tr: { flexDirection:'row', paddingVertical:12, borderBottomWidth:1, borderBottomColor:'#F3F4F6' },
  td: { fontSize:13, color:'#374151' },
  // Screenshots
  shotFilters: { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 },
  dateInput: { flex:1, backgroundColor:'#F3F4F6', paddingHorizontal:12, paddingVertical:8, borderRadius:8, color:'#111827' },
  grid: { flexDirection:'row', flexWrap:'wrap', gap:12 },
  shotCard: { width:'48%', backgroundColor:'#000', borderRadius:12, overflow:'hidden', position:'relative' },
  shotImage: { height:160, width: '100%' },
  shotOverlay: { position:'absolute', left:8, bottom:8 },
  shotLabel: { backgroundColor:'rgba(0,0,0,0.7)', paddingHorizontal:8, paddingVertical:6, borderRadius:8 },
  shotLabelText: { color:'#fff', fontSize:12, fontWeight:'600' },
  shotLabelTime: { color:'#fff', fontSize:11, marginTop:2 },
});

export default OrgAdminActivitiesScreen;


