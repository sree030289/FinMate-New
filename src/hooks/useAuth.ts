import { auth } from '../services/firebase';
import { NavigationProp } from '@react-navigation/native';
import { useEffect, useState, useRef } from 'react';
import { useStableNavigation } from '../utils/navigationUtils';

/**
 * Hook that ensures a user is authenticated, redirecting to login if not
 * @returns {Object} navigation object
 */
export function useAuthGuard() {
  const navigation = useStableNavigation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Set up a listener to check authentication state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && !hasRedirected.current) {
        // Mark that we've initiated a redirect to prevent multiple attempts
        hasRedirected.current = true;
        
        // First, try to navigate to the Auth stack, then the Login screen
        try {
          // Reset to the root level with the Auth stack
          // This ensures we're starting from a clean navigation state
          navigation.reset({
            index: 0,
            routes: [
              { 
                name: 'Auth'
              }
            ],
          });
          
          // The above will fail if we're already in an Auth stack screen
          // In that case, we'll just stay where we are
          console.log('Successfully reset navigation to Auth stack');
        } catch (e) {
          console.log('Navigation reset error (likely already in Auth stack):', e);
        }
      }
    });

    return () => unsubscribe();
  }, []); // No dependencies needed as we're using stable refs

  return navigation;
}

/**
 * Utility hook to check if the user is authenticated
 * Returns a boolean value representing the current auth state
 */
export function useAuthState() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { isAuthenticated, loading };
}
