import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider, extendTheme } from 'native-base';
import MainNavigator from './src/navigation/MainNavigator';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import registerAssets from './src/utils/registerAssets';
// Make sure Firebase is initialized before anything else
import './src/services/firebase';

// Ignore specific warnings that are coming from libraries
LogBox.ignoreLogs([
  'We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320',
  'NativeBase: The contrast ratio of',
  "[react-native-gesture-handler] Seems like you're using an old API with gesture components, check out new Gestures system!",
]);

// Theme configuration with light and dark mode support
const theme = extendTheme({
  colors: {
    primary: {
      50: '#E3F2F9',
      100: '#C5E4F3',
      200: '#A2D4EC',
      300: '#7AC1E4',
      400: '#47A9DA',
      500: '#0088CC',
      600: '#007AB8',
      700: '#006BA1',
      800: '#005885',
      900: '#003F5E',
    },
    // Custom semantic colors for better dark mode
    background: {
      light: '#FFFFFF',
      dark: '#121212',
    },
    card: {
      light: '#FFFFFF',
      dark: '#1E1E1E',
    },
    text: {
      light: '#000000',
      dark: '#FFFFFF',
    },
    secondaryText: {
      light: '#666666',
      dark: '#A0A0A0',
    },
    border: {
      light: '#E0E0E0',
      dark: '#333333',
    },
    input: {
      light: '#F5F5F5',
      dark: '#2A2A2A',
    },
  },
  config: {
    initialColorMode: 'light',
  },
});

// Type definition for the custom theme
type CustomThemeType = typeof theme;
declare module 'native-base' {
  interface ICustomTheme extends CustomThemeType {}
}

// Register assets to ensure they're bundled
const assets = registerAssets();
console.log('Assets registered:', Object.keys(assets));

export default function App() {
  return (
    <NativeBaseProvider theme={theme}>
      <NavigationContainer>
        <MainNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </NativeBaseProvider>
  );
}