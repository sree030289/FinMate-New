/**
 * Global BackHandler Fix
 * 
 * This is the most comprehensive fix for BackHandler issues.
 * It should be imported as early as possible in the app, ideally in App.tsx.
 * 
 * This file directly monkey-patches all relevant BackHandler implementations
 * to ensure that removeEventListener is always available and properly handled.
 */

// Import needed React Native components
import { BackHandler, Platform } from 'react-native';

// Avoid applying patches on non-Android platforms
if (Platform.OS !== 'android') {
  console.log('BackHandler patches not needed on this platform');
} else {
  try {
    console.log('Applying global BackHandler patches');
    
    // Step 1: Create a map to track all handlers and their subscriptions
    const handlerSubscriptions = new Map<() => boolean, { remove: () => void }>();
    
    // Step 2: Store original addEventListener function
    const originalAddEventListener = BackHandler.addEventListener;
    
    // Step 3: Implement a proper removeEventListener function
    const safeRemoveEventListener = function(
      eventName: 'hardwareBackPress',
      handler: () => boolean
    ): void {
      console.log('Global BackHandler.removeEventListener called');
      
      // Find the handler's subscription
      if (handlerSubscriptions.has(handler)) {
        const subscription = handlerSubscriptions.get(handler);
        if (subscription && typeof subscription.remove === 'function') {
          // Call the proper remove method
          subscription.remove();
        }
        // Remove from our tracking
        handlerSubscriptions.delete(handler);
      }
    };
    
    // Step 4: Replace the addEventListener function
    if (originalAddEventListener) {
      BackHandler.addEventListener = function(
        eventName: 'hardwareBackPress',
        handler: () => boolean
      ) {
        console.log('Global enhanced BackHandler.addEventListener called');
        
        // Call original method and get subscription
        const subscription = originalAddEventListener.call(BackHandler, eventName, handler);
        
        // Add to our tracking so we can handle removeEventListener later
        handlerSubscriptions.set(handler, subscription);
        
        return subscription;
      };
    }
    
    // Step 5: Add removeEventListener if it doesn't exist
    if (!(BackHandler as any).removeEventListener) {
      console.log('Adding removeEventListener to BackHandler');
      (BackHandler as any).removeEventListener = safeRemoveEventListener;
    }
    
    // Step 6: Patch global.ReactNative.BackHandler if it exists
    const globalAny = global as any;
    if (globalAny.ReactNative && globalAny.ReactNative.BackHandler) {
      // Replace with our patched versions
      globalAny.ReactNative.BackHandler.addEventListener = BackHandler.addEventListener;
      globalAny.ReactNative.BackHandler.removeEventListener = (BackHandler as any).removeEventListener;
      console.log('Successfully patched global.ReactNative.BackHandler');
    }
    
    // Step 7: Patch any React Navigation specific BackHandler
    if (globalAny.ReactNavigation) {
      // Create a property descriptor for BackHandler that always returns our patched version
      Object.defineProperty(globalAny.ReactNavigation, 'BackHandler', {
        get: function() {
          return {
            addEventListener: BackHandler.addEventListener,
            removeEventListener: (BackHandler as any).removeEventListener,
            exitApp: BackHandler.exitApp
          };
        },
        configurable: true
      });
      console.log('Successfully patched React Navigation BackHandler access');
    }
    
    console.log('Global BackHandler patches successfully applied');
  } catch (e) {
    console.error('Failed to apply global BackHandler patches:', e);
  }
}

export default {
  installed: true
};
