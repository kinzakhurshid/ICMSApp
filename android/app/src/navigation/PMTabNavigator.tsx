// navigation/PMTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import HomeScreen from '../Screens/HomeScreen';
import InboxWrapper from '../Screens/InboxWrapper';
import ProjectScreen from '../Screens/ProjectScreen';
import ProjectDetailScreen from '../Screens/ProjectDetailScreen';
import TaskScreen from '../Screens/TasksScreen';
import SprintDetailScreenNew from '../Screens/SprintDetailScreenNew';
import EditSprintScreen from '../Screens/EditSprintScreen';
import TaskDetailScreen from '../Screens/TaskDetailScreen';
import EditTaskScreen from '../Screens/EditTaskScreen';
import CreateTaskScreen from '../Screens/CreateTaskScreen';
import CallScreen from '../Screens/CallScreen';
import AppHeader from '../components/AppHeader';
import RequestLeaveScreen from '../Screens/RequestLeaveScreen';
import CreateMeetingScreen from '../Screens/CreateMeetingScreen';
import EditMeetingScreen from '../Screens/EditMeetingScreen';
import CreateProjectScreen from '../Screens/CreateProjectScreen';
import CreateSprintScreen from '../Screens/CreateSprintScreen';

// Define parameter lists
export type HomeStackParamList = {
  HomeMain: undefined;
  RequestLeave: { redirectTo?: string } | undefined;
};

export type ProjectStackParamList = {
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
  CreateProject: undefined;
};

export type TaskStackParamList = {
  TaskList: undefined;
  TaskDetail: { taskId: string };
  EditTask: { taskId: string };
  CreateTask: undefined;
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

export type PMTabParamList = {
  HomeTab: undefined;
  ProjectsTab: undefined;
  TasksTab: undefined;
  InboxTab: undefined;
};

const Tab = createBottomTabNavigator<PMTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProjectStack = createNativeStackNavigator<ProjectStackParamList>();
const TaskStack = createNativeStackNavigator<TaskStackParamList>();
const InboxStack = createNativeStackNavigator<InboxStackParamList>();

// Stack Navigators
const HomeStackNavigator = () => (
  <HomeStack.Navigator>
    <HomeStack.Screen
      name="HomeMain"
      component={HomeScreen}
      options={{ headerShown: false }}
    />
    <HomeStack.Screen
      name="RequestLeave"
      component={RequestLeaveScreen}
      initialParams={{ redirectTo: 'HomeMain' }}
      options={{ headerShown: false }}
    />
  </HomeStack.Navigator>
);

const ProjectStackNavigator = () => (
  <ProjectStack.Navigator>
    <ProjectStack.Screen
      name="ProjectList"
      component={ProjectScreen}
      options={{ headerShown: false }}
    />
    <ProjectStack.Screen
      name="ProjectDetail"
      component={ProjectDetailScreen}
      options={{ headerShown: false }}
    />
    <ProjectStack.Screen
      name="CreateProject"
      component={CreateProjectScreen}
      options={{ headerShown: false }}
    />
  </ProjectStack.Navigator>
);

const TaskStackNavigator = () => (
  <TaskStack.Navigator>
    <TaskStack.Screen
      name="TaskList"
      component={TaskScreen}
      options={{ headerShown: false }}
    />
    <TaskStack.Screen
      name="TaskDetail"
      component={TaskDetailScreen}
      options={{ headerShown: false }}
    />
    <TaskStack.Screen
      name="EditTask"
      component={EditTaskScreen}
      options={{ headerShown: false }}
    />
    <TaskStack.Screen
      name="CreateTask"
      component={CreateTaskScreen}
      options={{ headerShown: false }}
    />
  </TaskStack.Navigator>
);

const InboxStackNavigator = () => (
  <InboxStack.Navigator>
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

// Main Tab Navigator for PM
const PMTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'ProjectsTab') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'TasksTab') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'InboxTab') {
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
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="ProjectsTab"
        component={ProjectStackNavigator}
        options={{ title: 'Projects' }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TaskStackNavigator}
        options={{ title: 'Tasks' }}
      />
      <Tab.Screen
        name="InboxTab"
        component={InboxStackNavigator}
        options={{ title: 'Inbox' }}
      />
    </Tab.Navigator>
  );
};

export default PMTabNavigator;
