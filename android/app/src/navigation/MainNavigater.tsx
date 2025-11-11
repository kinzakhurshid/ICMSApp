// navigation/MainNavigator.tsx (Simplified for HR role)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../Screens/HomeScreen';
import InboxWrapper from '../Screens/InboxWrapper';
import AttendanceScreen from '../Screens/AttendanceScreen';
import HRAttendanceScreen from '../Screens/HRAttendanceScreen';
import HiringScreen from '../Screens/HiringScreen';
import CallScreen from '../Screens/CallScreen';
import HRDashboardScreen from '../Screens/HRDashboardScreen';
import OrgAdminDashboardScreen from '../Screens/OrgAdminDashboardScreen';
import RequestLeaveScreen from '../Screens/RequestLeaveScreen';
import AppHeader from '../components/AppHeader';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';

// Define parameter lists for HR role
export type HomeStackParamList = {
  HomeMain: undefined;
};

export type InboxStackParamList = {
  InboxMain: undefined;
  CallScreen: {
    userName: string;
    userAvatar: string;
    isVideoCall?: boolean;
    isIncoming?: boolean;
  };
};

export type TabParamList = {
  HomeTab: undefined;
  AttendanceTab: undefined;
  HiringTab: undefined;
  InboxTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const InboxStack = createNativeStackNavigator<InboxStackParamList>();
export type AttendanceStackParamList = {
  AttendanceMain: undefined;
  RequestLeave: { redirectTo?: string } | undefined;
};
const AttendanceStack = createNativeStackNavigator<AttendanceStackParamList>();

// Home Stack
function HomeStackScreen() {
  const user = useSelector((state: RootState) => state.user);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  
  // Use currentUser if available, otherwise fall back to user
  const displayUser = currentUser || user;
  
  // Check if user is HR
  const isHR = (displayUser as any)?.role === 'HR' || (displayUser as any)?.role === 'hr';
  const isOrgAdmin = ['ORG_ADMIN','OrgAdmin','org_admin','Org Admin','ORGADMIN','orgadmin','ORG'].includes(((displayUser as any)?.role || '').toString());
  
  console.log('🔍 HomeStackScreen - displayUser:', displayUser);
  console.log('🔍 HomeStackScreen - isHR:', isHR);

  return (
    <HomeStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <AppHeader navigation={navigation} />,
      })}
    >
      <HomeStack.Screen 
        name="HomeMain" 
        component={isHR ? HRDashboardScreen : isOrgAdmin ? OrgAdminDashboardScreen : HomeScreen} 
      />
    </HomeStack.Navigator>
  );
}

// Inbox Stack - Use the wrapper component
function InboxStackScreen() {
  return (
    <InboxStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <AppHeader navigation={navigation} />,
      })}
    >
      <InboxStack.Screen 
        name="InboxMain" 
        component={InboxWrapper}
        options={{ headerShown: false }}
      />
      <InboxStack.Screen 
        name="CallScreen" 
        component={CallScreen}
        options={{ headerShown: false }}
      />
    </InboxStack.Navigator>
  );
}

// Attendance Screen Wrapper - conditionally shows HR or regular attendance
const AttendanceScreenWrapper = () => {
  const user = useSelector((state: RootState) => state.user);
  const currentUser = useSelector((state: RootState) => state.user.currentUser);
  
  // Use currentUser if available, otherwise fall back to user
  const displayUser = currentUser || user;
  
  // Check if user is HR
  const isHR = (displayUser as any)?.role === 'HR' || (displayUser as any)?.role === 'hr';
  
  console.log('🔍 AttendanceScreenWrapper - isHR:', isHR);
  
  return isHR ? <HRAttendanceScreen /> : <AttendanceScreen />;
};

// Attendance Stack
function AttendanceStackScreen() {
  return (
    <AttendanceStack.Navigator screenOptions={{ headerShown: false }}>
      <AttendanceStack.Screen name="AttendanceMain" component={AttendanceScreenWrapper} />
      <AttendanceStack.Screen
        name="RequestLeave"
        component={RequestLeaveScreen}
        initialParams={{ redirectTo: 'AttendanceMain' }}
      />
    </AttendanceStack.Navigator>
  );
}

// Main Tab Navigator - Simplified for HR role only
const MainTabNavigator: React.FC = () => {
  console.log('🔍 MainTabNavigator component created for HR role');
  
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'AttendanceTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'HiringTab') {
            iconName = focused ? 'person-add' : 'person-add-outline';
          } else if (route.name === 'InboxTab') {
            iconName = focused ? 'mail' : 'mail-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5722',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          paddingVertical: 5,
          height: 60,
        },
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackScreen} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="AttendanceTab" 
        component={AttendanceStackScreen} 
        options={{ title: 'Attendance' }}
      />
      <Tab.Screen 
        name="HiringTab" 
        component={HiringScreen} 
        options={{ title: 'Hiring' }}
      />
      <Tab.Screen 
        name="InboxTab" 
        component={InboxStackScreen} 
        options={{ title: 'Inbox' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;