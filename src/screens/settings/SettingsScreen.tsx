import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Switch,
  Pressable,
  Avatar,
  ScrollView,
  Divider,
  useColorMode,
  Button,
  useToast,
  Badge
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { colorMode, toggleColorMode } = useColorMode();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Enhanced mock user data with more details
  const user = {
    displayName: 'Sreeram Vennapusa',
    email: 'sreeram@example.com',
    photoURL: 'https://randomuser.me/api/portraits/men/1.jpg',
    isPremium: false,
    joinedDate: 'May 2023',
    lastActivity: 'Today',
    notificationCount: 3
  };
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Handled by auth state listener in MainNavigator
    } catch (error) {
      console.error('Error signing out:', error);
      toast.show({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        status: "error"
      });
    }
  };
  
  const navigationItems = [
    {
      id: 'account',
      title: 'Account Settings',
      icon: 'person-outline',
      screen: 'Account',
      showArrow: true
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      icon: 'notifications-outline',
      screen: 'NotificationsSettings',
      showArrow: true
    },
    {
      id: 'connected',
      title: 'Connected Accounts',
      icon: 'link-outline',
      screen: 'ConnectedAccounts',
      showArrow: true
    },
    {
      id: 'api',
      title: 'OCR API Settings',
      icon: 'scan-outline',
      screen: 'APISettings',
      showArrow: true
    },
    {
      id: 'subscription',
      title: 'Subscription',
      icon: 'star-outline',
      screen: 'Subscription',
      showArrow: true
    },
    {
      id: 'analytics',
      title: 'AI Analytics',
      icon: 'analytics-outline',
      screen: 'Analytics',
      showArrow: true,
      premium: true
    },
    {
      id: 'darkMode',
      title: 'Dark Mode',
      icon: 'moon-outline',
      isSwitch: true,
      value: colorMode === 'dark',
      onChange: toggleColorMode
    },
    {
      id: 'about',
      title: 'About FinMate',
      icon: 'information-circle-outline',
      onPress: () => {
        toast.show({
          title: "FinMate v1.0.0",
          description: "© 2023 FinMate Inc. All rights reserved.",
          status: "info"
        });
      },
      showArrow: true
    }
  ];

  return (
    <ScrollView bg={colorMode === 'dark' ? 'background.dark' : 'background.light'} showsVerticalScrollIndicator={false}>
      <Box p={5}>
        <HStack justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">Settings</Heading>
          <IconButton
            icon={<Icon as={Ionicons} name="notifications-outline" />}
            borderRadius="full"
            variant="ghost"
            _icon={{
              color: colorMode === 'dark' ? 'white' : 'black'
            }}
            onPress={() => navigation.navigate('NotificationsSettings')}
          >
            {user.notificationCount > 0 && (
              <Badge
                colorScheme="danger"
                rounded="full"
                mb={-4}
                mr={-2}
                zIndex={1}
                variant="solid"
                alignSelf="flex-end"
                _text={{
                  fontSize: 10
                }}
              >
                {user.notificationCount}
              </Badge>
            )}
          </IconButton>
        </HStack>
        
        {/* User Profile Section - Enhanced */}
        <Pressable 
          onPress={() => navigation.navigate('Account')}
          mb={6}
        >
          <Box 
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
            borderRadius="lg" 
            p={4} 
            shadow={1}
          >
            <HStack space={4} alignItems="center">
              <Avatar 
                size="lg" 
                source={{ uri: user.photoURL }}
                bg="primary.500"
                borderWidth={2}
                borderColor="primary.500"
              >
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              
              <VStack flex={1}>
                <Text fontSize="lg" fontWeight="bold">{user.displayName}</Text>
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                  {user.email}
                </Text>
                
                <HStack space={2} alignItems="center" mt={1}>
                  <Icon 
                    as={Ionicons} 
                    name={user.isPremium ? 'star' : 'star-outline'} 
                    size="xs" 
                    color={user.isPremium ? 'amber.500' : (colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light')} 
                  />
                  <Text 
                    fontSize="xs" 
                    color={user.isPremium ? 'amber.500' : (colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light')}
                  >
                    {user.isPremium ? 'Premium User' : 'Free Plan'}
                  </Text>
                </HStack>
              </VStack>
              <Icon as={Ionicons} name="chevron-forward" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} />
            </HStack>
            
            <Divider my={3} />
            
            <HStack justifyContent="space-around">
              <VStack alignItems="center">
                <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Member since</Text>
                <HStack space={1} alignItems="center">
                  <Icon as={Ionicons} name="calendar-outline" size="xs" color="primary.500" />
                  <Text fontSize="sm">{user.joinedDate}</Text>
                </HStack>
              </VStack>
              
              <VStack alignItems="center">
                <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Last activity</Text>
                <HStack space={1} alignItems="center">
                  <Icon as={Ionicons} name="time-outline" size="xs" color="primary.500" />
                  <Text fontSize="sm">{user.lastActivity}</Text>
                </HStack>
              </VStack>
            </HStack>
          </Box>
        </Pressable>
        
        {!user.isPremium && (
          <Pressable 
            mb={6}
            bg={colorMode === 'dark' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(250, 204, 21, 0.1)'} 
            borderRadius="lg"
            p={4}
            onPress={() => navigation.navigate('Subscription')}
          >
            <HStack alignItems="center" justifyContent="space-between">
              <HStack space={3} alignItems="center">
                <Icon as={Ionicons} name="star" size="md" color="amber.500" />
                <VStack>
                  <Text fontWeight="bold">Upgrade to Premium</Text>
                  <Text fontSize="xs">Get advanced features and AI analytics</Text>
                </VStack>
              </HStack>
              <Icon as={Ionicons} name="chevron-forward" size="sm" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} />
            </HStack>
          </Pressable>
        )}
        
        {/* Settings List */}
        <VStack space={3} mb={8}>
          {navigationItems.map((item, index) => {
            if (item.premium && !user.isPremium) {
              return (
                <Pressable
                  key={item.id}
                  onPress={() => navigation.navigate('Subscription')}
                >
                  <HStack 
                    alignItems="center" 
                    justifyContent="space-between"
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                    p={4}
                    borderRadius="lg"
                    shadow={1}
                  >
                    <HStack space={3} alignItems="center">
                      <Icon 
                        as={Ionicons} 
                        name={item.icon} 
                        size="md" 
                        color="gray.400" 
                      />
                      <VStack>
                        <Text color="gray.400">{item.title}</Text>
                        <HStack space={1} alignItems="center">
                          <Icon as={Ionicons} name="lock-closed" size="xs" color="amber.500" />
                          <Text fontSize="xs" color="amber.500">Premium feature</Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    
                    <Icon as={Ionicons} name="chevron-forward" size="sm" color="gray.400" />
                  </HStack>
                </Pressable>
              );
            }
            
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (item.screen) {
                    navigation.navigate(item.screen);
                  } else if (item.onPress) {
                    item.onPress();
                  }
                }}
              >
                <HStack 
                  alignItems="center" 
                  justifyContent="space-between"
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                  p={4}
                  borderRadius="lg"
                  shadow={1}
                >
                  <HStack space={3} alignItems="center">
                    <Icon 
                      as={Ionicons} 
                      name={item.icon} 
                      size="md" 
                      color="primary.500" 
                    />
                    <Text>{item.title}</Text>
                  </HStack>
                  
                  {item.isSwitch ? (
                    <Switch 
                      isChecked={item.value} 
                      onToggle={item.onChange}
                      colorScheme="primary" 
                    />
                  ) : item.showArrow && (
                    <Icon as={Ionicons} name="chevron-forward" size="sm" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} />
                  )}
                </HStack>
              </Pressable>
            );
          })}
        </VStack>
        
        <Divider mb={6} />
        
        {/* Sign Out Button */}
        <Button 
          colorScheme="danger" 
          variant="outline"
          leftIcon={<Icon as={Ionicons} name="log-out-outline" size="sm" />}
          onPress={handleSignOut}
        >
          Sign Out
        </Button>
        
        <Text 
          fontSize="xs" 
          textAlign="center" 
          mt={8} 
          color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}
        >
          FinMate v1.0.0
        </Text>
      </Box>
    </ScrollView>
  );
};

export default SettingsScreen;
