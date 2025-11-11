// navigation/RoleBasedNavigator.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import DrawerNavigator from './DrawerNavigator';
import PMNavigator from './PMNavigator';
import EmployeeNavigator from './EmployeeNavigator';

const RoleBasedNavigator: React.FC = () => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const user = useSelector((state: RootState) => state.user.user);

  // Use currentUser if available, otherwise fall back to user
  const displayUser = currentUser || user;

  // Check user roles
  const isPM = (displayUser as any)?.role === 'PM' || (displayUser as any)?.role === 'pm';
  const isHR = (displayUser as any)?.role === 'HR' || (displayUser as any)?.role === 'hr';
  const isOrgAdmin = ['ORG_ADMIN','OrgAdmin','org_admin','Org Admin','ORGADMIN','orgadmin','ORG'].includes(((displayUser as any)?.role || '').toString());

  console.log('🔍 RoleBasedNavigator - displayUser:', displayUser);
  console.log('🔍 RoleBasedNavigator - isPM:', isPM, 'isHR:', isHR);

  if (isPM) {
    console.log('🔍 Using PMNavigator');
    return <PMNavigator />;
  } else if (isHR || isOrgAdmin) {
    console.log('🔍 Using DrawerNavigator for HR/OrgAdmin');
    return <DrawerNavigator />;
  } else {
    console.log('🔍 Using EmployeeNavigator');
    return <EmployeeNavigator />;
  }
};

export default RoleBasedNavigator;



