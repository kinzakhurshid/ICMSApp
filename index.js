/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Register background handler - MUST be outside of any component lifecycle
// Wrap in try-catch to prevent crashes if Firebase isn't properly linked
try {
  const messaging = require('@react-native-firebase/messaging').default;
  
  if (messaging) {
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Firebase: Message handled in the background!', remoteMessage);
      // Background notifications are automatically displayed by the OS
      // You can add additional processing here if needed
    });
  }
} catch (error) {
  console.warn('Firebase: Could not set background message handler:', error);
  // Continue anyway - app should still work without background handler
}

AppRegistry.registerComponent(appName, () => App);
