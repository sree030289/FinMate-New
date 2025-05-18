import { CommonActions, NavigationContainerRef } from '@react-navigation/native';
import React, { createContext, useContext, useRef, useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

// Make sure BackHandler has removeEventListener to prevent errors
if (Platform.OS === 'android' && BackHandler) {
  if (!(BackHandler as any).removeEventListener) {
    (BackHandler as any).removeEventListener = function() {
      // Empty implementation to prevent errors
    };
  }
}

// Create the navigation context
type NavigationContextType = {
  navigationRef: React.RefObject<NavigationContainerRef<any>>;
  navigate: (name: string, params?: object) => void;
  goBack: () => void;
};

const NavigationContext = createContext<NavigationContextType | null>(null);

// Navigation provider component
export function NavigationProvider({ children, navigation }: { children: React.ReactNode, navigation?: any }) {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  // Initialize the ref with the passed navigation if provided
  useEffect(() => {
    if (navigation) {
      (navigationRef as any).current = navigation;
    }
  }, [navigation]);

  const navigate = (name: string, params?: object) => {
    if (navigationRef.current) {
      navigationRef.current.dispatch(
        CommonActions.navigate({
          name,
          params,
        })
      );
    } else if (navigation) {
      navigation.navigate(name, params);
    } else {
      console.warn('Navigation not available');
    }
  };

  const goBack = () => {
    if (navigationRef.current) {
      navigationRef.current.dispatch(CommonActions.goBack());
    } else if (navigation) {
      navigation.goBack();
    } else {
      console.warn('Navigation not available for going back');
    }
  };

  return (
    <NavigationContext.Provider value={{ navigationRef, navigate, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

// Hook to use the safe navigation
export function useSafeNavigation() {
  const context = useContext(NavigationContext);
  
  if (!context) {
    // Create a mock navigation object if context is not available
    return {
      navigate: (name: string, params?: object) => {
        console.warn('Navigation not available, tried to navigate to:', name, params);
      },
      goBack: () => {
        console.warn('Navigation not available, tried to go back');
      },
    };
  }
  
  return {
    navigate: context.navigate,
    goBack: context.goBack,
  };
}

export default {
  NavigationProvider,
  useSafeNavigation
};