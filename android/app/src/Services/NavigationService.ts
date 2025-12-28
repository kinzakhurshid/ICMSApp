// NavigationService.ts
import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as never, params as never);
  }
}

export function navigateToTab(tabName: string) {
  if (navigationRef.isReady()) {
    try {
      // Prefer a simple navigate that preserves the existing history/stack
      // This avoids resetting the app back to the main dashboard.
      navigationRef.navigate('MainTabs' as never, { screen: tabName } as never);
      console.log('🔍 Navigation successful with direct method to tab:', tabName);
    } catch (error) {
      // If navigation fails, just log the error but DO NOT reset to the main dashboard.
      console.log('🔍 Direct navigation to tab failed:', error);
    }
  }
}

export function goBack() {
  if (navigationRef.isReady()) {
    navigationRef.goBack();
  }
}

export function reset(routeName: string, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: routeName as never, params: params as never }],
    });
  }
}
