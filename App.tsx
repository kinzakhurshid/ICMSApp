import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { store } from './android/app/src/states/store';
import RootNavigator from './android/app/src/navigation/AppNavigator';
import { NotificationProvider } from './android/app/src/Context/NotificationContext';
import NotificationManager from './android/app/src/components/NotificationManager';

const App = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <NotificationProvider>
          <NotificationManager>
            <RootNavigator />
          </NotificationManager>
        </NotificationProvider>
      </NavigationContainer>
    </Provider>
  );
};

export default App;