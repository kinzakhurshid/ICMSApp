/**
 * @format
 */

import {AppRegistry} from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// Register background handler for Android
// This is required for handling notifications when app is in background or killed
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('🔥 Background FCM message received:', remoteMessage);
  // The background handler is already set up in FirebaseMessagingService
  // This is just a fallback to ensure it's registered at app level
});

AppRegistry.registerComponent(appName, () => App);
