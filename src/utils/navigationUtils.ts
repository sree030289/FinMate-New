import { useNavigation as useReactNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { useRef, useEffect } from 'react';

/**
 * Custom hook that wraps the React Navigation useNavigation hook
 * to prevent infinite re-renders by stabilizing the navigation object.
 * 
 * @returns A stable navigation object
 */
export function useStableNavigation<T extends ParamListBase = ParamListBase>() {
  // Get the navigation object from React Navigation
  const navigation = useReactNavigation<NavigationProp<T>>();
  
  // Create a ref to store the navigation object
  const navigationRef = useRef(navigation);
  
  // Update the ref if navigation changes
  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);
  
  // Return the stable ref instead of the navigation object directly
  return navigationRef.current;
}
