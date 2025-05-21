import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Center, Text, Box, Button } from 'native-base';
import AppNavigator from './AppNavigator';

const Stack = createNativeStackNavigator();

// Single placeholder for Login that can navigate to the app
const LoginScreen = ({ navigation }) => (
  <Center flex={1} bg="#f5f5f5" p={4}>
    <Box bg="white" p={6} borderRadius="lg" width="100%" shadow={2}>
      <Text fontSize="2xl" fontWeight="bold" textAlign="center" mb={4}>Login</Text>
      <Text color="gray.500" textAlign="center" mb={6}>
        Placeholder login screen - Press the button below to continue
      </Text>
      <Button onPress={() => navigation.navigate('App')}>
        Continue to App
      </Button>
    </Box>
  </Center>
);

// Simplified Auth Navigator
const AuthNavigator = () => {
  console.log('Rendering AuthNavigator');
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{ 
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
