import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import RoleBasedNavigator from './RoleBasedNavigator';
import AuthStackScreen from './AuthNavigator';

const RootNavigator: React.FC = () => {
  const isLoggedIn = useSelector((state: RootState) => state.user.isLoggedIn);
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Redux Persist to hydrate before showing login screen
  useEffect(() => {
    // Small delay to ensure Redux Persist has loaded
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen while hydrating to prevent login screen flash
  if (!isHydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F09819" />
      </View>
    );
  }
  
  return isLoggedIn ? <RoleBasedNavigator /> : <AuthStackScreen />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default RootNavigator;