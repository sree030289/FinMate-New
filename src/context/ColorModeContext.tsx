import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorMode } from 'native-base';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ColorModeType = 'light' | 'dark';

interface ColorModeContextType {
  colorMode: ColorModeType;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

export const ColorModeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { colorMode, toggleColorMode: toggleNativeBaseColorMode } = useColorMode();
  
  // Toggle color mode and persist to storage
  const toggleColorMode = async () => {
    toggleNativeBaseColorMode();
    try {
      await AsyncStorage.setItem('@color_mode', colorMode === 'light' ? 'dark' : 'light');
    } catch (e) {
      console.log('Failed to save color mode preference');
    }
  };
  
  // Load saved color mode on startup
  useEffect(() => {
    (async () => {
      try {
        const savedColorMode = await AsyncStorage.getItem('@color_mode');
        if (savedColorMode && savedColorMode !== colorMode) {
          toggleNativeBaseColorMode();
        }
      } catch (e) {
        console.log('Failed to load color mode preference');
      }
    })();
  }, []);

  return (
    <ColorModeContext.Provider value={{ colorMode: colorMode as ColorModeType, toggleColorMode }}>
      {children}
    </ColorModeContext.Provider>
  );
};

export const useColorModeContext = () => {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error('useColorModeContext must be used within a ColorModeProvider');
  }
  return context;
};
