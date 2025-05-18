import { BackHandler, Platform } from 'react-native';

/**
 * SafeBackHandler: A direct replacement for the problematic backHandlerPolyfill
 * This fixes the "BackHandler.removeEventListener is not a function" error
 */

type BackHandlerListener = () => boolean;

// Create a dummy subscription method that can be returned
function createSubscription(handler: BackHandlerListener) {
  return {
    remove: () => {
      // For Android, try to remove correctly
      if (Platform.OS === 'android' && BackHandler) {
        // If removeEventListener exists on BackHandler (old RN versions)
        if (typeof (BackHandler as any).removeEventListener === 'function') {
          try {
            (BackHandler as any).removeEventListener('hardwareBackPress', handler);
          } catch (e) {
            console.log('Error during removeEventListener:', e);
          }
        }
        // Otherwise just log it was removed
        console.log('Back handler subscription removed');
      }
    }
  };
}

// Simple BackHandler implementation
const safeBackHandler = {
  addEventListener(
    eventName: 'hardwareBackPress',
    handler: BackHandlerListener
  ) {
    // Only actually add listener on Android
    if (Platform.OS === 'android' && BackHandler?.addEventListener) {
      try {
        // Use the real BackHandler
        return BackHandler.addEventListener(eventName, handler);
      } catch (error) {
        console.warn('Error adding BackHandler event listener:', error);
      }
    }
    
    // Return dummy subscription for iOS and web or if real add failed
    return createSubscription(handler);
  },
  
  // THIS IS THE PROBLEMATIC METHOD - provide direct implementation
  removeEventListener(
    eventName: 'hardwareBackPress',
    handler: BackHandlerListener
  ): void {
    console.warn(
      'BackHandler.removeEventListener is deprecated. Use the remove() method from the event listener subscription.'
    );
    
    // Try to handle it for Android if the real BackHandler exists
    if (Platform.OS === 'android' && BackHandler) {
      try {
        // If removeEventListener exists on BackHandler (old RN versions)
        const backHandlerAny = BackHandler as any;
        if (typeof backHandlerAny.removeEventListener === 'function') {
          backHandlerAny.removeEventListener(eventName, handler);
        } else {
          console.log('removeEventListener not available on BackHandler');
        }
      } catch (error) {
        console.warn('Error during removeEventListener:', error);
      }
    }
  },
  
  exitApp(): void {
    if (Platform.OS === 'android' && BackHandler?.exitApp) {
      try {
        BackHandler.exitApp();
      } catch (error) {
        console.warn('Error calling BackHandler.exitApp:', error);
      }
    } else {
      console.log('exitApp is only supported on Android');
    }
  },
  
  hasHardwareBackButton(): boolean {
    return Platform.OS === 'android';
  }
};

export default safeBackHandler;