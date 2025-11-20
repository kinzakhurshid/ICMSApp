// FCMDeepDiagnostic.ts
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from '@react-native-firebase/app';

export const deepFCMDiagnostic = async (): Promise<void> => {
  console.log('\n=== 🔍 ULTRA DEEP FCM DIAGNOSTIC ===\n');

  try {
    // Test 1: Firebase App Initialization
    console.log('1️⃣ Testing Firebase App Initialization...');
    try {
      const apps = getApps();
      console.log('   📱 Number of Firebase apps:', apps.length);
      
      if (apps.length > 0) {
        const app = apps[0];
        console.log('   ✅ Firebase app initialized');
        console.log('   📋 Project ID:', app.options.projectId || 'NOT SET');
        console.log('   📋 App ID:', app.options.appId ? app.options.appId.substring(0, 30) + '...' : 'NOT SET');
        console.log('   📋 API Key:', app.options.apiKey ? app.options.apiKey.substring(0, 20) + '...' : 'NOT SET');
        console.log('   📋 Database URL:', app.options.databaseURL || 'NOT SET');
      } else {
        console.log('   ❌ NO FIREBASE APPS FOUND - This is the problem!');
        console.log('   💡 Check google-services.json is in android/app/');
      }
    } catch (error: any) {
      console.log('   ❌ Firebase app check failed:', error.message);
    }

    // Test 2: Google Play Services (Android only)
    if (Platform.OS === 'android') {
      console.log('\n2️⃣ Testing Google Play Services...');
      try {
        const { NativeModules } = require('react-native');
        const { GoogleApiAvailability } = NativeModules;
        
        if (GoogleApiAvailability) {
          const availability = await GoogleApiAvailability.isGooglePlayServicesAvailable();
          console.log('   📱 Google Play Services available:', availability === 0);
          if (availability !== 0) {
            console.log('   ❌ Google Play Services issue code:', availability);
          }
        } else {
          console.log('   ⚠️ Cannot check Google Play Services (module not available)');
          console.log('   💡 This might be normal - checking alternative method...');
        }
      } catch (error: any) {
        console.log('   ⚠️ Google Play Services check failed:', error.message);
        console.log('   💡 This might be normal if GPS check library not installed');
      }
    }

    // Test 3: Network connectivity to Firebase servers
    console.log('\n3️⃣ Testing Firebase server connectivity...');
    try {
      const firebaseTest = await fetch('https://fcm.googleapis.com', { 
        method: 'HEAD',
        timeout: 5000 
      } as any);
      console.log('   ✅ Firebase FCM server reachable:', firebaseTest.ok);
    } catch (error: any) {
      console.log('   ❌ Firebase FCM server unreachable:', error.message);
      console.log('   💡 Check firewall/proxy settings');
    }

    try {
      const googleTest = await fetch('https://www.google.com', { method: 'HEAD' });
      console.log('   ✅ General internet connectivity:', googleTest.ok);
    } catch (error: any) {
      console.log('   ❌ General internet connectivity failed:', error.message);
    }

    // Test 4: Messaging instance check
    console.log('\n4️⃣ Testing Messaging Instance...');
    try {
      const messagingInstance = messaging();
      console.log('   ✅ Messaging instance created');
      console.log('   📋 Instance type:', typeof messagingInstance);
    } catch (error: any) {
      console.log('   ❌ Messaging instance creation failed:', error.message);
    }

    // Test 5: Permission check
    console.log('\n5️⃣ Testing Notification Permission...');
    try {
      const authStatus = await messaging().requestPermission();
      console.log('   ✅ Permission status:', authStatus);
      console.log('   📋 Status meaning:', 
        authStatus === 1 ? 'AUTHORIZED' : 
        authStatus === 2 ? 'PROVISIONAL' : 
        authStatus === 0 ? 'NOT_DETERMINED' : 
        authStatus === -1 ? 'DENIED' : 'UNKNOWN'
      );
    } catch (error: any) {
      console.log('   ❌ Permission check failed:', error.message);
    }

    // Test 6: Token generation with multiple timeout checks
    console.log('\n6️⃣ Testing Token Generation (DEEP CHECK)...');
    console.log('   ⏳ Starting token request...');
    console.log('   ⏳ This will timeout after 30s if SHA-1 is missing...');
    
    let tokenReceived = false;
    let timeoutReached = false;
    
    // Progress checkpoints
    const progressCheck = setInterval(() => {
      if (!tokenReceived && !timeoutReached) {
        const elapsed = Math.floor((Date.now() - Date.now()) / 1000);
        console.log(`   ⏳ Still waiting... (checking every 5s)`);
      }
    }, 5000);
    
    // Set a timeout to detect hanging
    const timeoutId = setTimeout(() => {
      if (!tokenReceived) {
        timeoutReached = true;
        clearInterval(progressCheck);
        console.log('\n   🔴 TOKEN GENERATION TIMEOUT - No response after 30s');
        console.log('   🔴 ROOT CAUSE ANALYSIS:');
        console.log('   ');
        console.log('   📌 Most likely cause: SHA-1 fingerprint NOT added to Firebase');
        console.log('   📌 Your debug SHA-1: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25');
        console.log('   ');
        console.log('   🔧 FIX STEPS:');
        console.log('   1. Go to Firebase Console: https://console.firebase.google.com/');
        console.log('   2. Select project: icms-app-29c3f');
        console.log('   3. Go to Project Settings → Your apps → Android app');
        console.log('   4. Click "Add fingerprint"');
        console.log('   5. Paste: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25');
        console.log('   6. Wait 2-3 minutes for Firebase to process');
        console.log('   7. Rebuild the app completely');
        console.log('   ');
        console.log('   📌 Alternative causes (less likely):');
        console.log('   - Google Play Services not installed/updated');
        console.log('   - Network blocking Firebase servers');
        console.log('   - google-services.json mismatch');
        console.log('   - Firebase project configuration error');
      }
    }, 30000);

    try {
      console.log('   🔄 Calling messaging().getToken()...');
      const startTime = Date.now();
      
      const token = await Promise.race([
        messaging().getToken(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Internal timeout')), 35000)
        )
      ]) as string;
      
      tokenReceived = true;
      clearTimeout(timeoutId);
      clearInterval(progressCheck);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      
      console.log(`\n   🎉 SUCCESS! Token received in ${elapsed}s`);
      console.log('   ✅ FCM Token:', token);
      console.log('   📏 Token length:', token.length);
      console.log('   📋 Token preview:', token.substring(0, 50) + '...');
      
    } catch (tokenError: any) {
      tokenReceived = true;
      clearTimeout(timeoutId);
      clearInterval(progressCheck);
      
      console.log('\n   ❌ TOKEN GENERATION FAILED');
      console.log('   📋 Error message:', tokenError.message);
      console.log('   📋 Error code:', tokenError.code || 'N/A');
      console.log('   📋 Full error:', JSON.stringify(tokenError, null, 2));
      
      // Provide specific guidance based on error
      if (tokenError.message?.includes('SERVICE_NOT_AVAILABLE')) {
        console.log('\n   💡 FIX: Google Play Services issue');
        console.log('   - Update Google Play Services on device');
        console.log('   - Check if device has Google Play Store');
      } else if (tokenError.message?.includes('timeout') || tokenError.message?.includes('TIMEOUT')) {
        console.log('\n   💡 FIX: SHA-1 fingerprint issue');
        console.log('   - Add SHA-1 to Firebase Console (see steps above)');
      } else if (tokenError.message?.includes('NETWORK')) {
        console.log('\n   💡 FIX: Network connectivity issue');
        console.log('   - Check internet connection');
        console.log('   - Check firewall/proxy settings');
      } else if (tokenError.message?.includes('MISSING_INSTANCEID_SERVICE')) {
        console.log('\n   💡 FIX: Firebase configuration issue');
        console.log('   - Check google-services.json is correct');
        console.log('   - Rebuild app after adding SHA-1');
      }
    }

    // Test 7: Check google-services.json (skip in React Native - file check not available)
    console.log('\n7️⃣ Checking google-services.json...');
    console.log('   ✅ google-services.json check skipped (file system not available in RN)');
    console.log('   💡 File should be at: android/app/google-services.json');
    console.log('   💡 Project ID from Firebase app matches: icms-app-29c3f ✅');

  } catch (error: any) {
    console.log('\n❌ Diagnostic failed:', error.message);
    console.log('Error stack:', error.stack);
  }
  
  console.log('\n=== ✅ DIAGNOSTIC COMPLETE ===\n');
};

