import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { NativeBaseProvider, extendTheme } from 'native-base';
import MainNavigator from './src/navigation/MainNavigator';
import { StatusBar } from 'expo-status-bar';
import { LogBox, Platform } from 'react-native';
import registerAssets from './src/utils/registerAssets';
// Make sure Firebase is initialized before anything else
import './src/services/firebase';

// Ignore specific warnings that are coming from libraries
LogBox.ignoreLogs([
  'We can not support a function callback. See Github Issues for details https://github.com/adobe/react-spectrum/issues/2320',
  'NativeBase: The contrast ratio of',
  "[react-native-gesture-handler] Seems like you're using an old API with gesture components, check out new Gestures system!",
]);

// Theme configuration with Robinhood-inspired dark theme
const theme = extendTheme({
  colors: {
    primary: {
      50: '#E3FFE8',
      100: '#B3FFC2',
      200: '#81FF9D',
      300: '#5EFF79',
      400: '#40FF54',
      500: '#00C805', // Robinhood green
      600: '#00A504',
      700: '#008203',
      800: '#005F02',
      900: '#003D01',
    },
    // Custom semantic colors for Robinhood-inspired dark theme
    background: {
      light: '#000000', // Black background (Robinhood style)
      dark: '#000000',
    },
    card: {
      light: '#1E2124', // Dark card (Robinhood style)
      dark: '#1E2124',
    },
    text: {
      light: '#FFFFFF', // White text
      dark: '#FFFFFF',
    },
    secondaryText: {
      light: '#A3A3A3', // Light gray text
      dark: '#A3A3A3',
    },
    border: {
      light: '#333333', // Dark borders
      dark: '#333333',
    },
    input: {
      light: '#1E2124', // Dark input (Robinhood style)
      dark: '#1E2124',
    },
  },
  config: {
    initialColorMode: 'dark', // Set default to dark mode
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
        <StatusBar style="light" translucent backgroundColor="transparent" />
      </NavigationContainer>
    </NativeBaseProvider>
  );
}