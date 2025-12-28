// navigation/DrawerNavigator.tsx (updated)
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useSelector } from 'react-redux';
import { RootState } from '../states/store';
import CustomDrawerContent from '../components/CustomDrawerContent';
import MainTabNavigator from './MainNavigater';
import OrgAdminTabNavigator from './OrgAdminTabNavigator';
import SettingsScreen from '../Screens/SettingScreen';
import HelpCenterScreen from '../Screens/HelpCenterScreen';
import AboutAppScreen from '../Screens/AboutAppScreen';
import SprintScreen from '../Screens/SprintScreen';
import SprintDetailScreen from '../Screens/SprintDetailScreen';
import MeetingDashboard from '../Screens/MeetingScreen';
import CreateMeetingScreen from '../Screens/CreateMeetingScreen';
import AppHeader from '../components/AppHeader';
import HomeScreen from '../Screens/HomeScreen';
import NotificationsScreen from '../Screens/NotificationsScreen';
import HREmployeesScreen from '../Screens/HREmployeesScreen';
import CreateEmployeeScreen from '../Screens/CreateEmployeeScreen';
import EditEmployeeScreen from '../Screens/EditEmployeeScreen';
import EmployeeDetailScreen from '../Screens/EmployeeDetailScreen';
import CreateJobScreen from '../Screens/CreateJobScreen';
import HiringDetailScreen from '../Screens/HiringDetailScreen';
import EditHiringScreen from '../Screens/EditHiringScreen';
import HRAttendanceScreen from '../Screens/HRAttendanceScreen';
import EmployeeProfileScreen from '../Screens/EmployeeProfileScreen';
import AddAttendanceRecordScreen from '../Screens/AddAttendanceRecordScreen';
import AddIdleTimeScreen from '../Screens/AddIdleTimeScreen';
import AddIdleTimePresetScreen from '../Screens/AddIdleTimePresetScreen';
import EditIdleTimeScreen from '../Screens/EditIdleTimeScreen';
import EditIdleTimePresetScreen from '../Screens/EditIdleTimePresetScreen';
import AddHolidayScreen from '../Screens/AddHolidayScreen';
import HRCreateLeaveScreen from '../Screens/HRCreateLeaveScreen';
import HREditLeaveScreen from '../Screens/HREditLeaveScreen';
import AssignAccessoryScreen from '../Screens/AssignAccessoryScreen';
import ReturnAccessoryScreen from '../Screens/ReturnAccessoryScreen';
import TerminateEmployeeScreen from '../Screens/TerminateEmployeeScreen';
import ResignationScreen from '../Screens/ResignationScreen';
import PayrollScreen from '../Screens/PayrollScreen';
import LeavesScreen from '../Screens/LeavesScreen';
import EditAttendanceRecordScreen from '../Screens/EditAttendanceRecordScreen';
import AccessoriesScreen from '../Screens/AccessoriesScreen';
import CreateAccessoryScreen from '../Screens/CreateAccessoryScreen';
import EditAccessoryScreen from '../Screens/EditAccessoryScreen';
import DepartmentsScreen from '../Screens/DepartmentsScreen';
import ProjectScreen from '../Screens/ProjectScreen';
import OrgAdminProjectsScreen from '../Screens/OrgAdminProjectsScreen';
import ProjectDetailScreen from '../Screens/ProjectDetailScreen';
import OrgAdminActivitiesScreen from '../Screens/OrgAdminActivitiesScreen';
import AttendanceScreen from '../Screens/AttendanceScreen';
import HrIdleTimeScreen from '../Screens/HrIdleTimeScreen';
import HrQueriesScreen from '../Screens/HrQueriesScreen';
import QueryDetailScreen from '../Screens/QueryDetailScreen';
import DepartmentDetailScreen from '../Screens/DepartmentDetailScreen';
import CreateDepartmentScreen from '../Screens/CreateDepartmentScreen';
import EditDepartmentScreen from '../Screens/EditDepartmentScreen';
import EditProfileScreen from '../Screens/EditProfileScreen';
import CreateProjectScreen from '../Screens/CreateProjectScreen';

