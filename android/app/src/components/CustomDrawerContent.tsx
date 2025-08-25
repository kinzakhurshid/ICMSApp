import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  StatusBar 
} from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const user = useSelector((state: any) => state.user.user);
  
  // Custom drawer items that match the screenshot
  const drawerItems = [
    { 
      label: 'Dashboard', 
      icon: <MaterialIcons name="dashboard" size={22} color="#FF5722" />,
      route: 'Dashboard'
    },
    { 
      label: 'Tasks', 
      icon: <MaterialIcons name="task" size={22} color="#FF5722" />,
      route: 'Tasks'
    },
    { 
      label: 'Inbox', 
      icon: <MaterialIcons name="inbox" size={22} color="#FF5722" />,
      route: 'Inbox'
    },
    { 
      label: 'Projects', 
      icon: <MaterialIcons name="folder" size={22} color="#FF5722" />,
      route: 'Projects'
    },
    { 
      label: 'Standsup', 
      icon: <MaterialCommunityIcons name="presentation" size={22} color="#FF5722" />,
      route: 'Standsup'
    },
    { 
      label: 'Meeting', 
      icon: <MaterialIcons name="video-call" size={22} color="#FF5722" />,
      route: 'Meeting'
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FF5722" barStyle="light-content" />
      
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.appName}>ICMS</Text>
          <Text style={styles.appTagline}>Streamline Your Workspace</Text>
        </View>
      </View>
      
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={styles.drawerContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        {/* <View style={styles.userSection}>
          <Image
            source={{ uri: user?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg' }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userRole}>{user?.role || 'Guest'}</Text>
          </View>
        </View> */}
        
        {/* Custom Drawer Items */}
        <View style={styles.menuSection}>
          {drawerItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                props.state.index === index && styles.activeMenuItem
              ]}
              onPress={() => props.navigation.navigate(item.route)}
            >
              <View style={styles.menuIcon}>
                {item.icon}
              </View>
              <Text style={[
                styles.menuText,
                props.state.index === index && styles.activeMenuText
              ]}>
                {item.label}
              </Text>
              
              {props.state.index === index && (
                <View style={styles.activeIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </DrawerContentScrollView>
      
      {/* Footer with Logout Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            props.navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          }}
        >
          <Ionicons name="log-out-outline" size={20} color="#FF5722" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    backgroundColor: '#FF5722',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    marginTop: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  drawerContent: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
  menuSection: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginVertical: 4,
    position: 'relative',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
  },
  menuIcon: {
    width: 30,
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    fontWeight: '500',
  },
  activeMenuText: {
    color: '#FF5722',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '25%',
    height: '50%',
    width: 4,
    backgroundColor: '#FF5722',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 87, 34, 0.1)',
    marginBottom: 15,
  },
  logoutText: {
    color: '#FF5722',
    fontWeight: '600',
    marginLeft: 10,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
  },
});

export default CustomDrawerContent;