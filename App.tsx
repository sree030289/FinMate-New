import './src/utils/backHandlerFix';
// After existing imports, add:
import { applyNativeBaseFixes } from './src/utils/nativeBaseFix';

// Before the App component definition, apply the fix:
applyNativeBaseFixes();
import { BackHandler as ReactNativeBackHandler } from 'react-native'; // Import it here for logging
console.log('App.tsx: Checking ReactNativeBackHandler.removeEventListener immediately after patch import.');
if (ReactNativeBackHandler && typeof (ReactNativeBackHandler as any).removeEventListener === 'function') {
  console.log('App.tsx: ReactNativeBackHandler.removeEventListener IS a function.');
} else {
  console.error('App.tsx: ReactNativeBackHandler.removeEventListener IS UNDEFINED or not a function AFTER patch import!');
  console.log('App.tsx: ReactNativeBackHandler object:', ReactNativeBackHandler);
  if (ReactNativeBackHandler) {
    console.log('App.tsx: typeof ReactNativeBackHandler.removeEventListener:', typeof (ReactNativeBackHandler as any).removeEventListener);
  }
}

import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { NativeBaseProvider, Box, Spinner } from 'native-base';
import MainNavigator from './src/navigation/MainNavigator';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import registerAssets from './src/utils/registerAssets';
import theme from './src/theme/theme';

// Import navigation types
import { RootStackParamList } from './src/types/navigation';



// Import the BackHandlerProvider FIRST
import BackHandlerProvider from './src/components/BackHandlerProvider';

// Make sure Firebase is initialized before anything else
import './src/services/firebase';
import { initializeAppState } from './src/utils/appInitialization';

// Apply input numeric patch to prevent casting errors
import applyInputPatch from './src/utils/inputNumericPatch';

// Ignore specific warnings that are coming from libraries
LogBox.ignoreLogs([
  'We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320',
  'NativeBase: The contrast ratio of',
  "[react-native-gesture-handler] Seems like you're using an old API with gesture components, check out new Gestures system!",
]);

// Type definition for the custom theme
type CustomThemeType = typeof theme;
declare module 'native-base' {
  interface ICustomTheme extends CustomThemeType {}
}

// Register assets to ensure they're bundled
const assets = registerAssets();
console.log('Assets registered:', Object.keys(assets));

// REMOVE other BackHandler imports as BackHandlerProvider should handle them.
// import './src/utils/globalBackHandlerFix';
// import './src/utils/navigationBackHandlerFix';
// import './src/utils/backHandlerPatch';
// import './src/utils/enhancedBackHandler';

// Helper function to navigate to a specific reminder
const navigateToReminder = (navigation: any, reminderId: any) => {
  if (!navigation) return;
  
  // First navigate to the reminders tab
  navigation.navigate('RemindersTab');
  
  // Then navigate to the specific reminder
  setTimeout(() => {
    navigation.navigate('RemindersTab', {
      screen: 'ReminderDetail',
      params: { reminder: { id: reminderId } }
    });
  }, 300);
};

export default function App() {
  // Apply input patch at app startup
  applyInputPatch();
  
  const [isInitializing, setIsInitializing] = useState(true);
  // Create a ref to store the navigation object
  const navigationRef = useRef<any>(null);

  // Initialize app state
  useEffect(() => {
    // Initialize app state when component mounts
    const initialize = async () => {
      try {
        await initializeAppState();
      } finally {
        // Always set initializing to false, even if there's an error
        setIsInitializing(false);
      }
    };
    
    initialize();
  }, []);
  
  // Show a loading spinner while initializing
  if (isInitializing) {
    return (
      <NativeBaseProvider theme={theme}>
        <Box flex={1} justifyContent="center" alignItems="center" 
             bg={theme.colors.background.dark}>
          <Spinner size="lg" color="primary.500" />
        </Box>
      </NativeBaseProvider>
    );
  }
  
  return (
    <NativeBaseProvider theme={theme}>
      <BackHandlerProvider>
        <NavigationContainer 
          ref={navigationRef}
          onReady={() => {
            console.log('Navigation container is ready');
          }}
        >
          <MainNavigator />
          <StatusBar style="light" translucent backgroundColor="transparent" />
        </NavigationContainer>
      </BackHandlerProvider>
    </NativeBaseProvider>
  );
}
