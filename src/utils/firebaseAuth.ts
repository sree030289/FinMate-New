/**
 * Firebase Auth Persistence Helper
 * 
 * This file contains functions for setting up Firebase Auth to work properly
 * with AsyncStorage persistence in React Native.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';

/**
 * Sets up persistence for Firebase Auth
 * To be called during app initialization
 */
export const setupAuthPersistence = async () => {
  if (Platform.OS === 'web') {
    // Web persistence is handled in the firebase.ts file
    return;
  }

  try {
    // Check if auth is available
    if (!auth) {
      console.error('Auth is not initialized in setupAuthPersistence');
      return;
    }

    // For React Native, we'll store the auth state in AsyncStorage manually
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('User authenticated, storing auth state');
        await AsyncStorage.setItem('userLoggedIn', 'true');
      } else {
        console.log('No user, clearing auth state');
        await AsyncStorage.removeItem('userLoggedIn');
      }
    });
  } catch (error) {
    console.error('Error setting up auth persistence:', error);
  }
};

/**
 * Check if user is logged in from AsyncStorage
 */
export const isUserLoggedIn = async () => {
  try {
    const userLoggedIn = await AsyncStorage.getItem('userLoggedIn');
    return userLoggedIn === 'true';
  } catch (error) {
    console.error('Error checking if user is logged in:', error);
    return false;
  }
};

/**
 * Clear user logged in state
 */
export const clearLoggedInState = async () => {
  try {
    return await AsyncStorage.removeItem('userLoggedIn');
  } catch (error) {
    console.error('Error clearing logged in state:', error);
  }
};
