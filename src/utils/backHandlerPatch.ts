/**
 * This script directly patches React Native's BackHandler
 * Add this import at the top of your project's index.js/App.tsx
 */

import { Platform, BackHandler } from 'react-native';

// Store references to existing handlers to avoid losing them
const handlers = new Map<() => boolean, any>();

// Define a proper implementation of removeEventListener
const safeRemoveEventListener = function(
  eventName: string, 
  handler: () => boolean
) {
  console.warn('BackHandler.removeEventListener is deprecated. Please use the remove() method from the event subscription.');
  
  // Try to find and remove the subscription if possible
  if (handlers.has(handler)) {
    const subscription = handlers.get(handler);
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
    }
    handlers.delete(handler);
  }
};

// Enhance addEventListener to track handlers
const originalAddEventListener = BackHandler.addEventListener;
if (Platform.OS === 'android' && BackHandler && originalAddEventListener) {
  BackHandler.addEventListener = function(
    eventName: string,
    handler: () => boolean
  ) {
    const subscription = originalAddEventListener.call(BackHandler, eventName, handler);
    handlers.set(handler, subscription);
    return subscription;
  };
}

// Direct patch for BackHandler
if (Platform.OS === 'android' && BackHandler) {
  // If removeEventListener doesn't exist, add it as our implementation
  if (!(BackHandler as any).removeEventListener) {
    console.log('Applying BackHandler patch for removeEventListener');
    (BackHandler as any).removeEventListener = safeRemoveEventListener;
  }
}

// Patch global object as well
try {
  const globalAny = global as any;
  if (globalAny.ReactNative && globalAny.ReactNative.BackHandler) {
    // Store the original BackHandler object
    const originalBackHandler = globalAny.ReactNative.BackHandler;
    
    // Create an enhanced BackHandler with our implementation
    const enhancedBackHandler = {
      ...originalBackHandler,
      removeEventListener: safeRemoveEventListener
    };
    
    // Replace the global BackHandler with our enhanced version
    globalAny.ReactNative.BackHandler = enhancedBackHandler;
    console.log('Successfully patched global ReactNative.BackHandler');
  }
} catch (error) {
  console.warn('Could not patch global BackHandler:', error);
}

export default {};