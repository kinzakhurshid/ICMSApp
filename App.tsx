import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import { store } from './android/app/src/states/store';
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
  
  // Initialize Notifee when app starts
  useEffect(() => {
    NotificationService.initialize();
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
    // Initialize Firebase when app starts
    initializeFirebase();
  }, []);

  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <AppWithSocket />
      </NavigationContainer>
    </Provider>
  );
};

export default App;