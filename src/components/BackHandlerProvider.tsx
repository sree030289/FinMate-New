import React, { ReactNode } from 'react';
import { View, ViewStyle } from 'react-native';

// Import our single fix
import '../utils/backHandlerFix';

interface BackHandlerProviderProps {
  children: ReactNode;
  style?: ViewStyle;
}

const BackHandlerProvider: React.FC<BackHandlerProviderProps> = ({ children, style }) => {
  // No logic needed here anymore since our fix is applied at the app level
  return (
    <View style={{ flex: 1, ...style }}>
      {children}
    </View>
  );
};

export default BackHandlerProvider;