import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { DrawerParamList } from '../navigation/types';
import { useDispatch } from 'react-redux';
import { logout } from '../states/userSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SettingsScreenNavigationProp = DrawerNavigationProp<DrawerParamList, 'AppSettings'>;

interface SettingsScreenProps {
  navigation: SettingsScreenNavigationProp;
}

const SETTINGS_STORAGE_KEY = 'appSettings';

interface AppSettings {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState<boolean>(true);
  const [darkModeEnabled, setDarkModeEnabled] = React.useState<boolean>(false);

  // Load settings from AsyncStorage on mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
          const parsed: Partial<AppSettings> = JSON.parse(stored);
          if (typeof parsed.notificationsEnabled === 'boolean') {
            setNotificationsEnabled(parsed.notificationsEnabled);
          }
          if (typeof parsed.darkModeEnabled === 'boolean') {
            setDarkModeEnabled(parsed.darkModeEnabled);
          }
        }
      } catch (error) {
        console.error('Error loading app settings:', error);
      }
    };
    loadSettings();
  }, []);

  const saveSettings = async (partial: Partial<AppSettings>) => {
    try {
      const current: AppSettings = {
        notificationsEnabled,
        darkModeEnabled,
      };
      const updated: AppSettings = { ...current, ...partial };
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving app settings:', error);
    }
  };

  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);
    saveSettings({ notificationsEnabled: value });
  };

  const handleToggleDarkMode = (value: boolean) => {
    setDarkModeEnabled(value);
    saveSettings({ darkModeEnabled: value });
    Alert.alert(
      'Theme preference saved',
      value
        ? 'Dark mode will be applied across supported screens.'
        : 'Light mode preference saved.'
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage
              await AsyncStorage.clear();
              // Dispatch logout action
              dispatch(logout());
              // Navigate to login screen or reset navigation stack
              navigation.reset({
                index: 0,
                routes: [{ name: 'MainTabs' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            // Navigate to profile screen from drawer
            try {
              (navigation as any).navigate('EmployeeProfile');
            } catch (e) {
              console.warn('Failed to navigate to EmployeeProfile, falling back:', e);
              Alert.alert('Info', 'Unable to open profile screen.');
            }
          }}
        >
          <View style={styles.settingInfo}>
            <Icon name="person" size={22} color="#d9534f" style={styles.settingIcon} />
            <Text style={styles.settingText}>Account Information</Text>
          </View>
          <Icon name="chevron-right" size={22} color="#a0aec0" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            Alert.alert(
              'Change Password',
              'Password change feature will be available soon. Please contact your administrator for password reset.',
              [{ text: 'OK' }]
            );
          }}
        >
          <View style={styles.settingInfo}>
            <Icon name="lock" size={22} color="#d9534f" style={styles.settingIcon} />
            <Text style={styles.settingText}>Change Password</Text>
          </View>
          <Icon name="chevron-right" size={22} color="#a0aec0" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="notifications" size={22} color="#d9534f" style={styles.settingIcon} />
            <Text style={styles.settingText}>Notifications</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#e2e8f0', true: '#d9534f' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Icon name="dark-mode" size={22} color="#d9534f" style={styles.settingIcon} />
            <Text style={styles.settingText}>Dark Mode</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={handleToggleDarkMode}
            trackColor={{ false: '#e2e8f0', true: '#d9534f' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => {
            (navigation as any).navigate('HelpCenter');
          }}
        >
          <View style={styles.settingInfo}>
            <Icon name="help" size={22} color="#d9534f" style={styles.settingIcon} />
            <Text style={styles.settingText}>Help Center</Text>
          </View>
          <Icon name="chevron-right" size={22} color="#a0aec0" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d9534f',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 16,
  },
  settingText: {
    fontSize: 16,
    color: '#2d3748',
  },
  logoutButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#d9534f',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SettingsScreen;