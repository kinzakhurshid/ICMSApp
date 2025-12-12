// components/AppHeader.tsx
import React, { useState, useEffect } from 'react';
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
import NotificationIcon from './NotificationIcon';
import { useNotifications } from '../Context/NotificationContext';

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
  const { unreadCount } = useNotifications();
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Show alerts with user data (convert objects to strings)
  // Alert.alert('Current User Object', JSON.stringify(currentUser, null, 2));

  // Prefer currentUser, fall back to user if currentUser is not available
  const displayUser = currentUser ;

  // Convert JPG image to data URI for better React Native compatibility
  const convertJpgToDataUri = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          let dataUri = reader.result as string;
          
          // Ensure the data URI has the correct MIME type for JPG
          if (dataUri.startsWith('data:application/octet-stream')) {
            dataUri = dataUri.replace('data:application/octet-stream', 'data:image/jpeg');
          }
          
          resolve(dataUri);
        };
        reader.onerror = () => {
          reject(null);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return null;
    }
  };

  // Test image URL before setting it
  const testImageUrl = async (url: string) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Validate and set image URL
  useEffect(() => {
    const profilePic = displayUser?.profilePic;
    const employeeProfileImage = displayUser?.employee?.profileImage;
    

    // Reset retry count when user changes
    setRetryCount(0);

    // Try to validate the URL
    const urlToUse = profilePic || employeeProfileImage;
    
    if (urlToUse && typeof urlToUse === 'string' && urlToUse.startsWith('http')) {
      
      // Check if it's a JPG image and add format hints
      let processedUrl = urlToUse;
      if (urlToUse.toLowerCase().includes('.jpg') || urlToUse.toLowerCase().includes('.jpeg')) {
        // For JPG images, try different approaches
        // First try with format parameters
        processedUrl = urlToUse + (urlToUse.includes('?') ? '&' : '?') + 'format=jpg&quality=80&optimize=true';
      }
      
      // Check if it's a JPG image and convert it
      if (urlToUse.toLowerCase().includes('.jpg') || urlToUse.toLowerCase().includes('.jpeg')) {
        convertJpgToDataUri(urlToUse).then(dataUri => {
          if (dataUri) {
            setImageUrl(dataUri);
            setImageError(false);
          } else {
            // Try the original URL if conversion fails
            setImageUrl(urlToUse);
            setImageError(false);
          }
        });
      } else {
        // For non-JPG images, test the URL first
        testImageUrl(processedUrl).then(isValid => {
          if (isValid) {
            setImageUrl(processedUrl);
            setImageError(false);
          } else {
            // Try the original URL if processed URL fails
            testImageUrl(urlToUse).then(originalValid => {
              if (originalValid) {
                setImageUrl(urlToUse);
                setImageError(false);
              } else {
                setImageUrl('https://randomuser.me/api/portraits/women/44.jpg');
                setImageError(false);
              }
            });
          }
        });
      }
    } else {
      setImageUrl('https://randomuser.me/api/portraits/women/44.jpg');
      setImageError(false);
    }
  }, [displayUser]);

  const handleMenuPress = () => {
    try {
      // Check if toggleDrawer function exists (from drawer navigation)
      if ('toggleDrawer' in navigation && typeof navigation.toggleDrawer === 'function') {
        (navigation as any).toggleDrawer();
      } 
      // Check if openDrawer function exists
      else if ('openDrawer' in navigation && typeof navigation.openDrawer === 'function') {
        (navigation as any).openDrawer();
      }
      // Fallback: either go back or show a message
      else if ('canGoBack' in navigation && navigation.canGoBack && typeof navigation.canGoBack === 'function' && navigation.canGoBack()) {
        navigation.goBack();
      } else {
        Alert.alert('Info', 'Menu not available on this screen');
      }
    } catch (error) {
      console.error('Error opening drawer:', error);
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
            <TouchableOpacity 
              onPress={handleBackPress} 
              style={styles.iconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#FF5722" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={handleMenuPress} 
              style={styles.iconButton}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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
                source={imageUrl && imageUrl.startsWith('data:') ? 
                  { uri: imageUrl } : 
                  { uri: imageUrl || 'https://randomuser.me/api/portraits/women/44.jpg' }
                }
                style={styles.avatar}
                onError={(error) => {
                  setImageError(true);
                  
                  // Special handling for data URI failures
                  if (imageUrl && imageUrl.startsWith('data:')) {
                    const originalUrl = displayUser?.profilePic || displayUser?.employee?.profileImage;
                    if (originalUrl) {
                      setImageUrl(originalUrl);
                      setRetryCount(0);
                      return;
                    }
                  }
                  
                  // Prevent infinite retries
                  if (retryCount < 2 && imageUrl && imageUrl.includes('intelgency.com') && !imageUrl.includes('?t=')) {
                    setRetryCount(prev => prev + 1);
                    // Try adding cache busting parameter
                    const fallbackUrl = imageUrl + '?t=' + Date.now();
                    setImageUrl(fallbackUrl);
                  } else {
                    // Fallback to default image
                    setImageUrl('https://randomuser.me/api/portraits/women/44.jpg');
                    setRetryCount(0);
                  }
                }}
                onLoad={() => {
                  setImageError(false);
                }}
                onLoadEnd={() => {}}
                resizeMode="cover"
                cache={imageUrl && imageUrl.startsWith('data:') ? "default" : "force-cache"}
                // Additional props to help with JPG loading
                progressiveRenderingEnabled={true}
                fadeDuration={200}
                // Special handling for data URIs
                {...(imageUrl && imageUrl.startsWith('data:') ? {
                  // For data URIs, use different loading approach
                  loadingIndicatorSource: undefined,
                  onLoadStart: () => {},
                } : {
                  onLoadStart: () => {}
                })}
              />
              <View style={styles.userInfo}>
                <Text style={styles.greeting}>Hi, {displayUser?.name || (displayUser?.employee as any)?.fullName || 'User'}</Text>
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
          <NotificationIcon 
            unreadCount={unreadCount}
            size={22}
            color="#FF5722"
          />
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
    padding: 8,
    position: 'relative',
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default AppHeader;