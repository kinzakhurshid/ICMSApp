import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Platform, Modal, Pressable } from 'react-native';
import useAxios from '../hooks/useAxios';
import { useSelector } from 'react-redux';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Feather from 'react-native-vector-icons/Feather';

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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [iosPicker, setIosPicker] = useState<{ visible: boolean; type: 'start' | 'end'; value: Date }>({
    visible: false,
    type: 'start',
    value: new Date(),
  });
  const orgId = currentUser?.organization;

  useEffect(() => { (async () => {
    try { const list = await callApi({ method: 'GET', url: '/employee' }); setEmployees(list || []); } catch (e) {}
  })(); }, []);

  const fetchActivities = async (page = 1) => {
    try {
      const res = await callApi({
        method: 'GET',
        url: `/activities/org/${orgId}`,
        params: {
          page,
          limit: 10,
          employeeId: selectedEmployeeId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      setActivities(res?.activities || []); setTotal(res?.total || 0);
    } catch {}
  };

  const fetchToday = async () => {
    try {
      const today = new Date().toISOString().slice(0,10);
      const res = await callApi({
        method: 'GET',
        url: `/activities/org/${orgId}`,
        params: {
          date: today,
          limit: 1000,
          employeeId: selectedEmployeeId || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      });
      const totalToday = res?.total || 0;
      const active = new Set((res?.activities || []).map((a: Activity) => a.employee?._id)).size;
      setTodayStats({ totalToday, activeEmployeesToday: active });
    } catch {}
  };

  useEffect(() => { fetchActivities(); fetchToday(); }, [selectedEmployeeId, activeTab, startDate, endDate]);

  const openStartPicker = () => {
    const initial = startDate ? new Date(startDate) : new Date();
    if (Platform.OS === 'ios') {
      setIosPicker({ visible: true, type: 'start', value: initial });
    } else {
      setShowStartPicker(true);
    }
  };

  const openEndPicker = () => {
    const initial = endDate ? new Date(endDate) : new Date();
    if (Platform.OS === 'ios') {
      setIosPicker({ visible: true, type: 'end', value: initial });
    } else {
      setShowEndPicker(true);
    }
  };

  const cancelIosPicker = () => {
    setIosPicker(prev => ({ ...prev, visible: false }));
  };

  const applyIosPicker = () => {
    if (!iosPicker.visible) return;
    const iso = iosPicker.value.toISOString().slice(0, 10);
    if (iosPicker.type === 'start') {
      setStartDate(iso);
      if (endDate && new Date(iso) > new Date(endDate)) {
        setEndDate('');
      }
    } else {
      if (startDate && iosPicker.value < new Date(startDate)) {
        setStartDate('');
      }
      setEndDate(iso);
    }
    cancelIosPicker();
  };

  const clearDates = () => {
    setStartDate('');
    setEndDate('');
    setShowStartPicker(false);
    setShowEndPicker(false);
    cancelIosPicker();
  };

  const handleStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowStartPicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10);
      setStartDate(iso);
      if (endDate && selectedDate > new Date(endDate)) {
        setEndDate('');
      }
      if (Platform.OS === 'ios') {
        setShowStartPicker(false);
      }
    }
  };

  const handleEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowEndPicker(false);
    }
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10);
      setEndDate(iso);
      if (startDate && selectedDate < new Date(startDate)) {
        setStartDate('');
      }
      if (Platform.OS === 'ios') {
        setShowEndPicker(false);
      }
    }
  };

  const formatDisplayDate = (value: string) => {
    if (!value) return 'YYYY-MM-DD';
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  };

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

  const rangeSummary = () => {
    if (startDate && endDate) {
      return `Showing entries between ${formatDisplayDate(startDate)} and ${formatDisplayDate(endDate)}.`;
    }
    if (startDate) {
      return `Showing entries from ${formatDisplayDate(startDate)} onwards.`;
    }
    if (endDate) {
      return `Showing entries up to ${formatDisplayDate(endDate)}.`;
    }
    return 'No custom date range applied.';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.header}>Activities Overview</Text>
      <View style={styles.dateCardPlaceholder} />
      {showStartPicker && (
        <DateTimePicker
          value={startDate ? new Date(startDate) : new Date()}
          mode="date"
          display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
          onChange={handleStartDateChange}
          maximumDate={endDate ? new Date(endDate) : undefined}
        />
      )}
      {Platform.OS === 'ios' && iosPicker.visible && (
        <Modal transparent animationType="fade" visible={iosPicker.visible}>
          <View style={styles.modalRoot}>
            <Pressable style={styles.modalBackdrop} onPress={cancelIosPicker} />
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>
                {iosPicker.type === 'start' ? 'Select start date' : 'Select end date'}
              </Text>
              <DateTimePicker
                value={iosPicker.value}
                mode="date"
                display="spinner"
                onChange={(_, date) => {
                  if (date) {
                    setIosPicker(prev => ({ ...prev, value: date }));
                  }
                }}
                maximumDate={iosPicker.type === 'start' && endDate ? new Date(endDate) : undefined}
                minimumDate={iosPicker.type === 'end' && startDate ? new Date(startDate) : undefined}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={cancelIosPicker}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={applyIosPicker}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate ? new Date(endDate) : new Date()}
          mode="date"
          display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
          onChange={handleEndDateChange}
          minimumDate={startDate ? new Date(startDate) : undefined}
        />
      )}
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

      <View style={styles.dateCard}>
        <View style={styles.dateCardHeader}>
          <Text style={styles.dateCardTitle}>Date range</Text>
          <Text style={styles.dateCardSubtitle}>
            Refine the activity feed by selecting a custom start and end date.
          </Text>
        </View>
        <View style={styles.dateFilters}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <TouchableOpacity style={styles.dateTrigger} onPress={openStartPicker}>
                <Feather name="calendar" size={18} color="#FB923C" />
                <View style={styles.dateTriggerContent}>
                  <Text style={styles.dateInputLabel}>Start date</Text>
                  <Text style={[styles.dateValue, !startDate && styles.placeholderText]}>
                    {startDate ? formatDisplayDate(startDate) : 'Select date'}
                  </Text>
                </View>
                <Feather name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
            <View style={styles.dateArrow}>
              <Feather name="arrow-right" size={16} color="#9CA3AF" />
            </View>
            <View style={styles.dateField}>
              <TouchableOpacity style={styles.dateTrigger} onPress={openEndPicker}>
                <Feather name="calendar" size={18} color="#FB923C" />
                <View style={styles.dateTriggerContent}>
                  <Text style={styles.dateInputLabel}>End date</Text>
                  <Text style={[styles.dateValue, !endDate && styles.placeholderText]}>
                    {endDate ? formatDisplayDate(endDate) : 'Select date'}
                  </Text>
                </View>
                <Feather name="chevron-down" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.rangeSummary}>
            <Feather name="clock" size={16} color="#FB923C" />
            <Text style={styles.rangeSummaryText}>{rangeSummary()}</Text>
          </View>
        </View>
        <View style={styles.dateActions}>
          <TouchableOpacity style={styles.clearDateButton} onPress={clearDates}>
            <Feather name="rotate-ccw" size={16} color="#FB923C" />
            <Text style={styles.clearDateText}>Reset range</Text>
          </TouchableOpacity>
        </View>
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
                style={styles.shotDateInput}
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
  dateCardPlaceholder: { height: 8 },
  dateCard: {
    backgroundColor:'#fff',
    borderRadius:16,
    borderWidth:1,
    borderColor:'#E5E7EB',
    padding:16,
    marginBottom:16,
    shadowColor:'#00000010',
    shadowOpacity:0.08,
    shadowRadius:8,
    shadowOffset:{ width:0, height:4 },
    elevation:2,
  },
  dateCardHeader: {
    gap:6,
  },
  dateCardTitle: {
    fontSize:16,
    fontWeight:'700',
    color:'#111827',
    textTransform:'uppercase',
    letterSpacing:0.8,
  },
  dateCardSubtitle: {
    fontSize:12,
    color:'#6B7280',
  },
  dateFilters: {
    marginTop:16,
    gap:12,
  },
  filterHeading: {
    fontSize:13,
    fontWeight:'700',
    color:'#6B7280',
    textTransform:'uppercase',
    letterSpacing:0.6,
  },
  dateRow: {
    flexDirection:'row',
    gap:12,
    flexWrap:'wrap',
    marginTop:12,
  },
  dateArrow: {
    alignItems:'center',
    justifyContent:'center',
    paddingHorizontal:4,
  },
  dateField: { flex:1, minWidth:160 },
  dateTrigger: {
    flexDirection:'row',
    alignItems:'center',
    paddingHorizontal:14,
    paddingVertical:12,
    borderRadius:12,
    borderWidth:1,
    borderColor:'#E5E7EB',
    backgroundColor:'#F9FAFB',
    gap:12,
  },
  dateTriggerContent: {
    flex:1,
  },
  dateInputLabel: {
    fontSize:11,
    fontWeight:'600',
    color:'#9CA3AF',
    textTransform:'uppercase',
    marginBottom:2,
  },
  dateValue: {
    fontSize:15,
    fontWeight:'600',
    color:'#111827',
  },
  placeholderText: {
    color:'#9CA3AF',
  },
  rangeSummary: {
    marginTop:12,
    flexDirection:'row',
    alignItems:'center',
    gap:8,
    paddingHorizontal:14,
    paddingVertical:10,
    borderRadius:12,
    backgroundColor:'#FFF7ED',
    borderWidth:1,
    borderColor:'#FFE4D5',
  },
  rangeSummaryText: {
    flex:1,
    fontSize:13,
    color:'#7C2D12',
    fontWeight:'500',
  },
  dateActions: {
    flexDirection:'row',
    justifyContent:'flex-end',
    marginTop:16,
  },
  clearDateButton: {
    flexDirection:'row',
    alignItems:'center',
    gap:8,
    paddingHorizontal:16,
    paddingVertical:10,
    borderRadius:10,
    borderWidth:1,
    borderColor:'#FB923C',
    backgroundColor:'#FFF7ED',
  },
  clearDateText: { color:'#FB923C', fontWeight:'600' },
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
  shotDateInput: {
    flex:1,
    backgroundColor:'#F3F4F6',
    paddingHorizontal:12,
    paddingVertical:8,
    borderRadius:8,
    color:'#111827',
  },
  grid: { flexDirection:'row', flexWrap:'wrap', gap:12 },
  shotCard: { width:'48%', backgroundColor:'#000', borderRadius:12, overflow:'hidden', position:'relative' },
  shotImage: { height:160, width: '100%' },
  shotOverlay: { position:'absolute', left:8, bottom:8 },
  shotLabel: { backgroundColor:'rgba(0,0,0,0.7)', paddingHorizontal:8, paddingVertical:6, borderRadius:8 },
  shotLabelText: { color:'#fff', fontSize:12, fontWeight:'600' },
  shotLabelTime: { color:'#fff', fontSize:11, marginTop:2 },
  modalRoot: {
    flex:1,
    justifyContent:'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor:'rgba(17,24,39,0.45)',
  },
  modalContent: {
    backgroundColor:'#fff',
    paddingHorizontal:20,
    paddingTop:12,
    paddingBottom:20,
    borderTopLeftRadius:24,
    borderTopRightRadius:24,
    gap:12,
    zIndex:1,
    shadowColor:'#00000010',
    shadowOpacity:0.1,
    shadowRadius:12,
    shadowOffset:{ width:0, height:-2 },
  },
  modalHandle: {
    alignSelf:'center',
    width:48,
    height:4,
    borderRadius:999,
    backgroundColor:'#E5E7EB',
  },
  modalTitle: {
    fontSize:16,
    fontWeight:'600',
    color:'#111827',
    textAlign:'center',
  },
  modalActions: {
    flexDirection:'row',
    justifyContent:'space-between',
    gap:12,
    marginTop:8,
  },
  modalButton: {
    flex:1,
    paddingVertical:12,
    borderRadius:10,
    borderWidth:1,
    borderColor:'#E5E7EB',
    backgroundColor:'#fff',
    alignItems:'center',
  },
  modalButtonText: {
    fontSize:15,
    fontWeight:'600',
    color:'#374151',
  },
  modalButtonPrimary: {
    backgroundColor:'#FB923C',
    borderColor:'#FB923C',
  },
  modalButtonPrimaryText: {
    color:'#fff',
  },
});

export default OrgAdminActivitiesScreen;


