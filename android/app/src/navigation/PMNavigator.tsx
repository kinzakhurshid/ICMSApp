// navigation/PMNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from '../components/CustomDrawerContent';
import PMTabNavigator from './PMTabNavigator';
import SettingsScreen from '../Screens/SettingScreen';
import SprintScreen from '../Screens/SprintScreen';
import SprintDetailScreen from '../Screens/SprintDetailScreen';
import MeetingDashboard from '../Screens/MeetingScreen';
import AppHeader from '../components/AppHeader';
import NotificationsScreen from '../Screens/NotificationsScreen';
import Icon from 'react-native-vector-icons/FontAwesome';

export type PMDrawerParamList = {
  MainTabs: undefined;
  SprintBoard: undefined;
  SprintDetail: { sprintId: string };
  Meeting: undefined;
  AppSettings: undefined;
  NotificationsScreen: undefined;
};

const Drawer = createDrawerNavigator<PMDrawerParamList>();

const PMNavigator: React.FC = () => {
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
        component={PMTabNavigator}
        options={{
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="SprintBoard"
        component={SprintScreen}
        options={{
          title: 'Sprint Board',
          drawerIcon: ({ color, size }) => (
            <Icon name="trello" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="SprintDetail"
        component={SprintDetailScreen}
        options={{
          title: 'Sprint Details',
          drawerItemStyle: { display: 'none' },
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
    </Drawer.Navigator>
  );
};

export default PMNavigator;
