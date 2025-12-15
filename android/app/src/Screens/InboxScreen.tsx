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

interface InboxScreenProps {
  routeParams?: any;
}

const InboxScreen: React.FC<InboxScreenProps> = ({ routeParams }) => {
  const [loading, setLoading] = useState(true);
  const [showConnectionBanner, setShowConnectionBanner] = useState(false);
  
  // Get user from Redux store
  const currentUser = useSelector((state: RootState) => state.user);
  const token = useSelector((state: RootState) => state.user.token);
  
  const { isConnected, socket } = useSocket();

  useEffect(() => {
    if (currentUser && token) {
      setLoading(false);
    } else {
      // Handle the case where user is not authenticated
      // You might want to navigate to login or show an error
    }
  }, [currentUser, token]);

  // Only show connection banner if socket exists but not connected (actively trying to connect)
  // Hide banner once connected to avoid showing "connecting" when already connected
  useEffect(() => {
    if (socket && !isConnected) {
      // Show banner when socket exists but not connected
      setShowConnectionBanner(true);
      // Hide banner after a delay if still not connected (to avoid showing indefinitely)
      const timeout = setTimeout(() => {
        if (!isConnected) {
          setShowConnectionBanner(false);
        }
      }, 5000);
      return () => clearTimeout(timeout);
    } else if (isConnected) {
      // Immediately hide banner when connected
      setShowConnectionBanner(false);
    } else {
      setShowConnectionBanner(false);
    }
  }, [socket, isConnected]);

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
      
      {/* Connection Status Banner - Only show when actively connecting */}
      {showConnectionBanner && socket && !isConnected && (
        <View style={styles.connectionBanner}>
          <Text style={styles.connectionText}>
            Connecting to chat service...
          </Text>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
      
      {/* Connected Status Banner - Show briefly when connection is established */}
      {isConnected && socket && (
        <View style={styles.connectedBanner}>
          <Text style={styles.connectedText}>
            Connected to chat service
          </Text>
        </View>
      )}

      {/* Chat Container */}
      {currentUser && (
        <ChatContainer currentUser={currentUser} initialChatId={routeParams?.chatId} />
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
  connectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 8,
  },
  connectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default InboxScreen;
