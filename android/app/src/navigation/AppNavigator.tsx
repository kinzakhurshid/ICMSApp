import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../Screens/LoginScreen';
import SignupScreen from '../Screens/SignupScreen';
import DrawerNavigator from './DrawerNavigator';
import RoleWebViewScreen from '../Screens/RoleWebView';
import createProject from '../Screens/createProject';
import ProjectOverview from '../Screens/ProjectDetail';
import ProjectScreen from '../Screens/ProjectScreen';
const Stack = createNativeStackNavigator();

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  App: undefined;
  RoleWebView: { role: string };
};

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="Signup" 
        component={SignupScreen} 
        options={{ headerShown: false }} 
      />
       <Stack.Screen 
        name="CreateProject" 
        component={createProject} 
        options={{ headerShown: false }} 
      />
         <Stack.Screen 
        name="ProjectOverview" 
        component={ProjectOverview} 
        options={{ headerShown: false }} 
      />
        <Stack.Screen 
        name="Projects" 
        component={ProjectScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="App" 
        component={DrawerNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="RoleWebView" 
        component={RoleWebViewScreen} 
        options={{ title: 'Dashboard' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;