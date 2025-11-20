// navigation/EmployeeNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from '../components/CustomDrawerContent';
import EmployeeTabNavigator from './EmployeeTabNavigator';
import SettingsScreen from '../Screens/SettingScreen';
import MeetingDashboard from '../Screens/MeetingScreen';
import AppHeader from '../components/AppHeader';
import NotificationsScreen from '../Screens/NotificationsScreen';
import EmployeeProfileScreen from '../Screens/EmployeeProfileScreen';
import FCMTokenTestScreen from '../Screens/FCMTokenTestScreen';
import Icon from 'react-native-vector-icons/FontAwesome';

export type EmployeeDrawerParamList = {
  MainTabs: undefined;
  EmployeeProfile: undefined;
  Meeting: undefined;
  AppSettings: undefined;
  NotificationsScreen: undefined;
  FCMTokenTest: undefined;
};

const Drawer = createDrawerNavigator<EmployeeDrawerParamList>();

const EmployeeNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      initialRouteName="MainTabs"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          width: 300,
          backgroundColor: '#f5f7fa',
        },
        drawerActiveTintColor: '#4a6fdc',
        drawerInactiveTintColor: '#666',
        headerShown: true,
        header: (props) => <AppHeader {...props} />,
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={EmployeeTabNavigator}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="EmployeeProfile"
        component={EmployeeProfileScreen}
        options={{
          title: 'Employee Profile',
          drawerIcon: ({ color, size }) => (
            <Icon name="user" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Meeting"
        component={MeetingDashboard}
        options={{
          title: 'Meetings',
          drawerIcon: ({ color, size }) => (
            <Icon name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
          drawerIcon: ({ color, size }) => (
            <Icon name="bell" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="AppSettings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          drawerIcon: ({ color, size }) => (
            <Icon name="settings" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="FCMTokenTest"
        component={FCMTokenTestScreen}
        options={{
          title: '🔥 FCM Token Test',
          drawerIcon: ({ color, size }) => (
            <Icon name="bug" size={size} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

export default EmployeeNavigator;
