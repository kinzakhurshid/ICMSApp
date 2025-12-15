import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  StatusBar,
  Alert 
} from 'react-native';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { RootState } from '../states/store';
import { logout } from '../states/userSlice';
import { navigateToTab } from '../Services/NavigationService';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  
  // Use currentUser if available, otherwise fall back to user
  const displayUser = currentUser || user;

  // Check user role
  const isPM = (displayUser as any)?.role === 'PM' || (displayUser as any)?.role === 'pm';
  const isHR = (displayUser as any)?.role === 'HR' || (displayUser as any)?.role === 'hr';
  const isOrgAdmin = ['ORG_ADMIN','OrgAdmin','org_admin','Org Admin','ORGADMIN','orgadmin','ORG'].includes(((displayUser as any)?.role || '').toString());


  // Role-based drawer items
  const drawerItems = isHR ? [
    // HR menu items - using MainNavigater tab names
    { 
      label: 'Dashboard', 
      icon: <MaterialIcons name="dashboard" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'HomeTab'
    },
    { 
      label: 'Attendance', 
      icon: <MaterialIcons name="event-available" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'AttendanceTab'
    },
    { 
      label: 'Idle Time', 
      icon: <MaterialIcons name="timer" size={22} color="#FF5722" />,
      route: 'HRIdleTime',
    },
    { 
      label: 'Queries', 
      icon: <MaterialIcons name="question-answer" size={22} color="#FF5722" />,
      route: 'HRQueries',
    },
    { 
      label: 'Hiring', 
      icon: <MaterialIcons name="person-add" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'HiringTab'
    },
    { 
      label: 'Inbox', 
      icon: <MaterialIcons name="inbox" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'InboxTab'
    },
    { 
      label: 'Employees', 
      icon: <MaterialIcons name="people" size={22} color="#FF5722" />,
      route: 'HREmployees',
    },
    { 
      label: 'Resignation', 
      icon: <MaterialIcons name="person-remove" size={22} color="#FF5722" />,
      route: 'ResignationScreen',
    },
    { 
      label: 'Payroll', 
      icon: <MaterialIcons name="account-balance-wallet" size={22} color="#FF5722" />,
      route: 'PayrollScreen',
    },
    { 
      label: 'Leaves', 
      icon: <MaterialIcons name="event-busy" size={22} color="#FF5722" />,
      route: 'LeavesScreen',
    },
    { 
      label: 'Accessories', 
      icon: <MaterialIcons name="settings" size={22} color="#FF5722" />,
      route: 'AccessoriesScreen',
    },
    { 
      label: 'Profile', 
      icon: <MaterialIcons name="person" size={22} color="#FF5722" />,
      route: 'EmployeeProfile',
    },
    { 
      label: 'Settings', 
      icon: <MaterialIcons name="settings" size={22} color="#FF5722" />,
      route: 'SettingsScreen',
    },
  ] : isPM ? [
    // PM (Project Manager) menu items - using PMTabNavigator tab names
    { 
      label: 'Dashboard', 
      icon: <MaterialIcons name="dashboard" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'HomeTab'
    },
    { 
      label: 'Projects', 
      icon: <MaterialIcons name="folder" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'ProjectsTab'
    },
    { 
      label: 'Tasks', 
      icon: <MaterialIcons name="task" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'TasksTab'
    },
    { 
      label: 'Inbox', 
      icon: <MaterialIcons name="inbox" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'InboxTab'
    },
    { 
      label: 'Sprint Board', 
      icon: <MaterialCommunityIcons name="presentation" size={22} color="#FF5722" />,
      route: 'SprintBoard',
    },
    { 
      label: 'Meeting', 
      icon: <MaterialIcons name="video-call" size={22} color="#FF5722" />,
      route: 'Meeting',
    },
    { 
      label: 'Attendance', 
      icon: <MaterialIcons name="event-available" size={22} color="#FF5722" />,
      route: 'Attendance',
    },
    { 
      label: 'Settings', 
      icon: <Ionicons name="settings-outline" size={22} color="#FF5722" />,
      route: 'AppSettings',
    },
  ] : isOrgAdmin ? [
    { 
      label: 'Dashboard', 
      icon: <MaterialIcons name="dashboard" size={22} color="#FF5722" />,
      route: 'OrgMainTabs',
      screen: 'HomeTab'
    },
    { 
      label: 'Profile', 
      icon: <MaterialIcons name="person" size={22} color="#FF5722" />,
      route: 'OrgAdminProfile',
    },
    { 
      label: 'Dashboard', 
      icon: <MaterialIcons name="dashboard" size={22} color="#FF5722" />, 
      route: 'OrgMainTabs',
      screen: 'OrgHomeTab'
    },
    { 
      label: 'Departments', 
      icon: <MaterialIcons name="apartment" size={22} color="#FF5722" />, 
      route: 'Departments'
    },
    { 
      label: 'Projects', 
      icon: <MaterialIcons name="folder" size={22} color="#FF5722" />, 
      route: 'OrgProjects'
    },
    { 
      label: 'Attendance', 
      icon: <MaterialIcons name="event-available" size={22} color="#FF5722" />, 
      route: 'Attendance'
    },
    { 
      label: 'Activities', 
      icon: <MaterialIcons name="list" size={22} color="#FF5722" />, 
      route: 'OrgActivities'
    },
    { 
      label: 'Inbox', 
      icon: <MaterialIcons name="inbox" size={22} color="#FF5722" />, 
      route: 'OrgMainTabs',
      screen: 'InboxTab'
    },
  ] : [
    // Employee menu items - using EmployeeTabNavigator tab names
    { 
      label: 'Dashboard', 
      icon: <MaterialIcons name="dashboard" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'EmployeeHomeTab'
    },
    { 
      label: 'Tasks', 
      icon: <MaterialIcons name="task" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'EmployeeTaskTab'
    },
    { 
      label: 'Leaves', 
      icon: <MaterialIcons name="event-busy" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'EmployeeLeaveTab'
    },
    { 
      label: 'Inbox', 
      icon: <MaterialIcons name="inbox" size={22} color="#FF5722" />,
      route: 'MainTabs',
      screen: 'EmployeeInboxTab'
    },
    { 
      label: 'Profile', 
      icon: <MaterialIcons name="person" size={22} color="#FF5722" />,
      route: 'EmployeeProfile'
    },
    { 
      label: 'Meeting', 
      icon: <MaterialIcons name="video-call" size={22} color="#FF5722" />,
      route: 'Meeting',
    },
    { 
      label: 'Queries', 
      icon: <MaterialIcons name="help-outline" size={22} color="#FF5722" />,
      route: 'Queries',
    },
    { 
      label: 'Accessories', 
      icon: <MaterialIcons name="devices" size={22} color="#FF5722" />,
      route: 'Accessories',
    },
    { 
      label: 'Settings', 
      icon: <Ionicons name="settings-outline" size={22} color="#FF5722" />,
      route: 'AppSettings',
    },
  ];

        const handleNavigation = (item: any) => {
          try {
            console.log('🔍 Drawer Navigation:', { route: item.route, screen: item.screen });
            
            if (item.screen) {
              // Navigate to a tab container with the specific screen parameter (supports OrgMainTabs and MainTabs)
              console.log('🔍 Navigating to tab container with screen:', { route: item.route, screen: item.screen });
              props.navigation.navigate(item.route as any, { 
                screen: item.screen 
              });
              console.log('🔍 Navigated to tab container with screen parameter');
            } else {
              // Navigate to a regular drawer screen
              console.log('🔍 Navigating to drawer screen:', item.route);
              props.navigation.navigate(item.route as any);
              console.log('🔍 Navigated to drawer screen successfully');
            }
          } catch (error) {
            console.log('🔍 Navigation Error:', error);
            Alert.alert('Navigation Error', `Could not navigate to ${item.route}`);
          }
        };

  const handleLogout = () => {
    dispatch(logout());
    props.navigation.reset({
      index: 0,
      routes: [{ name: 'Login' as never }],
    });
  };

  // Helper function to check if a drawer item is active
  const isItemActive = (item: any): boolean => {
    const state = props.state;
    const currentRoute = state.routes[state.index];
    
    if (item.screen) {
      // For tab navigation items (supports both MainTabs and OrgMainTabs)
      // Only mark as active if this is the current route AND the screen matches
      if (currentRoute.name === item.route) {
        const routeState = (currentRoute.state as any);
        if (routeState && routeState.routes && routeState.index !== undefined) {
          const activeScreen = routeState.routes[routeState.index]?.name;
          return activeScreen === item.screen;
        }
      }
      return false;
    } else {
      // For regular drawer items - only check exact match
      return currentRoute.name === item.route;
    }
  };

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
            source={{ uri: displayUser?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg' }}
            style={styles.userAvatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayUser?.name || 'User'}</Text>
            <Text style={styles.userRole}>{displayUser?.role || 'Guest'}</Text>
          </View>
        </View>
         */}
        {/* Custom Drawer Items */}
        <View style={styles.menuSection}>
          {drawerItems.map((item, index) => {
            const isActive = isItemActive(item);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  isActive && styles.activeMenuItem
                ]}
                onPress={() => handleNavigation(item)}
              >
                <View style={styles.menuIcon}>
                  {item.icon}
                </View>
                <Text style={[
                  styles.menuText,
                  isActive && styles.activeMenuText
                ]}>
                  {item.label}
                </Text>
                
                {isActive && (
                  <View style={styles.activeIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>
      
      {/* Footer with Logout Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
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
    top: '50%',
    transform: [{ translateY: -12 }], // Center vertically (half of height)
    height: 24,
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