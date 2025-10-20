// navigation/DrawerNavigator.tsx (updated)
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import CustomDrawerContent from '../components/CustomDrawerContent';
import MainTabNavigator from './MainNavigater';
import SettingsScreen from '../Screens/SettingScreen';
import SprintScreen from '../Screens/SprintScreen';
import SprintDetailScreen from '../Screens/SprintDetailScreen';
import MeetingDashboard from '../Screens/MeetingScreen';
import AppHeader from '../components/AppHeader';
import HomeScreen from '../Screens/HomeScreen';
import NotificationsScreen from '../Screens/NotificationsScreen';

export type DrawerParamList = {
  MainTabs: undefined;
  SprintBoard: undefined;
  SprintDetail: { sprintId: string };
  Meeting: undefined;
  AppSettings: undefined;
  DeveloperTools: undefined;
  NotificationsScreen: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator: React.FC = () => {
  const user = useSelector((state: RootState) => state.user);

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
        component={MainTabNavigator}
        options={{
          title: 'Dashboard',
          headerShown: false,
        }}
      />

      <Drawer.Screen
        name="SprintBoard"
        component={SprintScreen}
        options={{ title: 'Sprint Board' }}
      />

      <Drawer.Screen
        name="SprintDetail"
        component={SprintDetailScreen}
        options={{ title: 'Sprint Details' }}
      />

      <Drawer.Screen
        name="Meeting"
        component={MeetingDashboard}
        options={{ title: 'Meeting' }}
      />

      <Drawer.Screen
        name="AppSettings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />

      {/* {user?.role === 'Developer' && ( */}
        <Drawer.Screen
          name="DeveloperTools"
          component={HomeScreen}
          options={{ title: 'Developer Tools' }}
        />
      {/* )} */}
      
      <Drawer.Screen
        name="NotificationsScreen"
        component={NotificationsScreen}
        options={{ 
          title: 'Notifications',
          headerShown: true,
        }}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;