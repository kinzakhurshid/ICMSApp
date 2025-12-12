// navigation/RoleBasedNavigator.tsx
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import DrawerNavigator from './DrawerNavigator';
import PMNavigator from './PMNavigator';
import EmployeeNavigator from './EmployeeNavigator';

const RoleBasedNavigator: React.FC = () => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const user = useSelector((state: RootState) => state.user.user);
  const prevUserRef = useRef<string | null>(null);

  // Use currentUser if available, otherwise fall back to user
  const displayUser = currentUser || user;
  const userId = (displayUser as any)?._id || (displayUser as any)?.id;

  // Check user roles
  const isPM = (displayUser as any)?.role === 'PM' || (displayUser as any)?.role === 'pm';
  const isHR = (displayUser as any)?.role === 'HR' || (displayUser as any)?.role === 'hr';
  const isOrgAdmin = ['ORG_ADMIN','OrgAdmin','org_admin','Org Admin','ORGADMIN','orgadmin','ORG'].includes(((displayUser as any)?.role || '').toString());

  // Force remount navigator when user changes (e.g., on login) to reset navigation state
  const navigatorKey = userId || 'default';

  console.log('🔍 RoleBasedNavigator - displayUser:', displayUser);
  console.log('🔍 RoleBasedNavigator - isPM:', isPM, 'isHR:', isHR);

  if (isPM) {
    console.log('🔍 Using PMNavigator');
    return <PMNavigator key={navigatorKey} />;
  } else if (isHR || isOrgAdmin) {
    console.log('🔍 Using DrawerNavigator for HR/OrgAdmin');
    return <DrawerNavigator key={navigatorKey} />;
  } else {
    console.log('🔍 Using EmployeeNavigator');
    return <EmployeeNavigator key={navigatorKey} />;
  }
};

export default RoleBasedNavigator;



