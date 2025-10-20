// navigation/MainNavigator.tsx (Simplified for HR role)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../Screens/HomeScreen';
import InboxWrapper from '../Screens/InboxWrapper';
import AttendanceScreen from '../Screens/AttendanceScreen';
import HiringScreen from '../Screens/HiringScreen';
import CallScreen from '../Screens/CallScreen';
import AppHeader from '../components/AppHeader';

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

// Home Stack
function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <AppHeader navigation={navigation} />,
      })}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
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
        component={AttendanceScreen} 
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