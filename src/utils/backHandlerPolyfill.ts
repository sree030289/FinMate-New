import { BackHandler, Platform } from 'react-native';

/**
 * SafeBackHandler: A cross-platform polyfill for React Native's BackHandler
 * 
 * - On Android: Uses the native BackHandler
 * - On iOS/Web: Provides empty implementations that won't crash
 * 
 * This allows you to use the same back button handling code across all platforms.
 */

type BackHandlerListener = () => boolean;

// Create a safe version of BackHandler that works on all platforms
const safeBackHandler = {
  addEventListener(
    eventName: 'hardwareBackPress',
    handler: BackHandlerListener
  ): { remove: () => void } {
    // Only use actual BackHandler on Android
    if (Platform.OS === 'android' && BackHandler?.addEventListener) {
      try {
        return BackHandler.addEventListener(eventName, handler);
      } catch (error) {
        console.warn('Error adding BackHandler event listener:', error);
        // Fallback to dummy implementation
        return { remove: () => {} };
      }
    }
    
    // Return dummy event subscription for iOS and web
    return {
      remove: () => {
        // Empty implementation for non-Android platforms
      }
    };
  },

  // Completely redesigned to avoid using the deprecated method
  removeEventListener(
    eventName: 'hardwareBackPress',
    handler: BackHandlerListener
  ): void {
    // Just log a warning - we won't attempt to call the removed API
    console.warn(
      'BackHandler.removeEventListener is deprecated and not available in newer React Native versions. ' +
      'Please use the remove() method from the event listener subscription returned by addEventListener.'
    );
  },

  exitApp(): void {
    // Only works on Android
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

export default safeBackHandler;
