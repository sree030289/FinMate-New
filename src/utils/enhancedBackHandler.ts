import { BackHandler, Platform } from 'react-native';

/**
 * Enhanced BackHandler polyfill that properly handles deprecated methods
 * This fixes the "BackHandler.removeEventListener is not a function" error
 */

type EventName = 'hardwareBackPress';
type BackHandlerCallback = () => boolean;
type Subscription = { remove: () => void };

// Track all event listeners and subscriptions
// This map keeps track of all handlers and their corresponding subscriptions
const handlerSubscriptions: Map<BackHandlerCallback, Subscription> = new Map();
const listeners: Map<EventName, Set<BackHandlerCallback>> = new Map();

// Ensure the global BackHandler has the removeEventListener method
// This is called automatically when this file is imported
const ensureGlobalBackHandlerPatched = () => {
  if (Platform.OS === 'android' && BackHandler) {
    // Add the removeEventListener method if it doesn't exist
    if (!(BackHandler as any).removeEventListener) {
      console.log('Patching global BackHandler.removeEventListener from enhancedBackHandler');
      (BackHandler as any).removeEventListener = function(
        eventName: string, 
        handler: () => boolean
      ) {
        console.warn('BackHandler.removeEventListener is deprecated. Use the remove() method from the event subscription.');
        
        // Find and remove the corresponding subscription
        if (handlerSubscriptions.has(handler)) {
          const subscription = handlerSubscriptions.get(handler);
          if (subscription) {
            subscription.remove();
          }
          handlerSubscriptions.delete(handler);
        }
      };
    }
  }
};

// Run the patch immediately
ensureGlobalBackHandlerPatched();

const EnhancedBackHandler = {
  addEventListener(eventName: EventName, handler: BackHandlerCallback): Subscription {
    // Store the handler in our local tracking
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName)?.add(handler);
    
    // Create a subscription object
    let subscription: Subscription;
    
    // Only use actual BackHandler on Android
    if (Platform.OS === 'android' && BackHandler?.addEventListener) {
      try {
        // Get the subscription from the real BackHandler
        const realSubscription = BackHandler.addEventListener(eventName, handler);
        
        // Create our enhanced subscription
        subscription = {
          remove: () => {
            // Remove from our local tracking
            if (listeners.has(eventName)) {
              listeners.get(eventName)?.delete(handler);
            }
            
            // Remove from subscriptions map
            handlerSubscriptions.delete(handler);
            
            // Call the real subscription's remove method
            if (realSubscription && typeof realSubscription.remove === 'function') {
              realSubscription.remove();
            }
          }
        };
      } catch (error) {
        console.warn('Error adding BackHandler event listener:', error);
        
        // Fallback subscription
        subscription = {
          remove: () => {
            if (listeners.has(eventName)) {
              listeners.get(eventName)?.delete(handler);
            }
            handlerSubscriptions.delete(handler);
          }
        };
      }
    } else {
      // Dummy subscription for iOS and web
      subscription = {
        remove: () => {
          // Remove from our local tracking
          if (listeners.has(eventName)) {
            listeners.get(eventName)?.delete(handler);
          }
          handlerSubscriptions.delete(handler);
        }
      };
    }
    
    // Store the subscription for later use with removeEventListener
    handlerSubscriptions.set(handler, subscription);
    
    return subscription;
  },

  // This is the key fix - implement the deprecated method
  removeEventListener(eventName: EventName, handler: BackHandlerCallback): void {
    // First, log a warning
    console.warn(
      'BackHandler.removeEventListener is deprecated. Use the remove() method from the event subscription instead.'
    );
    
    // Find and remove the corresponding subscription
    if (handlerSubscriptions.has(handler)) {
      const subscription = handlerSubscriptions.get(handler);
      if (subscription) {
        subscription.remove();
      }
      handlerSubscriptions.delete(handler);
    }
    
    // Also remove from our local tracking
    if (listeners.has(eventName)) {
      listeners.get(eventName)?.delete(handler);
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

  // Helper to check if we're on a platform with hardware back button
  hasHardwareBackButton(): boolean {
    return Platform.OS === 'android';
  }
};

// Apply the patch directly to the global BackHandler
if (Platform.OS === 'android' && BackHandler) {
  try {
    // Add our implementation of removeEventListener to the global BackHandler
    if (!(BackHandler as any).removeEventListener) {
      (BackHandler as any).removeEventListener = EnhancedBackHandler.removeEventListener;
    }
    
    // Patch the global object if possible
    const globalAny = global as any;
    if (globalAny.ReactNative && globalAny.ReactNative.BackHandler) {
      if (!globalAny.ReactNative.BackHandler.removeEventListener) {
        globalAny.ReactNative.BackHandler.removeEventListener = EnhancedBackHandler.removeEventListener;
      }
    }
  } catch (error) {
    console.warn('Error applying BackHandler patch:', error);
  }
}

export default EnhancedBackHandler;
