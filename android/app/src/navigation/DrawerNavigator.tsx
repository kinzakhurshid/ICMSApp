// navigation/DrawerNavigator.tsx (updated)
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import CustomDrawerContent from '../components/CustomDrawerContent';
import MainTabNavigator from './MainNavigater';
import OrgAdminTabNavigator from './OrgAdminTabNavigator';
import SettingsScreen from '../Screens/SettingScreen';
import SprintScreen from '../Screens/SprintScreen';
import SprintDetailScreen from '../Screens/SprintDetailScreen';
import MeetingDashboard from '../Screens/MeetingScreen';
import AppHeader from '../components/AppHeader';
import HomeScreen from '../Screens/HomeScreen';
import NotificationsScreen from '../Screens/NotificationsScreen';
import HREmployeesScreen from '../Screens/HREmployeesScreen';
import HRAttendanceScreen from '../Screens/HRAttendanceScreen';
import ResignationScreen from '../Screens/ResignationScreen';
import PayrollScreen from '../Screens/PayrollScreen';
import LeavesScreen from '../Screens/LeavesScreen';
import AccessoriesScreen from '../Screens/AccessoriesScreen';
import DepartmentsScreen from '../Screens/DepartmentsScreen';
import ProjectScreen from '../Screens/ProjectScreen';
import OrgAdminProjectsScreen from '../Screens/OrgAdminProjectsScreen';
import OrgAdminActivitiesScreen from '../Screens/OrgAdminActivitiesScreen';
import AttendanceScreen from '../Screens/AttendanceScreen';
import HrIdleTimeScreen from '../Screens/HrIdleTimeScreen';
import HrQueriesScreen from '../Screens/HrQueriesScreen';