export type DrawerParamList = {
  MainTabs: undefined;
  SprintBoard: undefined;
  SprintDetail: { sprintId: string };
  Meeting: undefined;
  CreateMeeting: undefined;
  AppSettings: undefined;
  DeveloperTools: undefined;
  NotificationsScreen: undefined;
  HREmployees: undefined;
  CreateEmployee: undefined;
  EditEmployee: { employeeId: string } | undefined;
  EmployeeDetail: { employeeId: string } | undefined;
  HRAttendance: undefined;
  AddAttendanceRecord: undefined;
  AddIdleTime: undefined;
  AddIdleTimePreset: undefined;
  EditIdleTime: { recordId: string };
  EditIdleTimePreset: { presetId: string };
  AddHoliday: undefined;
  HRCreateLeave: undefined;
  AssignAccessory: undefined;
  ReturnAccessory: { assignmentId?: string; accessoryId?: string } | undefined;
  TerminateEmployee: undefined;
  HRIdleTime: undefined;
  HRQueries: undefined;
  QueryDetail: { queryId: string; query?: any };
  ResignationScreen: undefined;
  PayrollScreen: undefined;
  LeavesScreen: undefined;
  EditAttendanceRecord: { record: any } | undefined;
  AccessoriesScreen: undefined;
  CreateAccessory: undefined;
  EditAccessory: { accessoryId: string } | undefined;
  SettingsScreen: undefined;
  HelpCenter: undefined;
  AboutApp: undefined;
  HREditLeave: { leaveId: string };
  DepartmentDetail: { departmentId: string };
  CreateDepartment: undefined;
  EditDepartment: { departmentId: string };
  CreateProject: undefined;
  OrgAdminProfile: undefined;
  EmployeeProfile: undefined;
  EditProfile: undefined;
  CreateJob: undefined;
  HiringDetail: { hiringId: string };
  EditHiring: { hiringId: string };
  ProjectDetail: { projectId: string };
};

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator: React.FC = () => {
  const user = useSelector((state: RootState) => state.user);
  const role = (user as any)?.role || (user as any)?.currentUser?.role;
  const isPM =
    (role as string)?.toLowerCase() === 'pm';
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

      <Drawer.Screen
        name="CreateMeeting"
        component={CreateMeetingScreen}
        options={{ 
          title: 'Create Meeting',
          drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
        }}
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
        name="DepartmentDetail"
        component={DepartmentDetailScreen}
        options={{
          title: 'Department Details',
          drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
        }}
      />
      <Drawer.Screen
        name="CreateDepartment"
        component={CreateDepartmentScreen}
        options={{
          title: 'Create Department',
          drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
        }}
      />
      <Drawer.Screen
        name="EditDepartment"
        component={EditDepartmentScreen}
        options={{
          title: 'Edit Department',
          drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
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

      {/* Org Admin Create Project Screen (reuse PM CreateProjectScreen, hidden from drawer) */}
      <Drawer.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{
          title: 'Create Project',
          // Use the screen's own header/back button instead of Drawer/AppHeader
          headerShown: false,
          drawerItemStyle: { display: 'none' },
        }}
      />

      {/* Org Admin Project Detail Screen (reuse PM ProjectDetailScreen, hidden from drawer) */}
      <Drawer.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{
          title: 'Project Detail',
          headerShown: true,
          drawerItemStyle: { display: 'none' },
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
      <Drawer.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ 
          title: 'Help Center',
          headerShown: true,
          drawerItemStyle: { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="AboutApp"
        component={AboutAppScreen}
        options={{ 
          title: 'About App',
          headerShown: true,
          drawerItemStyle: { display: 'none' },
        }}
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
              
              {/* Create Employee Screen */}
              <Drawer.Screen
                name="CreateEmployee"
                component={CreateEmployeeScreen}
                options={{ 
                  title: 'Create Employee',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Edit Employee Screen */}
              <Drawer.Screen
                name="EditEmployee"
                component={EditEmployeeScreen}
                options={{ 
                  title: 'Edit Employee',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              {/* Employee Detail Screen */}
              <Drawer.Screen
                name="EmployeeDetail"
                component={EmployeeDetailScreen}
                options={{ 
                  title: 'Employee Details',
                  headerShown: true,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Create Job Screen */}
              <Drawer.Screen
                name="CreateJob"
                component={CreateJobScreen}
                options={{ 
                  title: 'Create Job Opening',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Hiring Detail Screen */}
              <Drawer.Screen
                name="HiringDetail"
                component={HiringDetailScreen}
                options={{ 
                  title: 'Hiring Details',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Edit Hiring Screen */}
              <Drawer.Screen
                name="EditHiring"
                component={EditHiringScreen}
                options={{ 
                  title: 'Edit Hiring',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
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
              
              {/* Edit Attendance Record Screen */}
              <Drawer.Screen
                name="EditAttendanceRecord"
                component={EditAttendanceRecordScreen}
                options={{ 
                  title: 'Edit Attendance Record',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Add Attendance Record Screen */}
              <Drawer.Screen
                name="AddAttendanceRecord"
                component={AddAttendanceRecordScreen}
                options={{ 
                  title: 'Add Attendance Record',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Add Idle Time Screen */}
              <Drawer.Screen
                name="AddIdleTime"
                component={AddIdleTimeScreen}
                options={{ 
                  title: 'Add Idle Time',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Add Idle Time Preset Screen */}
              <Drawer.Screen
                name="AddIdleTimePreset"
                component={AddIdleTimePresetScreen}
                options={{ 
                  title: 'Add Idle Time Preset',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              {/* Edit Idle Time Screen */}
              <Drawer.Screen
                name="EditIdleTime"
                component={EditIdleTimeScreen}
                options={{
                  title: 'Edit Idle Time',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              {/* Edit Idle Time Preset Screen */}
              <Drawer.Screen
                name="EditIdleTimePreset"
                component={EditIdleTimePresetScreen}
                options={{
                  title: 'Edit Idle Time Preset',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Add Holiday Screen */}
              <Drawer.Screen
                name="AddHoliday"
                component={AddHolidayScreen}
                options={{ 
                  title: 'Add Holiday',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* HR Create Leave Screen */}
              <Drawer.Screen
                name="HRCreateLeave"
                component={HRCreateLeaveScreen}
                options={{ 
                  title: 'Create Leave',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              {/* HR Edit Leave Screen */}
              <Drawer.Screen
                name="HREditLeave"
                component={HREditLeaveScreen}
                options={{ 
                  title: 'Edit Leave',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Assign Accessory Screen */}
              <Drawer.Screen
                name="AssignAccessory"
                component={AssignAccessoryScreen}
                options={{ 
                  title: 'Assign Accessory',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Return Accessory Screen */}
              <Drawer.Screen
                name="ReturnAccessory"
                component={ReturnAccessoryScreen}
                options={{ 
                  title: 'Return Accessory',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Create Accessory Screen */}
              <Drawer.Screen
                name="CreateAccessory"
                component={CreateAccessoryScreen}
                options={{ 
                  title: 'Add Accessory',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Edit Accessory Screen */}
              <Drawer.Screen
                name="EditAccessory"
                component={EditAccessoryScreen}
                options={{ 
                  title: 'Edit Accessory',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
                }}
              />
              
              {/* Terminate Employee Screen */}
              <Drawer.Screen
                name="TerminateEmployee"
                component={TerminateEmployeeScreen}
                options={{ 
                  title: 'Terminate Employee',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
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
              
              {/* Query Detail Screen */}
              <Drawer.Screen
                name="QueryDetail"
                component={QueryDetailScreen}
                options={{ 
                  title: 'Query Details',
                  headerShown: false,
                  drawerItemStyle: { display: 'none' },
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
      {/* HR Profile Screen (for HR and Employee roles) */}
      <Drawer.Screen
        name="EmployeeProfile"
        component={EmployeeProfileScreen}
        options={{
          title: 'Profile',
          headerShown: true,
          // show for HR and non-PM/non-OrgAdmin employees
          drawerItemStyle:
            (user as any)?.role === 'HR' ||
            (user as any)?.role === 'hr' ||
            (!isPM && !isOrgAdmin)
              ? {}
              : { display: 'none' },
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
              
              {/* OrgAdmin Profile Screen */}
              <Drawer.Screen
                name="OrgAdminProfile"
                component={EmployeeProfileScreen}
                options={{ 
                  title: 'Profile',
                  headerShown: true,
                  drawerItemStyle: isOrgAdmin ? {} : { display: 'none' },
                }}
              />
              
              {/* Edit Profile Screen - accessible from EmployeeProfileScreen */}
              <Drawer.Screen
                name="EditProfile"
                component={EditProfileScreen}
                options={{ 
                  title: 'Edit Profile',
                  headerShown: true,
                  drawerItemStyle: { display: 'none' }, // Hide from drawer, only accessible via navigation
                }}
              />
            </Drawer.Navigator>
          );
        };

        export default DrawerNavigator;