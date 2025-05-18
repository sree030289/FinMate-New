import React, { ReactNode, useEffect } from 'react';
import { View, ViewStyle, Platform, BackHandler } from 'react-native';
import EnhancedBackHandler from '../utils/enhancedBackHandler';
import NavigationBackHandler from '../utils/navigationBackHandlerFix';

interface BackHandlerProviderProps {
  children: ReactNode;
  style?: ViewStyle;
}

// This comprehensive patch applies multiple fixes
const applyAllBackHandlerFixes = () => {
  try {
    // Get global ReactNative object if available
    const globalAny = global as any;
    
    // 1. Ensure BackHandler.removeEventListener exists on the React Native BackHandler
    if (Platform.OS === 'android' && BackHandler) {
      if (!(BackHandler as any).removeEventListener) {
        console.log('Final patching of BackHandler.removeEventListener in BackHandlerProvider');
        // Use our comprehensive implementation from NavigationBackHandler
        (BackHandler as any).removeEventListener = NavigationBackHandler.removeEventListener;
      }
    }
    
    // 2. Apply patch to global.ReactNative.BackHandler if it exists
    if (globalAny.ReactNative && globalAny.ReactNative.BackHandler) {
      if (!globalAny.ReactNative.BackHandler.removeEventListener) {
        globalAny.ReactNative.BackHandler.removeEventListener = NavigationBackHandler.removeEventListener;
        console.log('Finally patched global ReactNative.BackHandler in provider');
      }
      
      // Make sure all BackHandler methods are properly tracked across the app
      const originalAddEventListener = globalAny.ReactNative.BackHandler.addEventListener;
      globalAny.ReactNative.BackHandler.addEventListener = function(eventName: string, handler: () => boolean) {
        console.log('BackHandlerProvider: Intercepted addEventListener call');
        return NavigationBackHandler.addEventListener(eventName, handler);
      };
    }
    
    // 3. Replace BackHandler completely in React Navigation context if needed
    if (globalAny.ReactNavigation && globalAny.ReactNavigation.BackHandler) {
      console.log('Patching ReactNavigation.BackHandler');
      globalAny.ReactNavigation.BackHandler = NavigationBackHandler;
    }
  } catch (error) {
    console.warn('Could not apply all BackHandler patches:', error);
  }
};

const BackHandlerProvider: React.FC<BackHandlerProviderProps> = ({ children, style }) => {
  useEffect(() => {
    // Apply all patches when the component mounts
    applyAllBackHandlerFixes();
    
    // Monitor for any issues
    const testBackHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('BackHandlerProvider test handler triggered');
      return false; // Allow default behavior
    });
    
    // Clean up
    return () => {
      if (testBackHandler && typeof testBackHandler.remove === 'function') {
        testBackHandler.remove();
      }
    };
  }, []);
  
  return (
    <View style={{ flex: 1, ...style }}>
      {children}
    </View>
  );
};

export default BackHandlerProvider;