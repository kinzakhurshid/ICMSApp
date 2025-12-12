// navigation/EmployeeTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import EmployeeDashboard from '../Screens/EmployeeDashboard';
import EmployeeTasksScreen from '../Screens/EmployeeTasksScreen';
import EmployeeLeavePage from '../Screens/EmployeeLeavePage';
import RequestLeaveScreen from '../Screens/RequestLeaveScreen';
import InboxWrapper from '../Screens/InboxWrapper';
import CallScreen from '../Screens/CallScreen';
import TaskDetailScreen from '../Screens/TaskDetailScreen';
import AppHeader from '../components/AppHeader';

// Define parameter lists
export type EmployeeHomeStackParamList = {
  EmployeeHomeMain: undefined;
};

export type EmployeeTaskStackParamList = {
  EmployeeTaskMain: undefined;
  TaskDetail: { taskId: string };
};

export type EmployeeLeaveStackParamList = {
  EmployeeLeaveMain: undefined;
  RequestLeave: { redirectTo?: string } | undefined;
};

export type EmployeeInboxStackParamList = {
  EmployeeInboxMain: undefined;
  CallScreen: {
    userName: string;
    userAvatar: string;
    isVideoCall?: boolean;
    isIncoming?: boolean;
  };
};

export type EmployeeTabParamList = {
  EmployeeHomeTab: undefined;
  EmployeeTaskTab: undefined;
  EmployeeLeaveTab: undefined;
  EmployeeInboxTab: undefined;
};

const Tab = createBottomTabNavigator<EmployeeTabParamList>();
const EmployeeHomeStack = createNativeStackNavigator<EmployeeHomeStackParamList>();
const EmployeeTaskStack = createNativeStackNavigator<EmployeeTaskStackParamList>();
const EmployeeLeaveStack = createNativeStackNavigator<EmployeeLeaveStackParamList>();
const EmployeeInboxStack = createNativeStackNavigator<EmployeeInboxStackParamList>();

// Stack Navigators
const EmployeeHomeStackNavigator = () => (
  <EmployeeHomeStack.Navigator>
    <EmployeeHomeStack.Screen
      name="EmployeeHomeMain"
      component={EmployeeDashboard}
      options={{ headerShown: false }}
    />
  </EmployeeHomeStack.Navigator>
);

const EmployeeTaskStackNavigator = () => (
  <EmployeeTaskStack.Navigator>
    <EmployeeTaskStack.Screen
      name="EmployeeTaskMain"
      component={EmployeeTasksScreen}
      options={{ headerShown: false }}
    />
    <EmployeeTaskStack.Screen
      name="TaskDetail"
      component={TaskDetailScreen}
      options={{ headerShown: false }}
    />
  </EmployeeTaskStack.Navigator>
);

const EmployeeLeaveStackNavigator = () => (
  <EmployeeLeaveStack.Navigator>
    <EmployeeLeaveStack.Screen
      name="EmployeeLeaveMain"
      component={EmployeeLeavePage}
      options={{ headerShown: false }}
    />
    <EmployeeLeaveStack.Screen
      name="RequestLeave"
      component={RequestLeaveScreen}
      options={{ headerShown: false }}
    />
  </EmployeeLeaveStack.Navigator>
);

const EmployeeInboxStackNavigator = () => (
  <EmployeeInboxStack.Navigator>
    <EmployeeInboxStack.Screen
      name="EmployeeInboxMain"
      component={InboxWrapper}
      options={{ headerShown: false }}
    />
    <EmployeeInboxStack.Screen
      name="CallScreen"
      component={CallScreen}
      options={{ headerShown: false }}
    />
  </EmployeeInboxStack.Navigator>
);

// Main Tab Navigator for Employee
const EmployeeTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'EmployeeHomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'EmployeeTaskTab') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'EmployeeLeaveTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'EmployeeInboxTab') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="EmployeeHomeTab"
        component={EmployeeHomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="EmployeeTaskTab"
        component={EmployeeTaskStackNavigator}
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen
        name="EmployeeLeaveTab"
        component={EmployeeLeaveStackNavigator}
        options={{ title: 'Leaves' }}
      />
      <Tab.Screen
        name="EmployeeInboxTab"
        component={EmployeeInboxStackNavigator}
        options={{ title: 'Inbox' }}
      />
    </Tab.Navigator>
  );
};

export default EmployeeTabNavigator;
