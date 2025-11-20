import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import FirebaseMessagingService from '../Services/FirebaseMessagingService';
import messaging from '@react-native-firebase/messaging';
import NetInfo from '@react-native-community/netinfo';
import { deepFCMDiagnostic } from '../Services/FCMDeepDiagnostic';

const FCMTokenTestScreen: React.FC = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>('Checking...');
  const [isInitialized, setIsInitialized] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [networkStatus, setNetworkStatus] = useState<string>('Checking...');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  useEffect(() => {
    checkInitialStatus();
    checkNetworkStatus();
    
    // Monitor network status
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetworkStatus(state.isConnected ? '✅ Connected' : '❌ Disconnected');
      addLog(`Network: ${state.isConnected ? 'Connected' : 'Disconnected'}`);
    });
    
    return () => unsubscribe();
  }, []);

  const checkNetworkStatus = async () => {
    try {
      const state = await NetInfo.fetch();
      setNetworkStatus(state.isConnected ? '✅ Connected' : '❌ Disconnected');
      addLog(`Network Status: ${state.isConnected ? 'Connected' : 'Disconnected'}`);
    } catch (err: any) {
      setNetworkStatus('❓ Unknown');
      addLog(`Network check error: ${err.message}`);
    }
  };

  const checkInitialStatus = async () => {
    try {
      addLog('🔍 Checking initial FCM status...');
      
      // Check network first
      await checkNetworkStatus();
      
      // Check permission
      const authStatus = await messaging().requestPermission();
      const permissionText = 
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ? '✅ Authorized' :
        authStatus === messaging.AuthorizationStatus.PROVISIONAL ? '⚠️ Provisional' :
        authStatus === messaging.AuthorizationStatus.DENIED ? '❌ Denied' :
        '❓ Unknown';
      setPermissionStatus(permissionText);
      addLog(`Permission Status: ${permissionText}`);

      // Check Firebase app initialization (not just token)
      try {
        const { firebase } = require('@react-native-firebase/app');
        const app = firebase.app();
        const isFirebaseInitialized = !!app;
        addLog(`Firebase App Initialized: ${isFirebaseInitialized ? '✅ Yes' : '❌ No'}`);
        
        if (isFirebaseInitialized) {
          addLog(`Project ID: ${app.options.projectId || 'N/A'}`);
          addLog(`App ID: ${app.options.appId ? app.options.appId.substring(0, 30) + '...' : 'N/A'}`);
        }
      } catch (fbError: any) {
        addLog(`⚠️ Could not check Firebase app: ${fbError.message}`);
      }

      // Check if token exists (this is different from initialization)
      const currentToken = FirebaseMessagingService.getCurrentToken();
      const hasToken = !!currentToken;
      setIsInitialized(hasToken);
      addLog(`FCM Token Exists: ${hasToken ? '✅ Yes' : '❌ No'}`);
      addLog(`Note: "Initialized" means token exists. Click "Get Token" to generate one.`);

      // Get existing token if available
      if (currentToken) {
        setFcmToken(currentToken);
        addLog(`✅ Found existing token: ${currentToken.substring(0, 50)}...`);
      } else {
        addLog('💡 No token yet. Click "Get Token" to generate one.');
      }
    } catch (err: any) {
      addLog(`❌ Error checking status: ${err.message}`);
      setError(err.message);
    }
  };

  const initializeFCM = async () => {
    setIsLoading(true);
    setError(null);
    addLog('🔥 Initializing FCM...');
    addLog('⏳ Running deep diagnostic first...');
    
    // Run deep diagnostic first
    try {
      await deepFCMDiagnostic();
      addLog('✅ Deep diagnostic completed - check console for details');
    } catch (diagError: any) {
      addLog(`⚠️ Diagnostic warning: ${diagError.message}`);
    }
    
    addLog('📋 Now initializing FCM...');
    addLog('⏳ This may take up to 15 seconds...');

    const startTime = Date.now();
    try {
      // Add timeout wrapper
      const initPromise = FirebaseMessagingService.initialize();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Initialization timeout after 15 seconds')), 15000);
      });

      await Promise.race([initPromise, timeoutPromise]);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      addLog(`✅ FCM initialized successfully in ${elapsed}s!`);
      
      // Check if token was obtained during initialization
      const tokenAfterInit = FirebaseMessagingService.getCurrentToken();
      if (tokenAfterInit) {
        setIsInitialized(true);
        setFcmToken(tokenAfterInit);
        addLog(`✅ Token obtained during initialization: ${tokenAfterInit.substring(0, 50)}...`);
        Alert.alert('Success', `FCM initialized successfully!\nToken obtained in ${elapsed}s.`);
      } else {
        addLog('⚠️ Initialization complete, but no token yet.');
        Alert.alert('Initialized', 'FCM initialized successfully!');
      }
    } catch (err: any) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const errorMsg = err.message || 'Unknown error';
      setError(errorMsg);
      addLog(`❌ Initialization failed after ${elapsed}s: ${errorMsg}`);
      
      // More helpful error messages
      let userMessage = errorMsg;
      if (errorMsg.includes('not initialized')) {
        userMessage = 'Firebase app not initialized. Check google-services.json and rebuild the app.';
      } else if (errorMsg.includes('timeout')) {
        userMessage = 'Initialization timed out. Check your internet connection and Firebase configuration.';
      }
      
      Alert.alert('Error', `Failed to initialize FCM:\n${userMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToken = () => {
    if (fcmToken) {
      // For React Native, we'll use Alert to show the full token
      Alert.alert('FCM Token', fcmToken, [
        { text: 'OK' },
        { text: 'Copy', onPress: () => addLog('📋 Token copied (check clipboard)') }
      ]);
      addLog('📋 Token displayed');
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 Logs cleared');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>🔥 FCM Token Test Screen</Text>
        <Text style={styles.subtitle}>Debug Firebase Cloud Messaging Token Generation</Text>
      </View>

      {/* Status Cards */}
      <View style={styles.statusContainer}>
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Permission Status</Text>
          <Text style={styles.statusValue}>{permissionStatus}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Initialized</Text>
          <Text style={styles.statusValue}>{isInitialized ? '✅ Yes' : '❌ No'}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Platform</Text>
          <Text style={styles.statusValue}>{Platform.OS.toUpperCase()}</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Network</Text>
          <Text style={styles.statusValue}>{networkStatus}</Text>
        </View>
      </View>

      {/* FCM Token Display */}
      <View style={styles.tokenContainer}>
        <Text style={styles.tokenLabel}>FCM Token:</Text>
        {fcmToken ? (
          <View style={styles.tokenBox}>
            <Text style={styles.tokenText} selectable>
              {fcmToken}
            </Text>
            <TouchableOpacity style={styles.copyButton} onPress={copyToken}>
              <Text style={styles.copyButtonText}>📋 View Full</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noTokenBox}>
            <Text style={styles.noTokenText}>No token generated yet</Text>
          </View>
        )}
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorLabel}>❌ Error:</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={initializeFCM}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>🚀 Initialize FCM</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Logs Section */}
      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Text style={styles.logsTitle}>📋 Debug Logs</Text>
          <TouchableOpacity onPress={clearLogs}>
            <Text style={styles.clearLogsButton}>Clear</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.logsScroll} nestedScrollEnabled>
          {logs.length === 0 ? (
            <Text style={styles.noLogsText}>No logs yet. Perform an action to see logs.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>ℹ️ Instructions:</Text>
        <Text style={styles.infoText}>
          1. Click "Initialize FCM" first{'\n'}
          2. If permission is denied, click "Request Permission"{'\n'}
          3. Click "Get Token" to generate FCM token{'\n'}
          4. If token times out, add SHA-1 fingerprint:{'\n'}
             • Click "Open Firebase Console"{'\n'}
             • Add fingerprint: 5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25{'\n'}
             • Wait 1-2 minutes, then rebuild app{'\n'}
          5. Check logs below for detailed information
        </Text>
      </View>

      {/* SHA-1 Info Card */}
      <View style={[styles.infoContainer, { backgroundColor: '#fff3cd', borderColor: '#ffc107' }]}>
        <Text style={[styles.infoTitle, { color: '#856404' }]}>🔑 Your SHA-1 Fingerprint:</Text>
        <Text style={[styles.infoText, { color: '#856404', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
          5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
        </Text>
        <Text style={[styles.infoText, { color: '#856404', fontSize: 11, marginTop: 8 }]}>
          ⚠️ If getToken() times out, this fingerprint MUST be added to Firebase Console!
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    width: '48%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tokenLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tokenBox: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tokenText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
    marginBottom: 8,
  },
  noTokenBox: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  noTokenText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
  },
  copyButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#721c24',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#721c24',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#28a745',
  },
  secondaryButton: {
    backgroundColor: '#007bff',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  infoButton: {
    backgroundColor: '#17a2b8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 300,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clearLogsButton: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logsScroll: {
    maxHeight: 250,
  },
  logText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#333',
    marginBottom: 4,
    padding: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  noLogsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  diagnosticsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  diagnosticsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  diagnosticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  diagnosticsItem: {
    width: '48%',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
  },
  diagnosticsLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  diagnosticsValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  success: {
    color: '#28a745',
  },
  warning: {
    color: '#ffc107',
  },
  error: {
    color: '#dc3545',
  },
  errorBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#f8d7da',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f5c6cb',
  },
  infoContainer: {
    backgroundColor: '#d1ecf1',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0c5460',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#0c5460',
    lineHeight: 18,
  },
});

export default FCMTokenTestScreen;

