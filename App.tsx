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
import FCMTokenTestScreen from './android/app/src/Screens/FCMTokenTestScreen';
import FirebaseMessagingService from './android/app/src/Services/FirebaseMessagingService';

// Wrapper component to access Redux store and provide token to SocketProvider
const AppWithSocket: React.FC = () => {
  const token = useSelector((state: RootState) => state.user);
  
  return (
    <SocketProvider token={token}>
      <NotificationProvider>
        <NotificationManager>
          <RootNavigator />
        </NotificationManager>
      </NotificationProvider>
    </SocketProvider>
  );
};

const App = () => {
  // TODO: Remove this temporary flag - showing FCM test screen on load for debugging
  const SHOW_FCM_TEST_ON_LOAD = true; // Set to false to restore normal navigation

  useEffect(() => {
    // Initialize FCM when app starts
    const initFCM = async () => {
      const token = await FirebaseMessagingService.initialize();
      if (token) {
        console.log('✅ FCM ready! Token:', token);
        // Send token to your backend here
      } else {
        console.log('❌ FCM failed');
      }
    };

    initFCM();
  }, []);
  
  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        {SHOW_FCM_TEST_ON_LOAD ? (
          <FCMTokenTestScreen />
        ) : (
          <AppWithSocket />
        )}
      </NavigationContainer>
    </Provider>
  );
};

export default App;