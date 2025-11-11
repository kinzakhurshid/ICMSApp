import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import RoleBasedNavigator from './RoleBasedNavigator';
import AuthStackScreen from './AuthNavigator';

const RootNavigator: React.FC = () => {
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  
  return isLoggedIn ? <RoleBasedNavigator /> : <AuthStackScreen />;
};

export default RootNavigator;