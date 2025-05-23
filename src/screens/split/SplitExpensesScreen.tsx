import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  ScrollView,
  Pressable,
  Avatar,
  Button,
  useColorMode,
  Center,
  Divider,
  Spinner
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeFetch } from '../../utils/safeDataFetching';
import { splitExpenseService } from '../../services/firestoreService';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

const SplitExpensesScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  
  // Fetch real data from Firestore with safe defaults
  const { 
    data: friends, 
    isLoading: friendsLoading,
    error: friendsError,
    refetch: refetchFriends
  } = useSafeFetch(() => splitExpenseService.getFriends(), {
    cacheKey: 'user-friends'
  });
  
  const { 
    data: groups, 
    isLoading: groupsLoading,
    error: groupsError,
    refetch: refetchGroups
  } = useSafeFetch(() => splitExpenseService.getGroups(), {
    cacheKey: 'user-groups'
  });
  
  const { 
    data: recentActivity, 
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity
  } = useSafeFetch(() => splitExpenseService.getRecentActivity(10), {
    cacheKey: 'recent-activity'
  });
  
  // Calculate totals from friends data with null safety
  const totalOwed = (friends || []).reduce((sum, friend) => 
    sum + (friend?.balance > 0 ? friend.balance : 0), 0
  );
  
  const totalOwe = (friends || []).reduce((sum, friend) => 
    sum + (friend?.balance < 0 ? Math.abs(friend.balance) : 0), 0
  );
  
  // Get top 3 friends with balances
  const friendsSummary = (friends || [])
    .filter(friend => friend?.balance !== 0)
    .sort((a, b) => Math.abs(b?.balance || 0) - Math.abs(a?.balance || 0))
    .slice(0, 3);
  
  // Get groups with balances
  const groupsSummary = (groups || [])
    .filter(group => (group?.owedToYou > 0 || group?.owedByYou > 0))
    .slice(0, 2);

  const navigateToFriends = () => {
    navigation.navigate('Friends');
  };

  const navigateToGroups = () => {
    navigation.navigate('Groups');
  };

  const navigateToAddExpense = () => {
    navigation.navigate('AddExpense');
  };

  const navigateToFriend = (friend) => {
    navigation.navigate('AddExpense', { friend });
  };

  const navigateToGroup = (group) => {
    navigation.navigate('GroupDetail', {
      groupId: group.id,
      groupName: group.name
    });
  };

  const navigateToActivity = (activity) => {
    // Navigate based on activity type
    if (activity.type === 'expense' && activity.groupId) {
      navigation.navigate('GroupDetail', {
        groupId: activity.groupId,
        groupName: activity.groupName
      });
    } else if (activity.type === 'expense' && activity.expenseId) {
      navigation.navigate('TransactionDetails', {
        transaction: { id: activity.expenseId, type: 'expense' }
      });
    }
  };

  const formatActivityTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const activityDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    if (isNaN(activityDate.getTime())) return '';
    
    const diffInHours = Math.floor((now - activityDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - activityDate) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'expense_added':
        return 'receipt-outline';
      case 'payment_made':
      case 'payment_received':
        return 'cash-outline';
      case 'group_created':
      case 'group_joined':
        return 'people-outline';
      case 'settlement_completed':
        return 'checkmark-circle-outline';
      default:
        return 'time-outline';
    }
  };

  // Handle retry for errors
  const handleRetry = () => {
    refetchFriends();
    refetchGroups();
    refetchActivity();
  };

  // Show loading state
  if (friendsLoading || groupsLoading || activityLoading) {
    return <LoadingState />;
  }

  // Show error state
  if (friendsError || groupsError || activityError) {
    return (
      <ErrorState 
        error={{ message: "Failed to load data" }} 
        onRetry={handleRetry} 
      />
    );
  }

  return (
    <ScrollView
      bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}
      showsVerticalScrollIndicator={false}
    >
      <Box p={5}>
        <Heading size="lg" mb={6}>Split Expenses</Heading>

        {/* Summary Cards */}
        <HStack space={4} justifyContent="space-between" mb={6}>
          <Box
            flex={1}
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={4}
            borderRadius="lg"
            shadow={1}
          >
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              You are owed
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="green.500">
              ₹{totalOwed.toLocaleString()}
            </Text>
            <Button size="xs" variant="ghost" mt={2} p={0} onPress={navigateToFriends}>
              <Text fontSize="xs" color="primary.500">View Details</Text>
            </Button>
          </Box>

          <Box
            flex={1}
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={4}
            borderRadius="lg"
            shadow={1}
          >
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              You owe
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="red.500">
              ₹{totalOwe.toLocaleString()}
            </Text>
            <Button size="xs" variant="ghost" mt={2} p={0} onPress={navigateToFriends}>
              <Text fontSize="xs" color="primary.500">View Details</Text>
            </Button>
          </Box>
        </HStack>

        {/* Quick Actions */}
        <Box mb={8}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Quick Actions</Heading>
          </HStack>

          <HStack space={4} justifyContent="space-between">
            <Pressable
              flex={1}
              onPress={navigateToAddExpense}
              alignItems="center"
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
              p={4}
              borderRadius="lg"
              shadow={1}
            >
              <Icon as={Ionicons} name="add-circle-outline" size="xl" color="primary.500" mb={2} />
              <Text>Add Expense</Text>
            </Pressable>

            <Pressable
              flex={1}
              onPress={navigateToFriends}
              alignItems="center"
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
              p={4}
              borderRadius="lg"
              shadow={1}
            >
              <Icon as={Ionicons} name="people-outline" size="xl" color="primary.500" mb={2} />
              <Text>Friends</Text>
            </Pressable>

            <Pressable
              flex={1}
              onPress={navigateToGroups}
              alignItems="center"
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
              p={4}
              borderRadius="lg"
              shadow={1}
            >
              <Icon as={Ionicons} name="people-circle-outline" size="xl" color="primary.500" mb={2} />
              <Text>Groups</Text>
            </Pressable>
          </HStack>
        </Box>

        {/* Recent Activity */}
        <Box mb={8}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Recent Activity</Heading>
            {recentActivity && recentActivity.length > 0 && (
              <Button size="sm" variant="ghost" onPress={() => { /* Navigate to activity history */ }}>
                See All
              </Button>
            )}
          </HStack>

          {recentActivity && recentActivity.length > 0 ? (
            <VStack space={3}>
              {recentActivity.map(activity => (
                <Pressable
                  key={activity.id}
                  onPress={() => navigateToActivity(activity)}
                >
                  <Box
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                    p={3}
                    borderRadius="lg"
                    shadow={1}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack space={3} alignItems="center" flex={1}>
                        <Box
                          bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                          p={2}
                          borderRadius="full"
                        >
                          <Icon
                            as={Ionicons}
                            name={getActivityIcon(activity.type)}
                            color="primary.500"
                          />
                        </Box>
                        <VStack flex={1}>
                          <Text fontWeight="medium">{activity.description}</Text>
                          <HStack alignItems="center" space={1}>
                            {activity.groupName && (
                              <>
                                <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                                  {activity.groupName}
                                </Text>
                                <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                                  •
                                </Text>
                              </>
                            )}
                            <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                              {formatActivityTime(activity.timestamp)}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                      {activity.amount && (
                        <Text fontWeight="bold">
                          ₹{activity.amount.toLocaleString()}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Pressable>
              ))}
            </VStack>
          ) : (
            <Box 
              p={4} 
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
              borderRadius="lg" 
              alignItems="center"
            >
              <Icon as={Ionicons} name="time-outline" size="lg" color="gray.400" mb={2} />
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                No recent activity
              </Text>
            </Box>
          )}
        </Box>

        {/* Friends */}
        <Box mb={8}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Friends</Heading>
            <Button size="sm" variant="ghost" onPress={navigateToFriends}>
              See All
            </Button>
          </HStack>

          {friendsSummary.length > 0 ? (
            <VStack space={3}>
              {friendsSummary.map(friend => (
                <Pressable key={friend.id} onPress={() => navigateToFriend(friend)}>
                  <Box
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                    p={3}
                    borderRadius="lg"
                    shadow={1}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack space={3} alignItems="center">
                        <Avatar 
                          source={friend.avatar ? { uri: friend.avatar } : undefined} 
                          size="sm"
                        >
                          {friend.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Text fontWeight="medium">{friend.name}</Text>
                      </HStack>

                      {friend.balance !== 0 && (
                        <Text
                          fontWeight="bold"
                          color={friend.balance > 0 ? 'green.500' : 'red.500'}
                        >
                          {friend.balance > 0 ? 
                            `owes you ₹${friend.balance.toLocaleString()}` : 
                            `you owe ₹${Math.abs(friend.balance).toLocaleString()}`}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Pressable>
              ))}
            </VStack>
          ) : (
            <Box 
              p={4} 
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
              borderRadius="lg" 
              alignItems="center"
            >
              <Icon as={Ionicons} name="people-outline" size="lg" color="gray.400" mb={2} />
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                No friends with pending balances
              </Text>
              <Button 
                size="sm" 
                variant="outline" 
                mt={3}
                onPress={navigateToFriends}
              >
                Add Friends
              </Button>
            </Box>
          )}
        </Box>

        {/* Groups */}
        <Box mb={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Groups</Heading>
            <Button size="sm" variant="ghost" onPress={navigateToGroups}>
              See All
            </Button>
          </HStack>

          {groupsSummary.length > 0 ? (
            <VStack space={3}>
              {groupsSummary.map(group => (
                <Pressable key={group.id} onPress={() => navigateToGroup(group)}>
                  <Box
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                    p={3}
                    borderRadius="lg"
                    shadow={1}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack space={3} alignItems="center">
                        <Center
                          bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                          p={2}
                          borderRadius="full"
                          h={10}
                          w={10}
                        >
                          <Icon as={Ionicons} name="people" color="primary.500" />
                        </Center>
                        <VStack>
                          <Text fontWeight="medium">{group.name}</Text>
                          <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                            {group.members?.length || 0} members
                          </Text>
                        </VStack>
                      </HStack>

                      {(group.owedToYou > 0 || group.owedByYou > 0) && (
                        <Text
                          fontWeight="bold"
                          color={group.owedToYou > 0 ? 'green.500' : 'red.500'}
                        >
                          {group.owedToYou > 0 ? 
                            `get ₹${group.owedToYou.toLocaleString()}` : 
                            `owe ₹${group.owedByYou.toLocaleString()}`}
                        </Text>
                      )}
                    </HStack>
                  </Box>
                </Pressable>
              ))}
            </VStack>
          ) : (
            <Box 
              p={4} 
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
              borderRadius="lg" 
              alignItems="center"
            >
              <Icon as={Ionicons} name="people-circle-outline" size="lg" color="gray.400" mb={2} />
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                No active groups
              </Text>
              <Button 
                size="sm" 
                variant="outline" 
                mt={3}
                onPress={navigateToGroups}
              >
                Create a Group
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </ScrollView>
  );
};

export default SplitExpensesScreen;