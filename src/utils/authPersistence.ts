/**
 * Auth persistence helper to handle persistence with AsyncStorage
 * This is needed because Firebase Auth does not automatically integrate with AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../services/firebase';
import { User } from 'firebase/auth';

const AUTH_USER_KEY = 'auth_user';
const AUTH_PERSISTENCE_ENABLED = 'auth_persistence_enabled';

/**
 * Initialize the auth persistence layer
 * This should be called during app initialization
 */
export const initializeAuthPersistence = async (): Promise<void> => {
  try {
    // Check if persistence is enabled
    const persistenceEnabled = await AsyncStorage.getItem(AUTH_PERSISTENCE_ENABLED);
    
    if (persistenceEnabled !== 'true') {
      // First time setup - mark as enabled
      await AsyncStorage.setItem(AUTH_PERSISTENCE_ENABLED, 'true');
    }

    // Set up auth state listener to persist user state
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User signed in - persist minimal user info for restoring sessions
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
        await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
      } else {
        // User signed out - clear persisted data
        await AsyncStorage.removeItem(AUTH_USER_KEY);
      }
    });
  } catch (error) {
    console.error('Error initializing auth persistence:', error);
  }
};

/**
 * Check if there's a persisted user
 * This can be used during app startup to restore sessions
 */
export const getPersistedUser = async (): Promise<{
  uid: string;
  email: string | null;
  displayName: string | null;
} | null> => {
  try {
    const userJson = await AsyncStorage.getItem(AUTH_USER_KEY);
    if (!userJson) return null;
    
    return JSON.parse(userJson);
  } catch (error) {
    console.error('Error getting persisted user:', error);
    return null;
  }
};

/**
 * Clear all persisted auth data
 * This should be called during explicit logout actions
 */
export const clearPersistedAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(AUTH_USER_KEY);
  } catch (error) {
    console.error('Error clearing persisted auth:', error);
  }
};
