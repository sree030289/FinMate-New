import { useEffect } from 'react';
import { Platform } from 'react-native';
import NavigationBackHandler from './navigationBackHandlerFix';

/**
 * Custom hook for safely handling back button presses
 * 
 * @param handler Function to call when back button is pressed
 * @returns void
 */
export function useBackHandler(handler: () => boolean) {
  useEffect(() => {
    // Only add the listener on Android
    if (Platform.OS !== 'android') {
      return () => {};
    }
    
    // Use our safe implementation
    const subscription = NavigationBackHandler.addEventListener('hardwareBackPress', handler);
    
    // Clean up function
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [handler]);
}

export default useBackHandler;
