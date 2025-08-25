import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Admin: undefined;
  HR: undefined;
  PM: undefined;
  QA: undefined;
  Developer: undefined;
  // Add other screens as needed
};

// Export the type for use in components
export type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

// Re-export for convenience
