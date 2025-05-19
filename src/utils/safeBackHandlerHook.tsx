import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

// Import our single fix
import './backHandlerFix';

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
    
    // Use our enhanced BackHandler
    const subscription = BackHandler.addEventListener('hardwareBackPress', handler);
    
    // Clean up function
    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [handler]);
}

export default useBackHandler;