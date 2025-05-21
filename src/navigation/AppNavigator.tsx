import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon, useColorMode, Center, Box, Heading, Text, VStack } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

// Import your actual screens
import AddReminderScreen from '../screens/reminders/AddReminderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Create minimal home screen
const HomeScreen = () => (
  <Center flex={1} bg="#f5f5f5">
    <Heading>Home</Heading>
  </Center>
);

// Create minimal reminders screen
const RemindersScreen = ({ navigation }) => (
  <Center flex={1} bg="#f5f5f5">
    <VStack space={4} alignItems="center">
      <Heading>Reminders</Heading>
      <Box 
        bg="primary.500" 
        px={5} py={3} 
        borderRadius="lg"
        onTouchEnd={() => navigation.navigate('AddReminder')}
      >
        <Text color="white" fontWeight="bold">Add Reminder</Text>
      </Box>
    </VStack>
  </Center>
);

// Create minimal profile screen
const ProfileScreen = () => (
  <Center flex={1} bg="#f5f5f5">
    <Heading>Profile</Heading>
  </Center>
);

// Main App Navigator
const AppNavigator = () => {
  const { colorMode } = useColorMode();
  
  return (
    <Tab.Navigator
      initialRouteName="Reminders"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Reminders') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon as={Ionicons} name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colorMode === 'dark' ? '#90CAF9' : '#1976D2',
        tabBarInactiveTintColor: colorMode === 'dark' ? '#757575' : '#9E9E9E',
        tabBarStyle: {
          backgroundColor: colorMode === 'dark' ? '#1E1E1E' : '#FFFFFF',
          borderTopColor: colorMode === 'dark' ? '#333333' : '#E0E0E0',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen 
        name="Reminders" 
        component={RemindersNavigator} 
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Basic Reminders Navigator
const RemindersNavigator = () => {
  const { colorMode } = useColorMode();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorMode === 'dark' ? '#121212' : '#F8F9FA'
        }
      }}
    >
      <Stack.Screen name="RemindersMain" component={RemindersScreen} />
      <Stack.Screen name="AddReminder" component={AddReminderScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
