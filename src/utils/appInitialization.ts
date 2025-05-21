import AsyncStorage from '@react-native-async-storage/async-storage';
import { waitForAuthReady } from './authUtils';
import { setupAuthPersistence } from './firebaseAuth';

/**
 * Initializes the app's state, handling authentication check and data preloading
 * This is intended to be called during app startup to ensure everything is properly loaded
 */
export const initializeAppState = async () => {
  console.log('Initializing app state...');
  
  try {
    // Setup Firebase Auth persistence with AsyncStorage
    await setupAuthPersistence();
    
    // First check if we have an authenticated user
    const isAuthenticated = await waitForAuthReady();
    console.log('Auth state initialized:', isAuthenticated ? 'User authenticated' : 'No user');
    
    // If we're authenticated, preload essential data as needed
    if (isAuthenticated) {
      // Placeholder for any essential data preloading
      // This could include fetching user profile, app settings, etc.
      console.log('Preloading essential data...');
      
      // Track the app initialization in storage
      await AsyncStorage.setItem('app_initialized', 'true');
      
      console.log('App state initialization complete');
      return true;
    }
    
    console.log('App initialization skipped - no authenticated user');
    return false;
  } catch (error) {
    console.error('Error initializing app state:', error);
    return false;
  }
};
