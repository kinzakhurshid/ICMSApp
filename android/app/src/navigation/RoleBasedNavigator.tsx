// navigation/RoleBasedNavigator.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import PMNavigator from './PMNavigator';
import EmployeeNavigator from './EmployeeNavigator';

const RoleBasedNavigator: React.FC = () => {
  const { currentUser } = useSelector((state: RootState) => state.user);

  // Check if user is PM (Project Manager)
  const isPM = currentUser?.role === 'PM' || currentUser?.role === 'pm';

  if (isPM) {
    return <PMNavigator />;
  } else {
    return <EmployeeNavigator />;
  }
};

export default RoleBasedNavigator;
