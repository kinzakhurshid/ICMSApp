import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  App: NavigatorScreenParams<DrawerParamList>;
  RoleWebView: { role: string };
};

export type DrawerParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  DeveloperTools?: undefined;
  // Add other drawer screens here
};

// Combine all param lists for type checking
export type RootParamList = RootStackParamList & DrawerParamList;

// Navigation props
export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type DrawerNavigationProps = DrawerNavigationProp<DrawerParamList>;