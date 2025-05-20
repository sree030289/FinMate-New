import React from 'react';
import { Box, Spinner, Text, VStack, useColorMode } from 'native-base';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'lg' | 'md';
  fullScreen?: boolean;
}

/**
 * A consistent loading state component to use across the app
 */
const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'lg',
  fullScreen = false
}) => {
  const { colorMode } = useColorMode();
  
  return (
    <Box
      flex={fullScreen ? 1 : undefined}
      justifyContent="center"
      alignItems="center"
      bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}
      py={fullScreen ? 0 : 8}
      px={5}
      h={fullScreen ? '100%' : undefined}
    >
      <VStack space={4} alignItems="center" justifyContent="center">
        <Spinner size={size} color="primary.500" />
        {message && <Text color={colorMode === 'dark' ? 'text.dark' : 'text.light'}>{message}</Text>}
      </VStack>
    </Box>
  );
};

export default LoadingState;
