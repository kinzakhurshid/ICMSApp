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
      // Method 1: Try to navigate directly to the tab with screen parameter
      navigationRef.navigate('MainTabs' as never, { screen: tabName });
      console.log('🔍 Navigation successful with direct method');
    } catch (error) {
      console.log('🔍 Direct navigation failed, trying alternative:', error);
      try {
        // Method 2: Use CommonActions
        const action = CommonActions.navigate({
          name: 'MainTabs',
          params: {
            screen: tabName,
          },
        });
        navigationRef.dispatch(action);
        console.log('🔍 Navigation successful with CommonActions');
      } catch (commonError) {
        console.log('🔍 CommonActions failed, trying reset method:', commonError);
        try {
          // Method 3: Use reset to navigate to the specific tab
          navigationRef.reset({
            index: 0,
            routes: [
              {
                name: 'MainTabs' as never,
                state: {
                  routes: [
                    { name: 'HomeTab' as never },
                    { name: tabName as never },
                  ],
                  index: 1, // Set the target tab as active
                },
              },
            ],
          });
          console.log('🔍 Navigation successful with reset method');
        } catch (resetError) {
          console.log('🔍 All navigation methods failed:', resetError);
          // Final fallback: just navigate to MainTabs
          navigationRef.navigate('MainTabs' as never);
        }
      }
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
