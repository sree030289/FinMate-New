import React, { createRef } from 'react';
import { CommonActions, NavigationContainerRef } from '@react-navigation/native';

// Create a navigation ref that can be used outside of components
export const navigationRef = createRef<NavigationContainerRef<any>>();

/**
 * Navigate to a screen
 * @param name Screen name
 * @param params Parameters to pass to the screen
 */
export function navigate(name: string, params?: object) {
  if (navigationRef.current) {
    navigationRef.current.navigate(name, params);
  } else {
    // Navigation not ready yet, save for later
    console.warn('Navigation is not mounted yet, delaying navigation to', name);
    setTimeout(() => {
      if (navigationRef.current) {
        navigationRef.current.navigate(name, params);
      } else {
        console.error('Still cannot navigate to', name, 'after timeout');
      }
    }, 500);
  }
}

/**
 * Navigate to a route in a specific tab
 * @param tab Tab name
 * @param screen Screen name within the tab
 * @param params Parameters to pass to the screen
 */
export function navigateInTab(tab: string, screen: string, params?: object) {
  if (navigationRef.current) {
    navigationRef.current.navigate(tab, {
      screen: screen,
      params: params
    });
  } else {
    console.warn('Navigation not ready yet');
  }
}

/**
 * Reset navigation state
 * @param routeName Route name to reset to
 * @param params Parameters to pass to the route
 */
export function reset(routeName: string, params?: object) {
  if (navigationRef.current) {
    const resetAction = CommonActions.reset({
      index: 0,
      routes: [{ name: routeName, params }],
    });
    navigationRef.current.dispatch(resetAction);
  } else {
    console.warn('Navigation not ready yet');
  }
}

/**
 * Go back to the previous screen
 */
export function goBack() {
  if (navigationRef.current) {
    navigationRef.current.goBack();
  } else {
    console.warn('Navigation not ready yet');
  }
}

// Debug function to check navigation state
export function getCurrentRoute() {
  if (navigationRef.current) {
    const state = navigationRef.current.getRootState();
    console.log('Current navigation state:', JSON.stringify(state, null, 2));
    return state;
  }
  console.warn('Navigation ref not available');
  return null;
}

// Function to force reset to a specific route
export function forceReset(routeName: string) {
  if (navigationRef.current) {
    console.log(`Forcing navigation reset to ${routeName}`);
    navigationRef.current.resetRoot({
      index: 0,
      routes: [{ name: routeName }],
    });
    return true;
  }
  console.warn('Navigation ref not available, cannot reset');
  return false;
}
