import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  ScrollView,
  Pressable,
  Badge,
  useColorMode,
  FlatList,
  Avatar,
  IconButton,
  Menu,
  Divider,
  useToast,
  Checkbox
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Mock data for reminders
const initialReminders = [
  {
    id: '1',
    title: 'Credit Card Bill',
    amount: 15000,
    dueDate: '2023-06-15',
    category: 'Credit Cards',
    icon: 'card-outline',
    paid: false,
    recurring: true,
    recurrenceType: 'monthly'
  },
  {
    id: '2',
    title: 'Home Rent',
    amount: 25000,
    dueDate: '2023-06-10',
    category: 'Housing',
    icon: 'home-outline',
    paid: true,
    recurring: true,
    recurrenceType: 'monthly'
  },
  {
    id: '3',
    title: 'Netflix Subscription',
    amount: 499,
    dueDate: '2023-06-18',
    category: 'Subscriptions',
    icon: 'film-outline',
    paid: false,
    recurring: true,
    recurrenceType: 'monthly'
  },
  {
    id: '4',
    title: 'Car Insurance',
    amount: 12500,
    dueDate: '2023-06-30',
    category: 'Insurance',
    icon: 'car-outline',
    paid: false,
    recurring: true,
    recurrenceType: 'yearly'
  },
  {
    id: '5',
    title: 'Electricity Bill',
    amount: 3200,
    dueDate: '2023-06-22',
    category: 'Utilities',
    icon: 'flash-outline',
    paid: false,
    recurring: true,
    recurrenceType: 'monthly'
  },
];

const RemindersScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  const [reminders, setReminders] = useState(initialReminders);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Calculate days left for a reminder
  const getDaysLeft = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Toggle paid status
  const togglePaidStatus = (id) => {
    setReminders(reminders.map(reminder => 
      reminder.id === id ? {...reminder, paid: !reminder.paid} : reminder
    ));
    
    const reminder = reminders.find(r => r.id === id);
    const newStatus = !reminder.paid;
    
    toast.show({
      title: newStatus ? "Marked as Paid" : "Marked as Unpaid",
      description: `${reminder.title} has been marked as ${newStatus ? 'paid' : 'unpaid'}`,
      status: newStatus ? "success" : "info"
    });
  };
  
  // Filter reminders based on selected tab and filters
  const filteredReminders = reminders.filter(reminder => {
    // First filter by tab
    if (activeTab === 'upcoming' && reminder.paid) return false;
    if (activeTab === 'paid' && !reminder.paid) return false;
    
    // Then filter by category
    if (selectedFilter !== 'all' && reminder.category.toLowerCase() !== selectedFilter) return false;
    
    return true;
  });
  
  // Sort reminders by due date
  const sortedReminders = [...filteredReminders].sort((a, b) => {
    if (activeTab === 'upcoming') {
      // Sort upcoming by closest due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      // Sort paid by recently paid (just using the id as a proxy for paid date in this mock)
      return b.id.localeCompare(a.id);
    }
  });
  
  // Calculate total upcoming expenses
  const totalUpcoming = reminders
    .filter(r => !r.paid)
    .reduce((sum, reminder) => sum + reminder.amount, 0);
    
  // Categories for filter
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'credit cards', name: 'Credit Cards', icon: 'card-outline' },
    { id: 'housing', name: 'Housing', icon: 'home-outline' },
    { id: 'subscriptions', name: 'Subscriptions', icon: 'film-outline' },
    { id: 'insurance', name: 'Insurance', icon: 'shield-outline' },
    { id: 'utilities', name: 'Utilities', icon: 'flash-outline' }
  ];

  return (
    <Box flex={1} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      <Box p={5}>
        <HStack justifyContent="space-between" alignItems="center" mb={5}>
          <Heading size="lg">Bill Reminders</Heading>
          <Button
            leftIcon={<Icon as={Ionicons} name="add" size="sm" />}
            onPress={() => navigation.navigate('AddReminder')}
          >
            Add Reminder
          </Button>
        </HStack>
        
        {/* Summary cards */}
        <HStack space={4} mb={6}>
          <Box 
            flex={1} 
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
            p={4} 
            borderRadius="lg"
            shadow={1}
          >
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              {reminders.filter(r => !r.paid).length} Upcoming Bills
            </Text>
            <Text fontSize="xl" fontWeight="bold">₹{totalUpcoming.toLocaleString()}</Text>
          </Box>
          
          <Box 
            flex={1} 
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
            p={4} 
            borderRadius="lg"
            shadow={1}
          >
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Due This Week
            </Text>
            <Text fontSize="xl" fontWeight="bold">
              {reminders.filter(r => !r.paid && getDaysLeft(r.dueDate) <= 7 && getDaysLeft(r.dueDate) >= 0).length} Bills
            </Text>
          </Box>
        </HStack>
        
        {/* Tabs */}
        <Box 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
          borderRadius="lg" 
          p={1} 
          mb={4}
        >
          <HStack>
            <Pressable 
              flex={1} 
              alignItems="center" 
              py={2} 
              borderRadius="md"
              bg={activeTab === 'upcoming' ? 'primary.500' : 'transparent'}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text 
                color={activeTab === 'upcoming' ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
                fontWeight="medium"
              >
                Upcoming
              </Text>
            </Pressable>
            
            <Pressable 
              flex={1} 
              alignItems="center" 
              py={2} 
              borderRadius="md"
              bg={activeTab === 'paid' ? 'primary.500' : 'transparent'}
              onPress={() => setActiveTab('paid')}
            >
              <Text 
                color={activeTab === 'paid' ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
                fontWeight="medium"
              >
                Paid
              </Text>
            </Pressable>
          </HStack>
        </Box>
        
        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} mb={4}>
          <HStack space={2}>
            {categories.map(category => (
              <Pressable
                key={category.id}
                onPress={() => setSelectedFilter(category.id)}
                bg={selectedFilter === category.id ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
                px={4}
                py={2}
                borderRadius="full"
                flexDirection="row"
                alignItems="center"
              >
                {category.icon && (
                  <Icon 
                    as={Ionicons} 
                    name={category.icon} 
                    size="sm" 
                    color={selectedFilter === category.id ? 'white' : 'primary.500'}
                    mr={1}
                  />
                )}
                <Text
                  color={selectedFilter === category.id ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </HStack>
        </ScrollView>
      </Box>
      
      {/* Reminders list */}
      {sortedReminders.length > 0 ? (
        <FlatList
          data={sortedReminders}
          renderItem={({ item: reminder }) => {
            const daysLeft = getDaysLeft(reminder.dueDate);
            let status = 'normal';
            if (!reminder.paid) {
              if (daysLeft < 0) status = 'overdue';
              else if (daysLeft <= 3) status = 'soon';
            }
            
            return (
              <Pressable
                onPress={() => navigation.navigate('ReminderDetail', { reminder })}
                mb={3}
                mx={5}
              >
                <Box 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                  p={4} 
                  borderRadius="lg"
                  shadow={1}
                  borderLeftWidth={4}
                  borderLeftColor={
                    status === 'overdue' ? 'red.500' :
                    status === 'soon' ? 'orange.500' :
                    reminder.paid ? 'green.500' : 'primary.500'
                  }
                >
                  <HStack space={4} alignItems="center" justifyContent="space-between">
                    <HStack space={3} alignItems="center" flex={1}>
                      <Box 
                        p={2} 
                        borderRadius="full"
                        bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                      >
                        <Icon 
                          as={Ionicons} 
                          name={reminder.icon || 'calendar-outline'} 
                          size="md" 
                          color={
                            status === 'overdue' ? 'red.500' :
                            status === 'soon' ? 'orange.500' :
                            reminder.paid ? 'green.500' : 'primary.500'
                          }
                        />
                      </Box>
                      
                      <VStack flex={1}>
                        <Text fontWeight="medium">{reminder.title}</Text>
                        <HStack space={2} alignItems="center" flexWrap="wrap">
                          <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                            Due: {formatDate(reminder.dueDate)}
                          </Text>
                          
                          {reminder.recurring && (
                            <HStack space={1} alignItems="center">
                              <Icon as={Ionicons} name="repeat" size="2xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} />
                              <Text fontSize="2xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                                {reminder.recurrenceType}
                              </Text>
                            </HStack>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                    
                    <VStack alignItems="flex-end">
                      <Text fontWeight="bold">₹{reminder.amount.toLocaleString()}</Text>
                      
                      {!reminder.paid ? (
                        <Badge 
                          colorScheme={
                            status === 'overdue' ? 'red' :
                            status === 'soon' ? 'orange' : 'blue'
                          } 
                          rounded="md"
                          variant="subtle"
                          alignSelf="flex-start"
                          mt={1}
                        >
                          {status === 'overdue' ? 'Overdue' : 
                           status === 'soon' ? (daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} days`) : 
                           `Due in ${daysLeft} days`}
                        </Badge>
                      ) : (
                        <Badge colorScheme="green" rounded="md" variant="subtle" mt={1}>
                          Paid
                        </Badge>
                      )}
                    </VStack>
                  </HStack>
                  
                  <HStack justifyContent="space-between" mt={3} pt={3} borderTopWidth={1} borderColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}>
                    <HStack space={2} alignItems="center">
                      <Icon 
                        as={Ionicons} 
                        name={reminder.category === 'Credit Cards' ? 'card' : 
                              reminder.category === 'Housing' ? 'home' :
                              reminder.category === 'Subscriptions' ? 'film' :
                              reminder.category === 'Insurance' ? 'shield' :
                              reminder.category === 'Utilities' ? 'flash' : 'calendar'}
                        size="xs"
                        color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}
                      />
                      <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                        {reminder.category}
                      </Text>
                    </HStack>
                    
                    <HStack space={3}>
                      <Checkbox
                        value="paid"
                        isChecked={reminder.paid}
                        onChange={() => togglePaidStatus(reminder.id)}
                        accessibilityLabel="Mark as paid"
                        colorScheme="green"
                      >
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                          {reminder.paid ? 'Paid' : 'Mark as Paid'}
                        </Text>
                      </Checkbox>
                    </HStack>
                  </HStack>
                </Box>
              </Pressable>
            );
          }}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Box p={10} alignItems="center" justifyContent="center">
              <Icon as={Ionicons} name="calendar" size="6xl" color="gray.300" mb={4} />
              <Heading size="sm" textAlign="center" mb={2}>No Reminders</Heading>
              <Text color="gray.500" textAlign="center" mb={6}>
                {activeTab === 'upcoming' ? 
                  "You don't have any upcoming reminders." : 
                  "You haven't marked any reminders as paid yet."}
              </Text>
              <Button 
                leftIcon={<Icon as={Ionicons} name="add" />}
                onPress={() => navigation.navigate('AddReminder')}
              >
                Add Reminder
              </Button>
            </Box>
          }
        />
      ) : (
        <Box p={10} alignItems="center" justifyContent="center">
          <Icon as={Ionicons} name="calendar" size="6xl" color="gray.300" mb={4} />
          <Heading size="sm" textAlign="center" mb={2}>No Reminders</Heading>
          <Text color="gray.500" textAlign="center" mb={6}>
            {activeTab === 'upcoming' ? 
              "You don't have any upcoming reminders." : 
              "You haven't marked any reminders as paid yet."}
          </Text>
          <Button 
            leftIcon={<Icon as={Ionicons} name="add" />}
            onPress={() => navigation.navigate('AddReminder')}
          >
            Add Reminder
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RemindersScreen;
