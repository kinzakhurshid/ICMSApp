// screens/InboxScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';

import ChatContainer from '../components/ChatContainer';
import { useSocket } from '../Context/SocketContext';
import { RootState } from '../states/store';

const InboxScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // Get user from Redux store
  const currentUser = useSelector((state: RootState) => state.user);
  const token = useSelector((state: RootState) => state.user.token);
  
  const { isConnected } = useSocket();

  useEffect(() => {
    if (currentUser && token) {
      setLoading(false);
    } else {
      // Handle the case where user is not authenticated
      // You might want to navigate to login or show an error
    }
  }, [currentUser, token]);

  // const handleLogout = () => {
  //   Alert.alert(
  //     'Logout',
  //     'Are you sure you want to logout?',
  //     [
  //       {
  //         text: 'Cancel',
  //         style: 'cancel',
  //       },
  //       {
  //         text: 'Logout',
  //         onPress: async () => {
  //           dispatch(logoutUser());
  //           // Navigation to login will be handled by your main navigator
  //         },
  //         style: 'destructive',
  //       },
  //     ],
  //     { cancelable: true }
  //   );
  // };


  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading your chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Connection Status Banner */}
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionText}>
            Connecting to chat service...
          </Text>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}

      {/* Chat Container */}
      {currentUser && (
        <ChatContainer currentUser={currentUser} />
      )}
    </View>
  );
};

// ... keep your existing styles

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 12,
  },
  connectionText: {
    color: '#FFFFFF',
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InboxScreen;
