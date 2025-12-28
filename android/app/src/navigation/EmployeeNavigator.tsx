// navigation/EmployeeNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from '../components/CustomDrawerContent';
import EmployeeTabNavigator from './EmployeeTabNavigator';
import SettingsScreen from '../Screens/SettingScreen';
import MeetingDashboard from '../Screens/MeetingScreen';
import CreateMeetingScreen from '../Screens/CreateMeetingScreen';
import AppHeader from '../components/AppHeader';
import NotificationsScreen from '../Screens/NotificationsScreen';
import EmployeeProfileScreen from '../Screens/EmployeeProfileScreen';
import EditProfileScreen from '../Screens/EditProfileScreen';
import EmployeeQueriesScreen from '../Screens/EmployeeQueriesScreen';
import CreateQueryScreen from '../Screens/CreateQueryScreen';
import EmployeeAccessoriesScreen from '../Screens/EmployeeAccessoriesScreen';
import CreateAccessoryRequestScreen from '../Screens/CreateAccessoryRequestScreen';
import ProjectDetailScreen from '../Screens/ProjectDetailScreen';
import SprintDetailScreen from '../Screens/SprintDetailScreen';
import Icon from 'react-native-vector-icons/FontAwesome';

export type EmployeeDrawerParamList = {
  MainTabs: undefined;
  EmployeeProfile: undefined;
  EditProfile: undefined;
  Meeting: undefined;
  CreateMeeting: undefined;
  AppSettings: undefined;
  NotificationsScreen: undefined;
  Queries: undefined;
  CreateQuery: undefined;
  Accessories: undefined;
  CreateAccessoryRequest: undefined;
  ProjectDetail: { projectId: string };
  SprintDetail: { sprintId: string };
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
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
          drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
          headerShown: false, // Hide default header since we use AppHeader
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
        name="CreateMeeting"
        component={CreateMeetingScreen}
        options={{
          title: 'Create Meeting',
          drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
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
        name="Queries"
        component={EmployeeQueriesScreen}
        options={{
          title: 'Queries',
          drawerIcon: ({ color, size }) => (
            <Icon name="question-circle" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="Accessories"
        component={EmployeeAccessoriesScreen}
        options={{
          title: 'Accessories',
          drawerIcon: ({ color, size }) => (
            <Icon name="laptop" size={size} color={color} />
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
        name="CreateQuery"
        component={CreateQueryScreen}
        options={{
          title: 'Create Query',
          drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
        }}
      />
      <Drawer.Screen
        name="CreateAccessoryRequest"
        component={CreateAccessoryRequestScreen}
        options={{
          title: 'Create Accessory Request',
          drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
        }}
      />
      <Drawer.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{
          title: 'Project Details',
          drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
        }}
      />
      <Drawer.Screen
        name="SprintDetail"
        component={SprintDetailScreen}
        options={{
          title: 'Sprint Details',
          drawerItemStyle: { display: 'none' }, // Hidden, opened from TaskDetail
        }}
      />
    </Drawer.Navigator>
  );
};

export default EmployeeNavigator;
