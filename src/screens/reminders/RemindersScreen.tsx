import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  RefreshControl,
  StyleSheet,
  Platform,
  Dimensions,
  TouchableOpacity,
  Animated
} from 'react-native';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Pressable,
  Badge,
  useColorMode,
  IconButton,
  Divider,
  useToast,
  Center,
  StatusBar,
  ScrollView,
  FlatList
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebase'; // Fixed: Added auth import
import { reminderService } from '../../services/firestoreService';
import { Reminder } from '../../types';
import { NavigationProps } from '../../types/navigation';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';

const { width } = Dimensions.get('window');

const RemindersScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  // THEME - Robinhood-inspired but more subtle
  const THEME = {
    primary: '#00C805', // Robinhood green
    primaryDark: '#00A804',
    primaryLight: '#33D535',
    background: colorMode === 'dark' ? '#0D1117' : '#F5F8FA',
    card: colorMode === 'dark' ? '#161B22' : '#FFFFFF',
    text: colorMode === 'dark' ? '#FFFFFF' : '#1E2124',
    secondaryText: colorMode === 'dark' ? '#9CA3AF' : '#6B7280',
    border: colorMode === 'dark' ? '#30363D' : '#E5E7EB',
    placeholder: colorMode === 'dark' ? '#6A6D6F' : '#A0A4A8',
    success: '#00C805',
    error: '#F87171',
    warning: '#FBBF24',
    focus: colorMode === 'dark' ? '#58A6FF' : '#3B82F6',
    overdue: '#F87171',
    today: '#FBBF24',
  };
  
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Calculate days left for a reminder
  const getDaysLeft = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Fetch reminders directly from Firestore
  const fetchReminders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!auth.currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Get direct reference to reminders collection
      const remindersRef = collection(db, 'users', auth.currentUser.uid, 'reminders');
      const q = query(remindersRef, orderBy('dueDate', 'asc'));
      
      // Get data once
      const snapshot = await getDocs(q);
      const reminderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reminder[];
      
      setReminders(reminderList);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setError('Failed to load reminders. Please try again.');
      setIsLoading(false);
    }
  }, []);
  
  // Setup real-time listener for reminders
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const remindersRef = collection(db, 'users', auth.currentUser.uid, 'reminders');
    const q = query(remindersRef, orderBy('dueDate', 'asc'));
    
    // Setup listener
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const reminderList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Reminder[];
        
        setReminders(reminderList);
        setIsLoading(false);
      },
      (err) => {
        console.error('Error in reminders snapshot:', err);
        setError('Failed to load reminders. Please try again.');
        setIsLoading(false);
      }
    );
    
    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);
  
  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchReminders();
      return () => {};
    }, [fetchReminders])
  );
  
  // Toggle paid status
  const togglePaidStatus = async (id: string) => {
    try {
      const reminder = reminders?.find(r => r.id === id);
      if (!reminder) return;
      
      const newStatus = !reminder.paid;
      
      // Update in Firestore
      await reminderService.updateReminder(id, { paid: newStatus });
      
      // Show toast
      toast.show({
        title: newStatus ? "Marked as Paid" : "Marked as Unpaid",
        status: newStatus ? "success" : "info",
        placement: "bottom",
        duration: 2000,
      });
    } catch (error) {
      toast.show({
        title: "Error updating reminder",
        status: "error",
        placement: "bottom",
        duration: 2000,
      });
    }
  };
  
  // Filter reminders based on selected tab and filters
  const filteredReminders = reminders.filter(reminder => {
    // First filter by tab
    if (activeTab === 'upcoming' && reminder.paid) return false;
    if (activeTab === 'paid' && !reminder.paid) return false;
    
    // Then filter by category
    if (selectedFilter !== 'all' && reminder.category?.toLowerCase() !== selectedFilter) return false;
    
    return true;
  });
  
  // Sort reminders by due date
  const sortedReminders = [...filteredReminders].sort((a, b) => {
    if (activeTab === 'upcoming') {
      // Sort upcoming by closest due date
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      // Sort paid by recently paid (just using the due date as a proxy)
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
  });
  
  // Calculate total upcoming expenses
  const totalUpcoming = reminders
    .filter(r => !r.paid)
    .reduce((sum, reminder) => sum + reminder.amount, 0);
    
  // Calculate due this week count
  const dueThisWeek = reminders
    .filter(r => !r.paid && getDaysLeft(r.dueDate) <= 7 && getDaysLeft(r.dueDate) >= 0)
    .length;
    
  // Categories for filter
  const categories = [
    { id: 'all', name: 'All', icon: 'apps-outline' },
    { id: 'bills', name: 'Bills', icon: 'receipt-outline' },
    { id: 'subscriptions', name: 'Subscriptions', icon: 'sync-outline' },
    { id: 'credit_cards', name: 'Credit Cards', icon: 'card-outline' },
    { id: 'utilities', name: 'Utilities', icon: 'flash-outline' },
    { id: 'rent', name: 'Rent', icon: 'home-outline' },
    { id: 'insurance', name: 'Insurance', icon: 'shield-outline' },
  ];
  
  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchReminders();
    } catch (err) {
      console.error('Error refreshing reminders:', err);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Get color based on reminder status
  const getReminderColor = (reminder) => {
    const daysLeft = getDaysLeft(reminder.dueDate);
    if (reminder.paid) return THEME.success;
    if (daysLeft < 0) return THEME.overdue;
    if (daysLeft === 0) return THEME.today;
    return THEME.primary;
  };
  
  // Get text for due date status
  const getDueDateText = (reminder) => {
    const daysLeft = getDaysLeft(reminder.dueDate);
    if (reminder.paid) return "Paid";
    if (daysLeft < 0) return "Overdue";
    if (daysLeft === 0) return "Due Today";
    if (daysLeft === 1) return "Due Tomorrow";
    return `${daysLeft} Days Left`;
  };
  
  // Empty state component
  const ReminderEmptyState = ({ isUpcoming = true }) => {
    return (
      <Center py={10} px={6}>
        <Icon 
          as={Ionicons} 
          name={isUpcoming ? "calendar-outline" : "checkbox-outline"}
          size="6xl" 
          color={THEME.secondaryText} 
          opacity={0.6} 
        />
        
        <VStack alignItems="center" space={4} mt={4}>
          <Heading size="md" color={THEME.text}>
            {isUpcoming ? "No Upcoming Reminders" : "No Paid Bills Yet"}
          </Heading>
          
          <Text color={THEME.secondaryText} textAlign="center" px={8}>
            {isUpcoming 
              ? "You don't have any upcoming bills to pay. Add a reminder to stay on top of your expenses."
              : "When you mark reminders as paid, they'll appear here for your records."}
          </Text>
          
          <Button
            mt={4}
            bg={THEME.primary}
            _pressed={{ bg: THEME.primaryDark }}
            rounded="xl"
            leftIcon={<Icon as={Ionicons} name="add" size="sm" />}
            onPress={() => navigation.navigate('AddReminder')}
            px={6}
          >
            Add Reminder
          </Button>
        </VStack>
      </Center>
    );
  };
  
  // Render a reminder card
  const renderReminderCard = ({ item: reminder }) => {
    const reminderColor = getReminderColor(reminder);
    const dueText = getDueDateText(reminder);
    
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ReminderDetail', { reminder })}
        style={styles.cardTouchable}
      >
        <Box
          style={[styles.reminderCard, { borderLeftColor: reminderColor }]}
          bg={THEME.card}
          shadow={2}
        >
          {/* Top section with title and amount */}
          <HStack justifyContent="space-between" alignItems="center" mb={2}>
            <HStack space={3} alignItems="center">
              <Box
                style={styles.iconCircle}
                bg={`${reminderColor}15`}
              >
                <Icon 
                  as={Ionicons} 
                  name={reminder.icon || 'calendar-outline'} 
                  color={reminderColor} 
                  size="md" 
                />
              </Box>
              <VStack>
                <Text 
                  fontSize="lg" 
                  fontWeight="bold" 
                  color={THEME.text}
                  numberOfLines={1}
                >
                  {reminder.title}
                </Text>
                <Text 
                  fontSize="xs" 
                  color={THEME.secondaryText}
                >
                  Due: {formatDate(reminder.dueDate)}
                </Text>
              </VStack>
            </HStack>
          </HStack>
          
          {/* Middle section with amount */}
          <HStack justifyContent="space-between" alignItems="center" mb={3}>
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color={THEME.text}
            >
              ₹{reminder.amount.toLocaleString()}
            </Text>
            
            <Badge
              variant="subtle"
              rounded="xl"
              bg={`${reminderColor}15`}
              borderWidth={1}
              borderColor={`${reminderColor}30`}
              _text={{ color: reminderColor, fontWeight: "medium", fontSize: "xs" }}
              px={3}
              py={1}
            >
              {dueText}
            </Badge>
          </HStack>
          
          {/* Bottom section with category and checkbox */}
          <Divider bg={THEME.border} opacity={0.5} mb={3} />
          
          <HStack justifyContent="space-between" alignItems="center">
            <HStack space={2} alignItems="center">
              <Icon 
                as={Ionicons} 
                name="folder-outline" 
                size="xs" 
                color={THEME.secondaryText} 
              />
              <Text fontSize="xs" color={THEME.secondaryText}>
                {reminder.category}
              </Text>
            </HStack>
            
            <Button
              onPress={() => togglePaidStatus(reminder.id)}
              size="xs"
              rounded="lg"
              bg={reminder.paid ? THEME.success : "transparent"}
              borderWidth={1}
              borderColor={reminder.paid ? THEME.success : THEME.border}
              _text={{ color: reminder.paid ? "white" : THEME.secondaryText }}
              _pressed={{ opacity: 0.7 }}
              leftIcon={reminder.paid ? 
                <Icon as={Ionicons} name="checkmark" size="xs" color="white" /> : null
              }
            >
              {reminder.paid ? "Paid" : "Mark as Paid"}
            </Button>
          </HStack>
        </Box>
      </TouchableOpacity>
    );
  };
  
  return (
    <Box flex={1} bg={THEME.background} safeAreaTop>
      <StatusBar barStyle={colorMode === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* More subtle header with less green dominance */}
      <Box px={6} pt={4} pb={2}>
        <HStack justifyContent="space-between" alignItems="center" mb={3}>
          <VStack>
            <Heading size="lg" color={THEME.text}>Bill Reminders</Heading>
            <Text color={THEME.secondaryText} fontSize="sm">
              {reminders.filter(r => !r.paid).length} upcoming bills
            </Text>
          </VStack>
          
          <IconButton
            onPress={() => navigation.navigate('AddReminder')}
            icon={<Icon as={Ionicons} name="add" color={THEME.text} size="md" />}
            borderRadius="full"
            bg="transparent"
            _pressed={{ bg: `${THEME.primary}15` }}
            size="md"
          />
        </HStack>
        
        {/* Summary Cards */}
        <HStack space={4} mb={4}>
          <Box 
            flex={1} 
            bg={THEME.card} 
            p={4} 
            borderRadius="xl"
            shadow={1}
            borderLeftWidth={4}
            borderLeftColor={THEME.primary}
          >
            <Text color={THEME.secondaryText} fontSize="sm">Total Upcoming</Text>
            <Text fontSize="xl" fontWeight="bold" color={THEME.text}>₹{totalUpcoming.toLocaleString()}</Text>
          </Box>
          
          <Box 
            flex={1} 
            bg={THEME.card} 
            p={4} 
            borderRadius="xl"
            shadow={1}
            borderLeftWidth={4}
            borderLeftColor={THEME.warning}
          >
            <Text color={THEME.secondaryText} fontSize="sm">Due This Week</Text>
            <Text fontSize="xl" fontWeight="bold" color={THEME.text}>{dueThisWeek} Bills</Text>
          </Box>
        </HStack>
        
        {/* Tabs */}
        <Box 
          bg={colorMode === 'dark' ? 'gray.800' : 'gray.100'} 
          borderRadius="xl" 
          mb={2} 
          p={1}
        >
          <HStack>
            <Pressable 
              flex={1} 
              alignItems="center" 
              py={2}
              rounded="lg"
              bg={activeTab === 'upcoming' ? THEME.card : 'transparent'}
              shadow={activeTab === 'upcoming' ? 1 : 0}
              onPress={() => setActiveTab('upcoming')}
            >
              <Text 
                color={activeTab === 'upcoming' ? THEME.primary : THEME.secondaryText}
                fontWeight={activeTab === 'upcoming' ? 'bold' : 'normal'}
              >
                Upcoming
              </Text>
            </Pressable>
            
            <Pressable 
              flex={1} 
              alignItems="center" 
              py={2} 
              rounded="lg"
              bg={activeTab === 'paid' ? THEME.card : 'transparent'}
              shadow={activeTab === 'paid' ? 1 : 0}
              onPress={() => setActiveTab('paid')}
            >
              <Text 
                color={activeTab === 'paid' ? THEME.primary : THEME.secondaryText}
                fontWeight={activeTab === 'paid' ? 'bold' : 'normal'}
              >
                Paid
              </Text>
            </Pressable>
          </HStack>
        </Box>
      </Box>
      
      {/* Category Filter */}
      <Box px={6} pb={2}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
        >
          <HStack space={2}>
            {categories.map(category => (
              <Pressable
                key={category.id}
                onPress={() => setSelectedFilter(category.id)}
                bg={selectedFilter === category.id ? `${THEME.primary}15` : THEME.card}
                px={4}
                py={2}
                rounded="full"
                borderWidth={1}
                borderColor={selectedFilter === category.id ? THEME.primary : THEME.border}
                flexDirection="row"
                alignItems="center"
                shadow={selectedFilter === category.id ? 1 : 0}
              >
                <Icon 
                  as={Ionicons} 
                  name={category.icon} 
                  size="sm" 
                  color={selectedFilter === category.id ? THEME.primary : THEME.secondaryText}
                  mr={1}
                />
                <Text
                  color={selectedFilter === category.id ? THEME.primary : THEME.secondaryText}
                  fontWeight={selectedFilter === category.id ? "medium" : "normal"}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </HStack>
        </ScrollView>
      </Box>
      
      {/* Main Content */}
      <Box flex={1}>
        {isLoading ? (
          <Center flex={1}>
            <LoadingState message="Loading reminders..." />
          </Center>
        ) : error ? (
          <ErrorState 
            error={{ message: error }} 
            onRetry={fetchReminders}
          />
        ) : (
          <FlatList
            data={sortedReminders}
            keyExtractor={(item) => item.id}
            renderItem={renderReminderCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={THEME.primary}
                colors={[THEME.primary]}
              />
            }
            ListEmptyComponent={
              <ReminderEmptyState isUpcoming={activeTab === 'upcoming'} />
            }
          />
        )}
      </Box>
      
      {/* Add Button - Fixed at bottom right */}
      <Box position="absolute" bottom={6} right={6}>
        <Button
          onPress={() => navigation.navigate('AddReminder')}
          bg={THEME.primary}
          _pressed={{ bg: THEME.primaryDark }}
          rounded="full"
          shadow={2}
          width={16}
          height={16}
          p={0}
        >
          <Icon as={Ionicons} name="add" color="white" size="lg" />
        </Button>
      </Box>
    </Box>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  reminderCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  cardTouchable: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default RemindersScreen;