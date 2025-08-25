import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store'
import HomeScreen from '../Screens/HomeScreen';
import ProfileScreen from '../Screens/ProfileScreen';
import SettingsScreen from '../Screens/SettingScreen';
import CreateProject from '../Screens/createProject';
import ProjectOverview from '../Screens/ProjectDetail';
import CustomDrawerContent from '../components/CustomDrawerContent';
import ProjectScreen from '../Screens/ProjectScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InboxScreen from '../Screens/InboxScreen';

const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

// Create a Bottom Tab Navigator for your main app sections
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Projects') {
            iconName = focused ? 'folder' : 'folder-outline';
          } else if (route.name === 'Inbox') {
            iconName = focused ? 'mail' : 'mail-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4a6fdc',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Projects" component={ProjectScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const DrawerNavigator = () => {
  // Use proper typing instead of 'any'
  const user = useSelector((state: RootState) => state.user.user);

  return (
    <Drawer.Navigator
      initialRouteName="MainApp"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          width: 300,
          backgroundColor: '#f5f7fa',
        },
        drawerActiveTintColor: '#4a6fdc',
        drawerInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      {/* Main app with bottom tabs */}
      <Drawer.Screen 
        name="MainApp" 
        component={MainTabNavigator} 
        options={{ title: 'Dashboard' }}
      />
      
      {/* Other drawer items */}
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen 
        name="ProjectCreation" 
        component={CreateProject} 
        options={{ title: 'Create Project' }}
      />
      
      {/* Conditional drawer items */}
      {user?.role === 'Developer' && (
        <Drawer.Screen 
          name="DeveloperTools" 
          component={HomeScreen} 
          options={{ title: 'Developer Tools' }}
        />
      )}
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;