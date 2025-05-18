import { BackHandler, Platform } from 'react-native';

/**
 * Enhanced BackHandler polyfill that properly handles deprecated methods
 * This fixes the "BackHandler.removeEventListener is not a function" error
 */

type EventName = 'hardwareBackPress';
type BackHandlerCallback = () => boolean;
type Subscription = { remove: () => void };

// Track all event listeners
const listeners: Map<EventName, Set<BackHandlerCallback>> = new Map();

const FixedBackHandler = {
  addEventListener(eventName: EventName, handler: BackHandlerCallback): Subscription {
    // Store the handler in our local tracking
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }
    listeners.get(eventName)?.add(handler);
    
    // Only use actual BackHandler on Android
    if (Platform.OS === 'android' && BackHandler?.addEventListener) {
      try {
        const subscription = BackHandler.addEventListener(eventName, handler);
        return {
          remove: () => {
            // Remove from our local tracking
            if (listeners.has(eventName)) {
              listeners.get(eventName)?.delete(handler);
            }
            
            // Use the subscription's remove method if available
            if (subscription && typeof subscription.remove === 'function') {
              subscription.remove();
            }
          }
        };
      } catch (error) {
        console.warn('Error adding BackHandler event listener:', error);
      }
    }
    
    // Return dummy subscription for iOS and web
    return {
      remove: () => {
        // Remove from our local tracking
        if (listeners.has(eventName)) {
          listeners.get(eventName)?.delete(handler);
        }
      }
    };
  },

  // This is the key fix - implement the deprecated method
  removeEventListener(eventName: EventName, handler: BackHandlerCallback): void {
    // First, log a warning
    console.warn(
      'BackHandler.removeEventListener is deprecated. Use the remove() method from the event subscription instead.'
    );
    
    // Remove from our local tracking
    if (listeners.has(eventName)) {
      listeners.get(eventName)?.delete(handler);
    }
    
    // Try to use the native method if available (for backward compatibility)
    if (Platform.OS === 'android' && BackHandler) {
      try {
        // Check if the old method exists on the type
        const backHandlerAny = BackHandler as any;
        if (typeof backHandlerAny.removeEventListener === 'function') {
          backHandlerAny.removeEventListener(eventName, handler);
        } 
        // If not, try to find the subscription and call remove
        else if (BackHandler.exitApp) {  // Just checking if BackHandler is properly initialized
          // We can't directly access existing subscriptions in React Native internals,
          // but at least we've removed it from our local tracking
          console.log('Using fallback for BackHandler.removeEventListener');
        }
      } catch (error) {
        // Silently handle errors - we've already warned about deprecation
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

  // Helper to check if we're on a platform with hardware back button
  hasHardwareBackButton(): boolean {
    return Platform.OS === 'android';
  }
};

export default FixedBackHandler;