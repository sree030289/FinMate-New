import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Pressable,
  Avatar,
  Button,
  useColorMode,
  Input,
  IconButton,
  Badge,
  Menu,
  useToast,
  ScrollView
} from 'native-base';
import { IToastProps } from 'native-base/lib/typescript/components/composites/Toast/types';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Platform, RefreshControl, FlatList } from 'react-native';
import useBackHandler from '../../utils/safeBackHandlerHook';
import { splitExpenseService } from '../../services/firestoreService';
import { useFetch } from '../../hooks/useData';
import { Group } from '../../types';
import { NavigationProps } from '../../types/navigation';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

// Filter options for groups
const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'You owe', value: 'owe' },
  { label: 'Owed to you', value: 'owed' }
];

// Group type filter options
const groupTypeOptions = [
  { label: 'All', value: 'all' },
  { label: 'Trips', value: 'trip' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Family', value: 'family' },
  { label: 'Others', value: 'others' }
];

// Workaround component to avoid BackHandler errors
// Create a wrapper component for useNavigation to prevent errors
function SafeNavigationHook() {
  try {
    return useNavigation();
  } catch (error) {
    console.warn('Error in useNavigation:', error);
    // Return a mock navigation object with basic functions
    return {
      navigate: (screenName, params) => {
        console.log('Navigation attempted to:', screenName, params);
        // Try to use a more direct approach
        if (global.ReactNavigation && global.ReactNavigation.navigate) {
          global.ReactNavigation.navigate(screenName, params);
        }
      },
      goBack: () => {
        console.log('Navigation goBack attempted');
        if (global.ReactNavigation && global.ReactNavigation.goBack) {
          global.ReactNavigation.goBack();
        }
      }
    };
  }
}

const GroupsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  // Fetch groups using our custom useFetch hook
  const { 
    data: groups, 
    isLoading, 
    error, 
    refetch: refreshGroups 
  } = useFetch<Group[]>(
    () => splitExpenseService.getGroups(),
    {
      cacheKey: 'user-groups',
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshGroups();
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Failed to refresh groups"
      } as IToastProps);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Helper function to get the icon based on group type
  const getGroupTypeIcon = (type?: string) => {
    switch (type) {
      case 'trip': return 'airplane-outline';
      case 'apartment': return 'home-outline';
      case 'event': return 'calendar-outline';
      default: return 'people-outline';
    }
  };
  
  // Filter and sort groups
  const filteredGroups = groups?.filter(group => {
    // Filter by search query
    if (searchQuery && !group.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by active filter
    if (activeFilter === 'owe' && (!group.owedByYou || group.owedByYou <= 0)) {
      return false;
    }
    
    if (activeFilter === 'owed' && (!group.owedToYou || group.owedToYou <= 0)) {
      return false;
    }
    
    return true;
  }) || [];
  
  // Delete a group
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    try {
      await splitExpenseService.deleteGroup(groupId);
      
      // Refresh the list
      refreshGroups();
      
      toast.show({
        title: "Group Deleted",
        description: "Group has been removed successfully"
      } as IToastProps);
    } catch (error) {
      toast.show({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete group"
      } as IToastProps);
    }
  };
  
  // Archive a group
  const handleArchiveGroup = async (groupId: string) => {
    try {
      await splitExpenseService.archiveGroup(groupId);
      
      // Refresh the list
      refreshGroups();
      
      toast.show({
        title: "Group Archived",
        description: "Group has been archived"
      } as IToastProps);
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Failed to archive group"
      } as IToastProps);
    }
  };
  
  const handleCreateGroup = () => {
    try {
      navigation.navigate('CreateGroup');
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback
      toast.show({
        title: "Navigation Error",
        description: "Couldn't navigate to Create Group screen"
      });
    }
  };
  
  const handleGroupPress = (group: Group) => {
    try {
      navigation.navigate('GroupDetail', {
        groupId: group.id,
        groupName: group.name
      });
    } catch (error) {
      console.error('Navigation error:', error);
      // Fallback
      toast.show({
        title: "Navigation Error",
        description: "Couldn't navigate to Group Detail screen"
      });
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={{ message: "Failed to load groups" }} onRetry={refreshGroups} />;
  }

  return (
    <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      <VStack space={5}>
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="lg">My Groups</Heading>
          <Button
            leftIcon={<Icon as={Ionicons} name="add" size="sm" />}
            onPress={handleCreateGroup}
          >
            Create
          </Button>
        </HStack>
        
        {/* Search */}
        <Input
          placeholder="Search groups"
          value={searchQuery}
          onChangeText={setSearchQuery}
          InputLeftElement={
            <Icon as={Ionicons} name="search" size={5} ml={2} color="muted.400" />
          }
          InputRightElement={
            searchQuery ? (
              <IconButton
                icon={<Icon as={Ionicons} name="close-circle" />}
                onPress={() => setSearchQuery('')}
                _icon={{ color: "muted.400" }}
                variant="unstyled"
                mr={1}
              />
            ) : null
          }
        />
        
        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <HStack space={2}>
            {groupTypeOptions.map(option => (
              <Pressable
                key={option.value}
                onPress={() => setActiveFilter(option.value)}
                bg={activeFilter === option.value ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
                px={4}
                py={2}
                borderRadius="full"
              >
                <Text
                  color={activeFilter === option.value ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </HStack>
        </ScrollView>
        
        {/* Group List */}
        {filteredGroups.length > 0 ? (
          <FlatList
            data={filteredGroups}
            renderItem={({ item: group }) => (
              <Pressable
                onPress={() => handleGroupPress(group)}
                mb={3}
              >
                <Box
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                  p={4}
                  borderRadius="lg"
                  shadow={1}
                >
                  <HStack justifyContent="space-between">
                    <HStack space={3} alignItems="center">
                      <Avatar
                        bg="primary.500"
                        size="md"
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </Avatar>
                      
                      <VStack>
                        <HStack alignItems="center" space={2}>
                          <Text fontWeight="medium">{group.name}</Text>
                          <Icon 
                            as={Ionicons} 
                            name={getGroupTypeIcon(group.type)} 
                            size="xs"
                            color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} 
                          />
                        </HStack>
                        
                        <HStack alignItems="center" space={2}>
                          <Icon 
                            as={Ionicons} 
                            name="people" 
                            size="2xs" 
                            color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} 
                          />
                          <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                            {group.members.length} members
                          </Text>
                          <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                            • {group.lastUpdated}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    
                    <Menu trigger={triggerProps => {
                      return (
                        <IconButton
                          {...triggerProps}
                          icon={<Icon as={Ionicons} name="ellipsis-vertical" />}
                          variant="ghost"
                        />
                      );
                    }}>
                      <Menu.Item onPress={() => {
                        try {
                          navigation.navigate('GroupChat', { groupId: group.id, groupName: group.name });
                        } catch (error) {
                          console.error('Navigation error:', error);
                        }
                      }}>
                        <HStack space={2} alignItems="center">
                          <Icon as={Ionicons} name="chatbubble-outline" size="xs" />
                          <Text>Open Chat</Text>
                        </HStack>
                      </Menu.Item>
                      <Menu.Item onPress={() => {
                        try {
                          navigation.navigate('AddExpense', { groupId: group.id });
                        } catch (error) {
                          console.error('Navigation error:', error);
                        }
                      }}>
                        <HStack space={2} alignItems="center">
                          <Icon as={Ionicons} name="add-circle-outline" size="xs" />
                          <Text>Add Expense</Text>
                        </HStack>
                      </Menu.Item>
                      <Menu.Item onPress={() => handleArchiveGroup(group.id)}>
                        <HStack space={2} alignItems="center">
                          <Icon as={Ionicons} name="archive-outline" size="xs" />
                          <Text>Archive Group</Text>
                        </HStack>
                      </Menu.Item>
                      <Menu.Item onPress={() => handleDeleteGroup(group.id, group.name)}>
                        <HStack space={2} alignItems="center">
                          <Icon as={Ionicons} name="trash-outline" size="xs" color="red.500" />
                          <Text color="red.500">Delete Group</Text>
                        </HStack>
                      </Menu.Item>
                    </Menu>
                  </HStack>
                  
                  <HStack justifyContent="space-between" mt={3} pt={3} borderTopWidth={1} borderColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}>
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                      Last activity: {group.recentActivity}
                    </Text>
                    
                    {(group.owedToYou > 0 || group.owedByYou > 0) && (
                      <Badge 
                        colorScheme={group.owedToYou > 0 ? "green" : "red"} 
                        variant="subtle"
                        rounded="sm"
                      >
                        <Text fontSize="2xs">
                          {group.owedToYou > 0 ? 
                            `You are owed ₹${group.owedToYou}` : 
                            `You owe ₹${group.owedByYou}`}
                        </Text>
                      </Badge>
                    )}
                    
                    {group.owedToYou === 0 && group.owedByYou === 0 && (
                      <Badge colorScheme="green" variant="outline" rounded="sm">
                        <Text fontSize="2xs">Settled up</Text>
                      </Badge>
                    )}
                  </HStack>
                </Box>
              </Pressable>
            )}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              <Box p={10} alignItems="center">
                <Icon as={Ionicons} name="people" size="6xl" color="gray.300" mb={4} />
                <Text color="gray.500" textAlign="center">No groups found</Text>
              </Box>
            }
          />
        ) : (
          <Box flex={1} alignItems="center" justifyContent="center">
            <Icon as={Ionicons} name="people" size="6xl" color="gray.300" mb={4} />
            <Heading size="sm" textAlign="center" mb={2}>No Groups Found</Heading>
            <Text color="gray.500" textAlign="center" mb={6}>
              {searchQuery ? 
                "No results match your search" : 
                "Create a group to split expenses with friends"}
            </Text>
            
            {!searchQuery && (
              <Button
                leftIcon={<Icon as={Ionicons} name="add-circle" size="sm" />}
                onPress={handleCreateGroup}
              >
                Create a Group
              </Button>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default GroupsScreen;