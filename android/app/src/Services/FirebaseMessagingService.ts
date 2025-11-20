// SimpleFCM.ts
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

class SimpleFCM {
  private token: string | null = null;

  /**
   * Ultra simple token getter - just get the token directly
   */
  async getFCMToken(): Promise<string | null> {
    try {
      console.log('🔄 Getting FCM token...');
      
      // Get token directly
      const token = await messaging().getToken();
      
      if (token) {
        console.log('✅ FCM TOKEN OBTAINED:', token);
        this.token = token;
        return token;
      } else {
        console.log('❌ No token received');
        return null;
      }
    } catch (error: any) {
      console.log('❌ Token error:', error.message);
      
      // Check for specific errors
      if (error.message.includes('SERVICE_NOT_AVAILABLE')) {
        console.log('🔴 Google Play Services issue');
      } else if (error.message.includes('timeout')) {
        console.log('🔴 Timeout - SHA-1 may still be missing');
      }
      
      return null;
    }
  }

  /**
   * Simple one-shot initialization
   */
  async initialize(): Promise<string | null> {
    try {
      console.log('🚀 Simple FCM initialization...');
      
      // Get token directly
      const token = await this.getFCMToken();
      
      if (token) {
        console.log('🎉 FCM READY! Token length:', token.length);
        return token;
      }
      
      return null;
    } catch (error: any) {
      console.log('❌ Initialization failed:', error.message);
      return null;
    }
  }

  getCurrentToken(): string | null {
    return this.token;
  }
}

export default new SimpleFCM();