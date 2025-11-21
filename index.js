/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// Register background handler - MUST be outside of any component lifecycle
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Firebase: Message handled in the background!', remoteMessage);
  // Background notifications are automatically displayed by the OS
  // You can add additional processing here if needed
});

AppRegistry.registerComponent(appName, () => App);
