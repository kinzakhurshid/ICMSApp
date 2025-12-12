import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
// All source code is in android/app/src - these paths work for both iOS and Android
import { store, persistor } from './android/app/src/states/store';
import RootNavigator from './android/app/src/navigation/AppNavigator';
import { NotificationProvider } from './android/app/src/Context/NotificationContext';
import { SocketProvider } from './android/app/src/Context/SocketContext';
import NotificationManager from './android/app/src/components/NotificationManager';
import { navigationRef } from './android/app/src/Services/NavigationService';
import { RootState } from './android/app/src/states/store';
import { initializeFirebase, sendTokenToBackend, getFCMToken } from './android/app/src/Services/FirebaseService';
import NotificationService from './android/app/src/Services/NotificationService';

// Wrapper component to access Redux store and provide token to SocketProvider
const AppWithSocket: React.FC = () => {
  const userState = useSelector((state: RootState) => state.user);
  const userToken = userState.token;
  const isLoggedIn = userState.isLoggedIn;
  
  // Initialize Notifee when app starts - wrap in try-catch to prevent crashes
  useEffect(() => {
    const initNotifee = async () => {
      try {
        await NotificationService.initialize();
      } catch (error) {
        console.error('App: Error initializing Notifee:', error);
        // Don't crash the app - continue without Notifee
      }
    };
    
    initNotifee();
  }, []);
  
  // Send FCM token to backend when user is logged in
  useEffect(() => {
    const sendFCMToken = async () => {
      // Check if user is logged in (has token)
      if (isLoggedIn && userToken) {
        const fcmToken = await getFCMToken();
        
        if (fcmToken) {
          console.log('App: Sending FCM token to backend...');
          await sendTokenToBackend(userToken, fcmToken);
        }
      }
    };

    sendFCMToken();
  }, [isLoggedIn, userToken]);
  
  return (
    <SocketProvider token={userState}>
      <NotificationProvider>
        <NotificationManager>
          <RootNavigator />
        </NotificationManager>
      </NotificationProvider>
    </SocketProvider>
  );
};

const App = () => {
  useEffect(() => {
    // Initialize Firebase when app starts - wrap in try-catch to prevent crashes
    const initFirebase = async () => {
      try {
        await initializeFirebase();
      } catch (error) {
        console.error('App: Error initializing Firebase:', error);
        // Don't crash the app - continue without Firebase
      }
    };
    
    initFirebase();
  }, []);

  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#F09819" />
    </View>
  );

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <NavigationContainer ref={navigationRef}>
          <AppWithSocket />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});

export default App;