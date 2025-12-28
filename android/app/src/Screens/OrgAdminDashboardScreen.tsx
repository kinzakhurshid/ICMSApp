import React, { useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DashboardStatCard from '../components/DashboardStatCard';
import MyTeamsCard from '../components/MyTeamsCard';
import EmployeeStructureChart from '../components/EmployeeStructureChart';
import EmployeeTable from '../components/EmployeeTable';
import DonutChart from '../components/DonutChart';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import { useOrgAdminData } from '../hooks/useOrgAdminData';

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};
const monthEnd = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
};

const OrgAdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const employeeTableRef = useRef<View>(null);
  const userState = useSelector((state: RootState) => state.user);
  const currentUser: any = userState.currentUser || (userState as any);
  const token = userState.token || (currentUser?.token as string);
  const orgId = currentUser?.organization as string;

  const { pmStats, hrStats, orgStats, payroll, loading, error } = useOrgAdminData(
    orgId || '',
    token || '',
    monthStart(),
    monthEnd()
  );

  if (loading) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator size="large" color="#FF5722" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}> 
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView ref={scrollViewRef} style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.heading}>Org Admin Dashboard</Text>

      {/* HR Summary Cards (web-like) */}
      <View style={styles.cardRow}>
        {hrStats?.summaryCards?.map((c) => {
          // Determine if it's an increase or decrease
          const delta = typeof c.delta === 'number' && !isNaN(c.delta) ? c.delta : 0;
          const isIncrease = delta >= 0;
          const arrow = isIncrease ? '↑' : '↓';
          const deltaValue = Math.abs(delta);
          
          // Format percent to avoid NaN
          const percentValue = c.percent && !isNaN(parseFloat(String(c.percent).replace('%',''))) 
            ? c.percent 
            : undefined;
          
          // Only show subtitleLeft if delta is a valid number
          const subtitleLeftValue = delta !== 0 && !isNaN(deltaValue) 
            ? `${arrow} ${deltaValue}%` 
            : undefined;
          
          return (
            <DashboardStatCard
              key={c.title}
              title={c.title}
              value={c.value}
              subtitleLeft={subtitleLeftValue}
              subtitleRight={percentValue}
              iconName={iconForCard(c.title)}
              rightHint={c.path?.includes('Oct') ? 'October' : undefined}
              onPress={() => {
                // Navigate to respective section based on card title
                const titleLower = c.title.toLowerCase();
                if (titleLower.includes('employee')) {
                  // Scroll to employee table section
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                } else if (titleLower.includes('attendance')) {
                  // Navigate to attendance screen if available
                  try {
                    (navigation as any).navigate('HRAttendance');
                  } catch (e) {
                    console.log('Attendance screen not available');
                  }
                } else if (titleLower.includes('payroll')) {
                  // Navigate to payroll screen
                  try {
                    (navigation as any).navigate('PayrollScreen');
                  } catch (e) {
                    console.log('Payroll screen not available', e);
                  }
                } else if (titleLower.includes('project')) {
                  // Navigate to projects screen
                  try {
                    (navigation as any).navigate('OrgProjects');
                  } catch (e) {
                    console.log('Projects screen not available', e);
                  }
                }
              }}
            />
          );
        })}
      </View>

      {/* PM Overview */}
      {pmStats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Projects Overview</Text>
          <View style={styles.gridTwo}>
            <DashboardStatCard title="Total Projects" value={pmStats.totalProjects} />
            <DashboardStatCard title="Projects in Progress" value={pmStats.projectsInProgress} />
            <DashboardStatCard title="High Priority Projects" value={pmStats.highPriorityProjects} />
            <DashboardStatCard title="Pending Tasks" value={pmStats.pendingTasks} />
          </View>
        </View>
      )}

      {/* Org Tasks & Projects (pie charts) */}
      {orgStats && (
        <>
          <DonutChart
            title="Task Activities"
            centerTop={`${Math.round(orgStats.tasks?.completionRate || 0)}%`}
            centerBottom="Completion"
            segments={[
              { label: 'Completed', value: orgStats.tasks?.completed || 0, color: '#22C55E' },
              { label: 'In Progress', value: orgStats.tasks?.status?.in_progress || 0, color: '#F59E0B' },
              { label: 'In Review', value: orgStats.tasks?.status?.in_review || 0, color: '#3B82F6' },
              { label: 'Blocked', value: orgStats.tasks?.status?.blocked || 0, color: '#EF4444' },
              { label: 'Pending', value: orgStats.tasks?.status?.todo || 0, color: '#9CA3AF' },
            ]}
          />

          <DonutChart
            title="Projects Overview"
            segments={Object.entries(orgStats.projects || {}).map(([label, value]) => ({
              label,
              value: Number(value) || 0,
              color: projectColor(label),
            }))}
          />
        </>
      )}

      {/* My Teams */}
      <View style={styles.section}>
        <MyTeamsCard />
      </View>

      {/* Employee Structure */}
      {hrStats?.genderStats ? (
        <EmployeeStructureChart
          male={hrStats.genderStats.male}
          female={hrStats.genderStats.female}
          other={hrStats.genderStats.other}
        />
      ) : (
        <View style={styles.section}><Text style={styles.sectionTitle}>Employee Structure</Text><Text>—</Text></View>
      )}

      {/* Employees Table (replaces calendar and payroll sections) */}
      <View ref={employeeTableRef}>
        <EmployeeTable />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridTwo: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  section: { marginTop: 16, padding: 12, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  error: { color: 'red' }
});

export default OrgAdminDashboardScreen;

function projectColor(label: string): string {
  switch (label) {
    case 'Not Started':
      return '#9CA3AF';
    case 'In Progress':
      return '#F59E0B';
    case 'Completed':
      return '#22C55E';
    case 'On Hold':
      return '#6366F1';
    case 'Cancelled':
      return '#EF4444';
    default:
      return '#FB923C';
  }
}

function iconForCard(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('employee')) return 'groups';
  if (t.includes('attendance')) return 'task-alt';
  if (t.includes('payroll')) return 'account-balance-wallet';
  if (t.includes('project')) return 'folder';
  return 'dashboard';
}


