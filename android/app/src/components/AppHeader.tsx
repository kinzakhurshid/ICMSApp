// components/AppHeader.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from "react-redux";
import { RootState } from "../states/store";
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define navigation types
type NavigationProp = DrawerNavigationProp<any> | NativeStackNavigationProp<any>;

interface AppHeaderProps {
  navigation: NavigationProp;
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  navigation, 
  title, 
  showBackButton = false, 
  onBackPress 
}) => {
  const { currentUser } = useSelector((state: RootState) => state.user);
  
  // Show alerts with user data (convert objects to strings)
  // Alert.alert('Current User Object', JSON.stringify(currentUser, null, 2));

  // Prefer currentUser, fall back to user if currentUser is not available
  const displayUser = currentUser ;

  const handleMenuPress = () => {
    // Check if toggleDrawer function exists (from drawer navigation)
    if ('toggleDrawer' in navigation && typeof navigation.toggleDrawer === 'function') {
      navigation.toggleDrawer();
    } 
    // Check if openDrawer function exists
    else if ('openDrawer' in navigation && typeof navigation.openDrawer === 'function') {
      navigation.openDrawer();
    }
    // Fallback: either go back or show a message
    else if ('canGoBack' in navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    } else {
      Alert.alert('Info', 'Menu not available on this screen');
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if ('canGoBack' in navigation && navigation.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        {/* Left side - Menu/Back button */}
        <View style={styles.headerLeft}>
          {showBackButton ? (
            <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color="#FF5722" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleMenuPress} style={styles.iconButton}>
              <Ionicons name="grid-outline" size={24} color="#FF5722" />
            </TouchableOpacity>
          )}
        </View>

        {/* Center - User info or title */}
        <View style={styles.headerCenter}>
          {title ? (
            <Text style={styles.titleText}>{title}</Text>
          ) : (
            <>
              <Image
                source={{ uri: displayUser?.avatar ?? 'https://randomuser.me/api/portraits/women/44.jpg' }}
                style={styles.avatar}
              />
              <View style={styles.userInfo}>
                <Text style={styles.greeting}>Hi, {displayUser?.name || 'User'}</Text>
                <Text style={styles.greetingSubtext}>Welcome back</Text>
              </View>
            </>
          )}
        </View>

        {/* Right side - Icons */}
        <View style={styles.headerRight}>
          {/* <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FF5722" />
          </TouchableOpacity> */}
          <TouchableOpacity style={[styles.iconButton, { marginLeft: 12 }]}>
            <Ionicons name="notifications-outline" size={22} color="#FF5722" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFF',
    paddingTop: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconButton: {
    padding: 5,
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  userInfo: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  greetingSubtext: {
    fontSize: 12,
    color: '#999',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
  },
});

export default AppHeader;