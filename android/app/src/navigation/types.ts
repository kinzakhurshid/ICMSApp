// navigation/types.ts
export type RootStackParamList = {
  DrawerNavigator: undefined;
  // Add other root-level screens if needed
};

export type DrawerParamList = {
  MainTabs: undefined;
  SprintBoard: undefined;
  Meeting: undefined;
  AppSettings: undefined;
  DeveloperTools: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  ProjectsTab: undefined;
  TasksTab: undefined;
  InboxTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  HomeMain: undefined;
  RoleWebView: { role: string };
};

export type ProjectStackParamList = {
  ProjectList: undefined;
  ProjectDetail: { projectId: string };
  CreateProject: undefined;
  EditProject: { projectId: string };
};

export type TaskStackParamList = {
  TaskList: undefined;
};

// Combine all param lists for useNavigation hook
export type AppNavigationProp = {
  navigate: (screen: keyof RootStackParamList | keyof DrawerParamList | keyof TabParamList) => void;
  // Add more navigation methods as needed
};