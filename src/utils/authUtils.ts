import { auth } from '../services/firebase';

/**
 * Utility to wait for Firebase Auth to initialize and check if a user is authenticated
 * This helps prevent "No authenticated user" errors during app startup
 */
export const waitForAuthReady = () => {
  return new Promise<boolean>((resolve) => {
    try {
      // Check if auth is initialized
      if (!auth) {
        console.error('Auth is not initialized in waitForAuthReady');
        return resolve(false);
      }
      
      // If auth is already initialized and we have a user, resolve immediately
      if (auth.currentUser) {
        return resolve(true);
      }

      // Otherwise set up a temporary observer to wait for auth state to be ready
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe(); // Clean up the observer after first auth state change
        resolve(!!user); // Resolve with true if user exists, false otherwise
      });
    } catch (error) {
      console.error('Error waiting for auth ready:', error);
      resolve(false);
    }
  });
};

/**
 * Check if a user is currently authenticated
 * Returns a boolean indicating authentication status
 */
export const isAuthenticated = () => {
  try {
    if (!auth) {
      console.error('Auth is not initialized in isAuthenticated');
      return false;
    }
    return !!auth.currentUser;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};

/**
 * Get the current user ID or throw an error if not authenticated
 * This helps standardize the error message for unauthenticated operations
 */
export const getCurrentUserId = () => {
  try {
    if (!auth) {
      throw new Error('Firebase auth is not initialized');
    }
    
    if (!auth.currentUser) {
      throw new Error('No authenticated user');
    }
    return auth.currentUser.uid;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    throw error;
  }
};