export type DrawerParamList = {
  MainTabs: undefined;
  SprintBoard: undefined;
  SprintDetail: { sprintId: string };
  Meeting: undefined;
  AppSettings: undefined;
  DeveloperTools: undefined;
  NotificationsScreen: undefined;
  HREmployees: undefined;
  HRAttendance: undefined;
  HRIdleTime: undefined;
  HRQueries: undefined;
  ResignationScreen: undefined;
  PayrollScreen: undefined;
  LeavesScreen: undefined;
  AccessoriesScreen: undefined;
  SettingsScreen: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator: React.FC = () => {
  const user = useSelector((state: RootState) => state.user);
  const role = (user as any)?.role || (user as any)?.currentUser?.role;
  const isOrgAdmin = ['ORG_ADMIN','OrgAdmin','org_admin','Org Admin','ORGADMIN','orgadmin','ORG'].includes((role || '').toString());

  return (
    <Drawer.Navigator
      initialRouteName={isOrgAdmin ? "OrgMainTabs" : "MainTabs"}
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          width: 300,
          backgroundColor: '#f5f7fa',
        },
        drawerActiveTintColor: '#4a6fdc',
        drawerInactiveTintColor: '#666',
        headerShown: true,
        header: (props) => <AppHeader {...props} />,
      }}
    >
      {!isOrgAdmin && (
        <Drawer.Screen
          name="MainTabs"
          component={MainTabNavigator}
          options={{ title: 'Dashboard', headerShown: false }}
        />
      )}
      <Drawer.Screen
        name="OrgMainTabs"
        component={OrgAdminTabNavigator}
        options={{ title: 'Dashboard', headerShown: false, drawerItemStyle: isOrgAdmin ? {} : { display: 'none' } }}
      />

      <Drawer.Screen
        name="SprintBoard"
        component={SprintScreen}
        options={{ title: 'Sprint Board' }}
      />

      <Drawer.Screen
        name="SprintDetail"
        component={SprintDetailScreen}
        options={{ title: 'Sprint Details' }}
      />

      <Drawer.Screen
        name="Meeting"
        component={MeetingDashboard}
        options={{ title: 'Meeting' }}
      />

      {/* Org Admin specific routes */}
      <Drawer.Screen
        name="Departments"
        component={DepartmentsScreen}
        options={{ 
          title: 'Departments',
          headerShown: true,
          drawerItemStyle: isOrgAdmin ? {} : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="OrgProjects"
        component={OrgAdminProjectsScreen}
        options={{ 
          title: 'Projects',
          headerShown: true,
          drawerItemStyle: isOrgAdmin ? {} : { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="OrgActivities"
        component={OrgAdminActivitiesScreen}
        options={{ 
          title: 'Activities',
          headerShown: true,
          drawerItemStyle: isOrgAdmin ? {} : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="Attendance"
        component={isOrgAdmin ? HRAttendanceScreen : AttendanceScreen}
        options={{ 
          title: 'Attendance',
          headerShown: !isOrgAdmin,
          drawerItemStyle: isOrgAdmin ? {} : { display: 'none' },
        }}
      />

      <Drawer.Screen
        name="AppSettings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />

      {/* {user?.role === 'Developer' && ( */}
        <Drawer.Screen
          name="DeveloperTools"
          component={HomeScreen}
          options={{ title: 'Developer Tools' }}
        />
      {/* )} */}
      
              <Drawer.Screen
                name="NotificationsScreen"
                component={NotificationsScreen}
                options={{ 
                  title: 'Notifications',
                  headerShown: true,
                }}
              />
              
              {/* HR Employees Screen */}
              <Drawer.Screen
                name="HREmployees"
                component={HREmployeesScreen}
                options={{ 
                  title: 'Employees',
                  headerShown: true,
                  drawerItemStyle: ((user as any)?.role === 'HR' || (user as any)?.role === 'hr') ? {} : { display: 'none' },
                }}
              />
              
              {/* HR Attendance Screen */}
              <Drawer.Screen
                name="HRAttendance"
                component={HRAttendanceScreen}
                options={{ 
                  title: 'Attendance',
                  headerShown: true,
                  drawerItemStyle: ((user as any)?.role === 'HR' || (user as any)?.role === 'hr') ? {} : { display: 'none' },
                }}
              />
              
              {/* HR Idle Time Screen */}
              <Drawer.Screen
                name="HRIdleTime"
                component={HrIdleTimeScreen}
                options={{ 
                  title: 'Idle Time',
                  headerShown: true,
                  drawerItemStyle: ((user as any)?.role === 'HR' || (user as any)?.role === 'hr') ? {} : { display: 'none' },
                }}
              />
              
              {/* HR Queries Screen */}
              <Drawer.Screen
                name="HRQueries"
                component={HrQueriesScreen}
                options={{ 
                  title: 'Queries',
                  headerShown: true,
                  drawerItemStyle: ((user as any)?.role === 'HR' || (user as any)?.role === 'hr') ? {} : { display: 'none' },
                }}
              />
              
              {/* HR Resignation Screen */}
              <Drawer.Screen
                name="ResignationScreen"
                component={ResignationScreen}
                options={{ 
                  title: 'Resignation',
                  headerShown: true,
                  drawerItemStyle: ((user as any)?.role === 'HR' || (user as any)?.role === 'hr') ? {} : { display: 'none' },
                }}
              />
              
              {/* HR Payroll Screen */}
              <Drawer.Screen
                name="PayrollScreen"
                component={PayrollScreen}
                options={{ 
                  title: 'Payroll',
                  headerShown: true,
                  drawerItemStyle: ((user as any)?.role === 'HR' || (user as any)?.role === 'hr') ? {} : { display: 'none' },
                }}
              />
              
              {/* HR Leaves Screen */}
              <Drawer.Screen
                name="LeavesScreen"
                component={LeavesScreen}
                options={{ 
                  title: 'Leaves',
                  headerShown: true,
                  drawerItemStyle: ((user as any)?.role === 'HR' || (user as any)?.role === 'hr') ? {} : { display: 'none' },
                }}
              />
              
              {/* HR Accessories Screen */}
              <Drawer.Screen
                name="AccessoriesScreen"
                component={AccessoriesScreen}
                options={{ 
                  title: 'Accessories',
                  headerShown: true,
                  drawerItemStyle: ((user as any)?.role === 'HR' || (user as any)?.role === 'hr') ? {} : { display: 'none' },
                }}
              />
              
              {/* HR Settings Screen */}
              <Drawer.Screen
                name="SettingsScreen"
                component={SettingsScreen}
                options={{ 
                  title: 'Settings',
                  headerShown: true,
                  drawerItemStyle: ((user as any)?.role === 'HR' || (user as any)?.role === 'hr') ? {} : { display: 'none' },
                }}
              />
            </Drawer.Navigator>
          );
        };

        export default DrawerNavigator;