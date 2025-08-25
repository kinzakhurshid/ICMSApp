import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSelector } from "react-redux";
import { RootState } from "../states/store";

interface AppHeaderProps {
  navigation: any;
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const AppHeader = ({ navigation, title, showBackButton = false, onBackPress }: AppHeaderProps) => {
  const { currentUser } = useSelector((state: RootState) => state.user);

  const handleMenuPress = () => {
    navigation.toggleDrawer();
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
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
                source={{ uri: currentUser?.avatar ?? 'https://randomuser.me/api/portraits/women/44.jpg' }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.greeting}>Hi, {currentUser?.name || 'User'}</Text>
                <Text style={styles.greetingSubtext}>Welcome back</Text>
              </View>
            </>
          )}
        </View>

        {/* Right side - Icons */}
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#FF5722" />
          </TouchableOpacity>
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
    // marginRight: 6,
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