// screens/InboxScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageSquare, LogOut, ArrowLeft } from 'react-native-feather';
import { useSelector, useDispatch } from 'react-redux';

import ChatContainer from '../components/ChatContainer';
import { useSocket } from '../Context/SocketContext';
import { User as UserType } from '../types/chattypes';
import { RootState } from '../states/store';
// import { logoutUser } from '../states/authslice';

// Define your navigation types
// Screens/InboxScreen.tsx (Updated)

// Define your navigation types
export type InboxStackParamList = {
  InboxMain: undefined;
  // Add other inbox-related screens if needed
};

const InboxScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  // Get user from Redux store
  const currentUser = useSelector((state: RootState) => state.user);
  const token = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  
  const { socket, isConnected } = useSocket();
  const navigation = useNavigation<NativeStackNavigationProp<InboxStackParamList>>();

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

  const handleBack = () => {
    navigation.goBack();
  };

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
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft width={24} height={24} color="#374151" />
          </TouchableOpacity>
          <MessageSquare width={24} height={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        
        <View style={styles.headerRight}>
          <View style={[styles.connectionStatus, 
            { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]} 
          />
          {/* <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <LogOut width={20} height={20} color="#374151" />
          </TouchableOpacity> */}
        </View>
      </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16, // Adjust for iOS status bar
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    padding: 12,
  },
    backButton: {
    marginRight: 12,
  },
  connectionText: {
    color: '#FFFFFF',
    marginRight: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default InboxScreen;
