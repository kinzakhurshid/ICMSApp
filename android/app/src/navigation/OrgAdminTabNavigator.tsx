import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OrgAdminDashboardScreen from '../Screens/OrgAdminDashboardScreen';
import DepartmentsScreen from '../Screens/DepartmentsScreen';
import OrgAdminActivitiesScreen from '../Screens/OrgAdminActivitiesScreen';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InboxWrapper from '../Screens/InboxWrapper';
import CallScreen from '../Screens/CallScreen';
import AppHeader from '../components/AppHeader';

export type OrgAdminTabParamList = {
  OrgHomeTab: undefined;
  DepartmentsTab: undefined;
  ActivitiesTab: undefined;
  InboxTab: undefined;
};

const Tab = createBottomTabNavigator<OrgAdminTabParamList>();
const InboxStack = createNativeStackNavigator();

function InboxStackScreen() {
  return (
    <InboxStack.Navigator
      screenOptions={({ navigation }) => ({ header: () => <AppHeader navigation={navigation} /> })}
    >
      <InboxStack.Screen name="InboxMain" component={InboxWrapper} options={{ headerShown: false }} />
      <InboxStack.Screen name="CallScreen" component={CallScreen} options={{ headerShown: false }} />
    </InboxStack.Navigator>
  );
}

const OrgAdminTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="OrgHomeTab"
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home-outline';
          if (route.name === 'OrgHomeTab') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'DepartmentsTab') iconName = focused ? 'albums' : 'albums-outline';
          else if (route.name === 'ActivitiesTab') iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          else if (route.name === 'InboxTab') iconName = focused ? 'mail' : 'mail-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5722',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
        header: () => (
          <AppHeader navigation={(navigation.getParent?.() as any) || navigation} />
        ),
        tabBarStyle: { paddingVertical: 5, height: 60 },
      })}
    >
      <Tab.Screen name="OrgHomeTab" component={OrgAdminDashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="DepartmentsTab" component={DepartmentsScreen} options={{ title: 'Departments' }} />
      <Tab.Screen name="ActivitiesTab" component={OrgAdminActivitiesScreen} options={{ title: 'Activities' }} />
      <Tab.Screen name="InboxTab" component={InboxStackScreen} options={{ title: 'Inbox' }} />
    </Tab.Navigator>
  );
};

export default OrgAdminTabNavigator;


