import React, { useState } from 'react';
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
  Divider
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Mock data for recent activity
const recentActivity = [
  {
    id: '1',
    type: 'expense',
    description: 'Dinner at Restaurant',
    group: 'Roommates',
    amount: 3600,
    date: '2 hours ago',
    participants: 4
  },
  {
    id: '2',
    type: 'payment',
    description: 'Paid Amit Kumar',
    amount: 1250,
    date: '1 day ago'
  },
  {
    id: '3',
    type: 'expense',
    description: 'Movie Tickets',
    group: 'Goa Trip',
    amount: 1500,
    date: '3 days ago',
    participants: 3
  }
];

// Mock data for friends summary
const friendsSummary = [
  { id: '1', name: 'Rahul', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', owes: 450, owed: 0 },
  { id: '2', name: 'Priya', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', owes: 0, owed: 250 },
  { id: '3', name: 'Amit', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', owes: 800, owed: 0 },
];

// Mock data for groups
const groupsSummary = [
  { id: '1', name: 'Roommates', members: 4, totalOwed: 1250, totalOwe: 0 },
  { id: '2', name: 'Goa Trip', members: 6, totalOwed: 0, totalOwe: 850 },
];

const SplitExpensesScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const [totalOwed, setTotalOwed] = useState(2500); // Mock total owed to you
  const [totalOwe, setTotalOwe] = useState(850); // Mock total you owe

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
    // Navigate to a friend detail page or add expense with this friend
    navigation.navigate('AddExpense', { friend });
  };

  const navigateToGroup = (group) => {
    navigation.navigate('GroupDetail', {
      groupId: group.id,
      groupName: group.name
    });
  };

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
              ₹{totalOwed}
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
              ₹{totalOwe}
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
            <Button size="sm" variant="ghost" onPress={() => { /* Navigate to activity history */ }}>
              See All
            </Button>
          </HStack>

          <VStack space={3}>
            {recentActivity.map(activity => (
              <Pressable
                key={activity.id}
                onPress={() => {
                  if (activity.type === 'expense' && activity.group) {
                    navigation.navigate('GroupDetail', {
                      groupId: activity.id,
                      groupName: activity.group
                    });
                  }
                }}
              >
                <Box
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                  p={3}
                  borderRadius="lg"
                  shadow={1}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space={3} alignItems="center">
                      <Box
                        bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                        p={2}
                        borderRadius="full"
                      >
                        <Icon
                          as={Ionicons}
                          name={activity.type === 'expense' ? 'receipt-outline' : 'cash-outline'}
                          color="primary.500"
                        />
                      </Box>
                      <VStack>
                        <Text fontWeight="medium">{activity.description}</Text>
                        <HStack alignItems="center" space={1}>
                          {activity.group && (
                            <>
                              <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                                {activity.group}
                              </Text>
                              <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                                •
                              </Text>
                            </>
                          )}
                          <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                            {activity.date}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                    <Text fontWeight="bold">
                      ₹{activity.amount}
                    </Text>
                  </HStack>
                </Box>
              </Pressable>
            ))}
          </VStack>
        </Box>

        {/* Friends */}
        <Box mb={8}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Friends</Heading>
            <Button size="sm" variant="ghost" onPress={navigateToFriends}>
              See All
            </Button>
          </HStack>

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
                      <Avatar source={{ uri: friend.avatar }} size="sm">
                        {friend.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Text fontWeight="medium">{friend.name}</Text>
                    </HStack>

                    {(friend.owes > 0 || friend.owed > 0) ? (
                      <Text
                        fontWeight="bold"
                        color={friend.owes > 0 ? 'green.500' : 'red.500'}
                      >
                        {friend.owes > 0 ? `owes you ₹${friend.owes}` : `you owe ₹${friend.owed}`}
                      </Text>
                    ) : (
                      <Text color="green.500">settled up</Text>
                    )}
                  </HStack>
                </Box>
              </Pressable>
            ))}
          </VStack>
        </Box>

        {/* Groups */}
        <Box mb={4}>
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <Heading size="md">Groups</Heading>
            <Button size="sm" variant="ghost" onPress={navigateToGroups}>
              See All
            </Button>
          </HStack>

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
                          {group.members} members
                        </Text>
                      </VStack>
                    </HStack>

                    {(group.totalOwed > 0 || group.totalOwe > 0) ? (
                      <Text
                        fontWeight="bold"
                        color={group.totalOwed > 0 ? 'green.500' : 'red.500'}
                      >
                        {group.totalOwed > 0 ? `get ₹${group.totalOwed}` : `owe ₹${group.totalOwe}`}
                      </Text>
                    ) : (
                      <Text color="green.500">settled up</Text>
                    )}
                  </HStack>
                </Box>
              </Pressable>
            ))}
          </VStack>
        </Box>
      </Box>
    </ScrollView>
  );
};

export default SplitExpensesScreen;
