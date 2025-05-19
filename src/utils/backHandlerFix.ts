import { BackHandler, Platform } from 'react-native';

// Add TypeScript type definition
declare module 'react-native' {
  interface BackHandlerStatic {
    removeEventListener: (eventName: 'hardwareBackPress', handler: () => boolean) => void;
  }
}

// Store original addEventListener to avoid losing functionality
const originalAddEventListener = BackHandler.addEventListener;

// Map to track all handler subscriptions
const handlers = new Map<() => boolean, { remove: () => void }>();

// Track active handlers using a Set 
const activeHandlers = new Set<() => boolean>();

// Replace addEventListener to track subscriptions
BackHandler.addEventListener = function(
  eventName: 'hardwareBackPress',
  handler: () => boolean
) {
  // Use original method and get subscription
  const subscription = originalAddEventListener.call(BackHandler, eventName, handler);
  
  // Track this handler and its subscription
  handlers.set(handler, subscription);
  activeHandlers.add(handler);
  
  // Return enhanced subscription with extra tracking
  return {
    remove: () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
      handlers.delete(handler);
      activeHandlers.delete(handler);
    }
  };
};

// Add removeEventListener implementation
if (!(BackHandler as any).removeEventListener) {
  (BackHandler as any).removeEventListener = function(
    eventName: 'hardwareBackPress',
    handler: () => boolean
  ): void {
    // Get subscription for this handler
    const subscription = handlers.get(handler);
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
    }
    
    // Clean up tracking
    handlers.delete(handler);
    activeHandlers.delete(handler);
  };
}

// Patch global.ReactNative.BackHandler
try {
  const globalAny = global as any;
  if (globalAny.ReactNative && globalAny.ReactNative.BackHandler) {
    globalAny.ReactNative.BackHandler.addEventListener = BackHandler.addEventListener;
    globalAny.ReactNative.BackHandler.removeEventListener = (BackHandler as any).removeEventListener;
  }
} catch (error) {
  console.error('Failed to patch global ReactNative BackHandler:', error);
}

// Patch global.ReactNavigation.BackHandler
try {
  const globalAny = global as any;
  if (globalAny.ReactNavigation && globalAny.ReactNavigation.BackHandler) {
    globalAny.ReactNavigation.BackHandler = {
      addEventListener: BackHandler.addEventListener,
      removeEventListener: (BackHandler as any).removeEventListener
    };
  }
} catch (error) {
  console.error('Failed to patch ReactNavigation BackHandler:', error);
}

export default BackHandler;