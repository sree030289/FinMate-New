import React, { useState } from 'react';
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
  ScrollView,
  FlatList
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Mock data for groups
const initialGroups = [
  {
    id: '1',
    name: 'Roommates',
    avatar: null,
    members: 4,
    owedByYou: 0,
    owedToYou: 1250,
    lastUpdated: '2 hours ago',
    recentActivity: 'Dinner at Restaurant',
    type: 'apartment'
  },
  {
    id: '2',
    name: 'Goa Trip',
    avatar: null,
    members: 6,
    owedByYou: 850,
    owedToYou: 0,
    lastUpdated: '2 days ago',
    recentActivity: 'Hotel Booking',
    type: 'trip'
  },
  {
    id: '3',
    name: 'Office Lunch',
    avatar: null,
    members: 5,
    owedByYou: 0,
    owedToYou: 0,
    lastUpdated: '1 week ago',
    recentActivity: 'Pizza order',
    type: 'others'
  },
  {
    id: '4',
    name: 'Family',
    avatar: null,
    members: 4,
    owedByYou: 340,
    owedToYou: 0,
    lastUpdated: '3 days ago',
    recentActivity: 'Grocery shopping',
    type: 'family'
  },
  {
    id: '5',
    name: 'Weekend Getaway',
    avatar: null,
    members: 3,
    owedByYou: 0,
    owedToYou: 780,
    lastUpdated: '5 days ago',
    recentActivity: 'Cabin rental',
    type: 'trip'
  },
];

// Group type filter options
const groupTypeOptions = [
  { label: 'All', value: 'all' },
  { label: 'Trips', value: 'trip' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Family', value: 'family' },
  { label: 'Others', value: 'others' }
];

const GroupsScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const toast = useToast();

  const [groups, setGroups] = useState(initialGroups);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  
  // Filter groups based on search and type filter
  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || group.type === activeFilter;
    return matchesSearch && matchesFilter;
  });
  
  const handleDeleteGroup = (groupId) => {
    setGroups(groups.filter(group => group.id !== groupId));
    toast.show({
      title: "Group Deleted",
      description: "Group has been removed successfully",
      status: "info"
    });
  };
  
  const handleArchiveGroup = (groupId) => {
    setGroups(groups.map(group => 
      group.id === groupId ? { ...group, isArchived: true } : group
    ));
    toast.show({
      title: "Group Archived",
      description: "Group has been archived",
      status: "info"
    });
  };
  
  const handleCreateGroup = () => {
    navigation.navigate('CreateGroup');
  };
  
  const handleGroupPress = (group) => {
    navigation.navigate('GroupDetail', {
      groupId: group.id,
      groupName: group.name
    });
  };
  
  const getGroupTypeIcon = (type) => {
    switch(type) {
      case 'trip':
        return 'airplane-outline';
      case 'apartment':
        return 'home-outline';
      case 'family':
        return 'people-outline';
      default:
        return 'list-outline';
    }
  };
  
  const refreshGroups = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.show({
        title: "Refreshed",
        description: "Group list has been updated",
        status: "success"
      });
    }, 1000);
  };

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
                            {group.members} members
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
                      <Menu.Item onPress={() => navigation.navigate('GroupChat', { groupId: group.id, groupName: group.name })}>
                        <HStack space={2} alignItems="center">
                          <Icon as={Ionicons} name="chatbubble-outline" size="xs" />
                          <Text>Open Chat</Text>
                        </HStack>
                      </Menu.Item>
                      <Menu.Item onPress={() => navigation.navigate('AddExpense', { groupId: group.id, groupName: group.name })}>
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
                      <Menu.Item onPress={() => handleDeleteGroup(group.id)}>
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
            refreshing={loading}
            onRefresh={refreshGroups}
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
