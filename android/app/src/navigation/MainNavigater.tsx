// navigation/MainNavigator.tsx (updated)
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../Screens/HomeScreen';
import InboxScreen from '../Screens/InboxScreen';
import ProfileScreen from '../Screens/ProfileScreen';
import SettingsScreen from '../Screens/SettingScreen';
import RoleWebViewScreen from '../Screens/RoleWebView';
import ProjectScreen from '../Screens/ProjectScreen';
import TaskScreen from '../Screens/TasksScreen';
import ProjectOverview from '../Screens/ProjectDetail';
import AppHeader from '../components/AppHeader';

// Define parameter lists
export type HomeStackParamList = {
  HomeMain: undefined;
  RoleWebView: { role: string };
};

export type ProjectStackParamList = {
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
  CreateProject: undefined;
};

export type TaskStackParamList = {
  TaskList: undefined;
};

export type InboxStackParamList = {
  InboxMain: undefined;
};

export type SettingsStackParamList = {
  SettingsMain: undefined;
  Profile: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  ProjectsTab: undefined;
  TasksTab: undefined;
  InboxTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProjectStack = createNativeStackNavigator<ProjectStackParamList>();
const TaskStack = createNativeStackNavigator<TaskStackParamList>();
const InboxStack = createNativeStackNavigator<InboxStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

// Home Stack
function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <AppHeader navigation={navigation} />,
      })}
    >
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen 
        name="RoleWebView" 
        component={RoleWebViewScreen}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}

// Project Stack
function ProjectStackScreen() {
  return (
    <ProjectStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <AppHeader navigation={navigation} />,
      })}
    >
      <ProjectStack.Screen name="ProjectList" component={ProjectScreen} />
      <ProjectStack.Screen name="ProjectDetail" component={ProjectOverview} />
      {/* <ProjectStack.Screen name="CreateProject" component={CreateProject} /> */}
    </ProjectStack.Navigator>
  );
}

// Task Stack
function TaskStackScreen() {
  return (
    <TaskStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <AppHeader navigation={navigation} />,
      })}
    >
      <TaskStack.Screen name="TaskList" component={TaskScreen} />
    </TaskStack.Navigator>
  );
}

// Inbox Stack
function InboxStackScreen() {
  return (
    <InboxStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <AppHeader navigation={navigation} />,
      })}
    >
      <InboxStack.Screen name="InboxMain" component={InboxScreen} />
    </InboxStack.Navigator>
  );
}

// Profile Stack
function ProfileStackScreen() {
  return (
    <SettingsStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <AppHeader navigation={navigation} />,
      })}
    >
      <SettingsStack.Screen name="Profile" component={ProfileScreen} />
    </SettingsStack.Navigator>
  );
}

// Settings Stack
function SettingsStackScreen() {
  return (
    <SettingsStack.Navigator
      screenOptions={({ navigation }) => ({
        header: () => <AppHeader navigation={navigation} />,
      })}
    >
      <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} />
    </SettingsStack.Navigator>
  );
}

// Main Tab Navigator
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProjectsTab') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'TasksTab') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'InboxTab') {
            iconName = focused ? 'mail' : 'mail-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
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
        name="ProjectsTab" 
        component={ProjectStackScreen} 
        options={{ title: 'Projects' }}
      />
      <Tab.Screen 
        name="TasksTab" 
        component={TaskStackScreen} 
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen 
        name="InboxTab" 
        component={InboxStackScreen} 
        options={{ title: 'Inbox' }}
      />
      {/* <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackScreen} 
        options={{ title: 'Profile' }}
      /> */}
    </Tab.Navigator>
  );
};

export default MainTabNavigator;