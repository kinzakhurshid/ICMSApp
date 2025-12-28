// navigation/PMNavigator.tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from '../components/CustomDrawerContent';
import PMTabNavigator from './PMTabNavigator';
import SettingsScreen from '../Screens/SettingScreen';
import SprintScreen from '../Screens/SprintScreen';
import SprintDetailScreen from '../Screens/SprintDetailScreen';
import SprintDetailScreenNew from '../Screens/SprintDetailScreenNew';
import EditSprintScreen from '../Screens/EditSprintScreen';
import MeetingDashboard from '../Screens/MeetingScreen';
import CreateMeetingScreen from '../Screens/CreateMeetingScreen';
import EditMeetingScreen from '../Screens/EditMeetingScreen';
import EmployeeLeavePage from '../Screens/EmployeeLeavePage';
import CreateSprintScreen from '../Screens/CreateSprintScreen';
import AppHeader from '../components/AppHeader';
import NotificationsScreen from '../Screens/NotificationsScreen';
import Icon from 'react-native-vector-icons/FontAwesome';

export type PMDrawerParamList = {
  MainTabs: undefined;
  SprintBoard: undefined;
  SprintDetail: { sprintId: string };
  SprintDetailNew: { sprintId: string };
  EditSprint: { sprintId: string };
  CreateSprint: undefined;
  Meeting: undefined;
  CreateMeeting: undefined;
  EditMeeting: { meetingId: string };
  Attendance: undefined;
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
          // Use screen's own header and back handling
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="SprintDetailNew"
        component={SprintDetailScreenNew}
        options={{
          title: 'Sprint Overview',
          drawerItemStyle: { display: 'none' },
          // Use screen's own header and back handling
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="EditSprint"
        component={EditSprintScreen}
        options={{
          title: 'Edit Sprint',
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="CreateSprint"
        component={CreateSprintScreen}
        options={{
          title: 'Create Sprint',
          drawerItemStyle: { display: 'none' },
          headerShown: false,
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
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="EditMeeting"
        component={EditMeetingScreen}
        options={{
          title: 'Edit Meeting',
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Attendance"
        component={EmployeeLeavePage}
        options={{
          title: 'Attendance',
          drawerIcon: ({ color, size }) => (
            <Icon name="calendar-check-o" size={size} color={color} />
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
