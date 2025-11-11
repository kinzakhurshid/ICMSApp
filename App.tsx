import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useSelector } from 'react-redux';
import { store } from './android/app/src/states/store';
import RootNavigator from './android/app/src/navigation/AppNavigator';
import { NotificationProvider } from './android/app/src/Context/NotificationContext';
import { SocketProvider } from './android/app/src/Context/SocketContext';
import NotificationManager from './android/app/src/components/NotificationManager';
import { navigationRef } from './android/app/src/Services/NavigationService';
import { RootState } from './android/app/src/states/store';

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
  return (
    <Provider store={store}>
      <NavigationContainer ref={navigationRef}>
        <AppWithSocket />
      </NavigationContainer>
    </Provider>
  );
};

export default App;