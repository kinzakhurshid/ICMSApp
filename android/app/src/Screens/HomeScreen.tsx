import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import PMDashboardScreen from './PMDashboardScreen';
import HRDashboardScreen from './HRDashboardScreen';
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


  if (isHR) {
    return <HRDashboardScreen key={refreshKey} />;
  } else if (isPM) {
    return <PMDashboardScreen key={refreshKey} navigation={navigation} />;
  } else {
    return <EmployeeDashboard key={refreshKey} />;
  }
};

export default HomeScreen;
