/**
 * NavigationBackHandlerFix
 * 
 * This file provides comprehensive fixes for BackHandler issues in React Navigation
 * and other libraries that use BackHandler.removeEventListener directly.
 * 
 * The key issue is that in newer versions of React Native, BackHandler.removeEventListener
 * is deprecated and not implemented, but some libraries still use it.
 */

import { BackHandler, Platform } from 'react-native';

// Store original functions
const originalAddEventListener = BackHandler?.addEventListener;
const handlers: Map<string, Set<() => boolean>> = new Map();
const handlerSubscriptions: Map<() => boolean, { remove: () => void }> = new Map();

/**
 * Make sure BackHandler.removeEventListener exists
 */
function ensureRemoveEventListenerExists() {
  if (Platform.OS === 'android' && BackHandler && !(BackHandler as any).removeEventListener) {
    console.log('Adding removeEventListener to BackHandler');
    
    // Add our implementation
    (BackHandler as any).removeEventListener = function(
      eventName: 'hardwareBackPress', 
      handler: () => boolean
    ) {
      console.log('NavigationFix: removeEventListener called');
      
      // Get the subscription if we have it tracked
      const subscription = handlerSubscriptions.get(handler);
      if (subscription) {
        // Call the proper remove method
        subscription.remove();
        handlerSubscriptions.delete(handler);
      }
      
      // Also remove from our handler sets
      if (handlers.has(eventName)) {
        const handlersSet = handlers.get(eventName);
        if (handlersSet) {
          handlersSet.delete(handler);
        }
      }
    };
  }
}

/**
 * Replace the original addEventListener with our tracked version
 */
function enhanceAddEventListener() {
  if (Platform.OS === 'android' && BackHandler && originalAddEventListener) {
    console.log('Enhancing BackHandler.addEventListener');
    
    BackHandler.addEventListener = function(
      eventName: 'hardwareBackPress', 
      handler: () => boolean
    ) {
      console.log('NavigationFix: addEventListener called');
      
      // Track this handler
      if (!handlers.has(eventName)) {
        handlers.set(eventName, new Set());
      }
      
      handlers.get(eventName)?.add(handler);
      
      // Call original and get subscription
      const subscription = originalAddEventListener.call(BackHandler, eventName, handler);
      
      // Store the subscription for this handler
      handlerSubscriptions.set(handler, subscription);
      
      // Return the subscription
      return subscription;
    };
  }
}

/**
 * Apply patches to global ReactNative object if available
 */
function patchGlobalBackHandler() {
  try {
    const globalAny = global as any;
    
    // Check if ReactNative is available in global
    if (globalAny.ReactNative && globalAny.ReactNative.BackHandler) {
      console.log('Patching global ReactNative.BackHandler');
      
      // Make sure removeEventListener exists
      if (!globalAny.ReactNative.BackHandler.removeEventListener) {
        globalAny.ReactNative.BackHandler.removeEventListener = (BackHandler as any).removeEventListener;
      }
      
      // Use our tracked addEventListener
      globalAny.ReactNative.BackHandler.addEventListener = BackHandler.addEventListener;
    }
  } catch (error) {
    console.warn('Failed to patch global BackHandler:', error);
  }
}

/**
 * Apply all patches
 */
function applyAllPatches() {
  ensureRemoveEventListenerExists();
  enhanceAddEventListener();
  patchGlobalBackHandler();
}

// Run patches immediately
applyAllPatches();

/**
 * Helper function to safely add a back handler
 * Use this instead of directly using BackHandler.addEventListener
 */
export function addBackHandler(handler: () => boolean) {
  // Make sure patches are applied
  applyAllPatches();
  
  // Use the patched BackHandler
  return BackHandler.addEventListener('hardwareBackPress', handler);
}

/**
 * Export our patched BackHandler
 */
export default {
  addEventListener: BackHandler.addEventListener,
  removeEventListener: (BackHandler as any).removeEventListener,
  exitApp: BackHandler.exitApp,
};
