// androidPermissions.ts
import { PermissionsAndroid, Platform } from 'react-native';

export const requestAndroidPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;

    try {
        const permissions = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, // For Bluetooth
        ]);

        const cameraGranted = permissions[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted';
        const audioGranted = permissions[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted';
        
        if (!cameraGranted) {
            console.warn('Camera permission denied');
        }
        
        if (!audioGranted) {
            console.warn('Audio recording permission denied');
        }

        return cameraGranted && audioGranted;
    } catch (error) {
        console.error('Error requesting permissions:', error);
        return false;
    }
};