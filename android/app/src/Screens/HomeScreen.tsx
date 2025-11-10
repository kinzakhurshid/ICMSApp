import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import PMDashboardScreen from './PMDashboardScreen';
import HRDashboardScreen from './HRDashboardScreen';
import OrgAdminDashboardScreen from './OrgAdminDashboardScreen';
import EmployeeDashboard from './EmployeeDashboard';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const user = useSelector((state: any) => state.user);
  const currentUser = useSelector((state: any) => state.user.currentUser);
  const displayUser = currentUser || user;
  
  // Force re-render when user data changes
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  React.useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [displayUser]);
  
  const isPM = (displayUser as any)?.role === 'PM' || (displayUser as any)?.role === 'pm';
  const isHR = (displayUser as any)?.role === 'HR' || (displayUser as any)?.role === 'hr';
  const isOrgAdmin = ['ORG_ADMIN','OrgAdmin','org_admin','Org Admin','ORGADMIN','orgadmin','ORG'].includes(((displayUser as any)?.role || '').toString());


  if (isHR) {
    return <HRDashboardScreen key={refreshKey} />;
  } else if (isPM) {
    return <PMDashboardScreen key={refreshKey} navigation={navigation} />;
  } else if (isOrgAdmin) {
    return <OrgAdminDashboardScreen key={refreshKey} />;
  } else {
    return <EmployeeDashboard key={refreshKey} />;
  }
};

export default HomeScreen;
