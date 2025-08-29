import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import DrawerNavigator from './DrawerNavigator';
import AuthStackScreen from './AuthNavigator';

const RootNavigator: React.FC = () => {
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  
  return isLoggedIn ? <DrawerNavigator /> : <AuthStackScreen />;
};

export default RootNavigator;