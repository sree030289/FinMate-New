import React from 'react';
import { Box, Text, VStack, Button, Icon, Heading, useColorMode } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface ErrorStateProps {
  error?: {
    message: string;
    code?: string;
  };
  onRetry?: () => void;
  fullScreen?: boolean;
  title?: string;
}

/**
 * A consistent error state component to use across the app
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  error = { message: 'Something went wrong. Please try again.' },
  onRetry,
  fullScreen = false,
  title = 'Error'
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
      <VStack space={4} alignItems="center" justifyContent="center" maxWidth="100%">
        <Icon 
          as={Ionicons} 
          name="alert-circle" 
          size="6xl" 
          color="red.500" 
        />
        <Heading size="md">{title}</Heading>
        <Text 
          textAlign="center" 
          color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}
        >
          {error.message}
        </Text>
        
        {error.code && (
          <Text 
            fontSize="xs" 
            color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} 
            textAlign="center"
          >
            Error code: {error.code}
          </Text>
        )}
        
        {onRetry && (
          <Button 
            onPress={onRetry}
            leftIcon={<Icon as={Ionicons} name="refresh" size="sm" />}
            mt={2}
          >
            Try Again
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default ErrorState;
