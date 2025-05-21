import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  FormControl,
  Switch,
  useColorMode,
  Pressable,
  Modal,
  useToast,
  IToastProps,
  Icon,
  Heading,
  IconButton,
  Divider,
  ScrollView
} from 'native-base';
import { reminderService } from '../../services/firestoreService';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, ParamListBase, useRoute } from '@react-navigation/native';
import { useStableNavigation } from '../../utils/navigationUtils';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform, TextInput, StyleSheet } from 'react-native';
import { Reminder } from '../../types';

// Category options with improved icons
const categoryOptions = [
  { id: 'bills', name: 'Bills', icon: 'receipt-outline', color: '#FF6B6B' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'sync-outline', color: '#4ECDC4' },
  { id: 'loans', name: 'Loans', icon: 'cash-outline', color: '#FFD166' },
  { id: 'credit cards', name: 'Credit Cards', icon: 'card-outline', color: '#06D6A0' },
  { id: 'utilities', name: 'Utilities', icon: 'flash-outline', color: '#118AB2' },
  { id: 'rent', name: 'Rent', icon: 'home-outline', color: '#073B4C' },
  { id: 'emi', name: 'EMI', icon: 'calendar-outline', color: '#EF476F' },
  { id: 'insurance', name: 'Insurance', icon: 'shield-outline', color: '#26547C' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#6D6875' },
];

// Notification time options
const notificationOptions = [
  { id: 'same_day', name: 'On due date' },
  { id: 'day_before', name: '1 day before' },
  { id: 'three_days_before', name: '3 days before' },
  { id: 'week_before', name: '1 week before' },
];

// Recurrence options
const recurrenceOptions = [
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly', default: true },
  { id: 'yearly', name: 'Yearly' },
];

const AddReminderScreen = () => {
  // Use stable navigation hook
  const navigation = useStableNavigation<ParamListBase>();
  const route = useRoute();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  // Get reminder to edit from params, if any
  const reminderToEdit = route.params?.reminderToEdit as Reminder | undefined;
  const isEditing = !!reminderToEdit;
  
  // Color theme (Robinhood-inspired)
  const THEME = {
    primary: '#00C805', // Robinhood green
    secondary: '#1E2124',
    background: colorMode === 'dark' ? '#1A1D1E' : '#F5F8FA',
    card: colorMode === 'dark' ? '#2A2D2F' : '#FFFFFF',
    text: colorMode === 'dark' ? '#FFFFFF' : '#1E2124',
    border: colorMode === 'dark' ? '#3A3D3F' : '#E5E8EA',
    placeholder: colorMode === 'dark' ? '#6A6D6F' : '#A0A4A8',
    success: '#00C805',
    error: '#FF5252',
  };

// Styles
const styles = StyleSheet.create({
  input: {
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
    fontSize: 16,
  }
});


  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [category, setCategory] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [notificationTime, setNotificationTime] = useState('day_before');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing data when editing
  useEffect(() => {
    if (isEditing && reminderToEdit) {
      setTitle(reminderToEdit.title || '');
      setAmount(reminderToEdit.amount?.toString() || '');
      
      // Set due date from string to Date object
      if (reminderToEdit.dueDate) {
        setDueDate(new Date(reminderToEdit.dueDate));
      }
      
      // Find matching category from our options
      if (reminderToEdit.category) {
        const foundCategory = categoryOptions.find(
          cat => cat.name.toLowerCase() === reminderToEdit.category?.toLowerCase()
        );
        
        if (foundCategory) {
          setCategory(foundCategory.id);
          setCategoryName(foundCategory.name);
          setCategoryIcon(foundCategory.icon);
        } else {
          // If category doesn't match our predefined list, set it as "Other"
          setCategory('other');
          setCategoryName(reminderToEdit.category);
          setCategoryIcon('ellipsis-horizontal-outline');
        }
      }
      
      setNotes(reminderToEdit.notes || '');
      setIsRecurring(reminderToEdit.recurring || false);
      
      if (reminderToEdit.recurrenceType) {
        setRecurrenceType(reminderToEdit.recurrenceType as 'daily' | 'weekly' | 'monthly' | 'yearly');
      }
      
      if (reminderToEdit.notificationTime) {
        setNotificationTime(reminderToEdit.notificationTime);
      }
    }
  }, [reminderToEdit, isEditing]);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(Platform.OS === 'ios');
    setDueDate(currentDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Select a category
  const handleCategorySelect = (categoryId: string, name: string, icon: string) => {
    setCategory(categoryId);
    setCategoryName(name);
    setCategoryIcon(icon);
    setShowCategoryModal(false);
  };

  // Get notification name by id
  const getNotificationName = (id: string): string => {
    const option = notificationOptions.find(opt => opt.id === id);
    return option ? option.name : 'Day before';
  };

  // Save reminder to database
  const saveReminder = async () => {
    if (!title.trim()) {
      toast.show({
        title: "Missing information",
        description: "Please enter a title for the reminder",
        placement: "top",
        backgroundColor: THEME.error
      } as IToastProps);
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.show({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        placement: "top",
        backgroundColor: THEME.error
      } as IToastProps);
      return;
    }

    if (!category) {
      toast.show({
        title: "Missing information",
        description: "Please select a category",
        placement: "top",
        backgroundColor: THEME.error
      } as IToastProps);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare reminder data to save
      const reminderData: any = {
        title,
        amount: parseFloat(amount),
        dueDate: dueDate.toISOString(),
        category: categoryName,
        paid: isEditing ? reminderToEdit?.paid || false : false,
        recurring: isRecurring,
        notificationTime: notificationTime,
        icon: categoryIcon || categoryOptions.find(c => c.id === category)?.icon || 'calendar-outline',
        notes,
      };
      
      // Only add recurrenceType field if isRecurring is true
      if (isRecurring) {
        reminderData.recurrenceType = recurrenceType;
      }
      
      // Create variables to store document ID and notification ID
      let reminderId: string | undefined;
      let notificationId: string | null = null;
        
      if (isEditing && reminderToEdit) {
        reminderId = reminderToEdit.id;
        // Update existing reminder
        await reminderService.updateReminder(reminderToEdit.id, reminderData);
        
        toast.show({
          title: "Reminder Updated",
          description: `${title} has been updated`,
          placement: "top",
          backgroundColor: THEME.success
        });
      } else {
        // Add new reminder to Firestore
        const docRef = await reminderService.addReminder(reminderData);
        reminderId = docRef.id;
        
        toast.show({
          title: "Reminder Added",
          description: `${title} has been added to your reminders`,
          placement: "top",
          backgroundColor: THEME.success
        });
      }
      
      // Schedule notification if it's not paid yet
      if (!reminderData.paid && reminderId) {
        try {
          // Import notification helpers with better error handling
          let scheduleReminderNotification, cancelReminderNotification;
          
          try {
            // Try to import the notification helper functions
            const notificationHelper = require('../../utils/notificiationHelper');
            scheduleReminderNotification = notificationHelper.scheduleReminderNotification;
            cancelReminderNotification = notificationHelper.cancelReminderNotification;
            
            // Check if we're editing and the notification needs to be rescheduled
            if (isEditing && reminderToEdit?.notificationId) {
              // Cancel the old notification first
              await cancelReminderNotification(reminderToEdit.notificationId);
            }
            
            // Schedule the new notification - include the reminder ID for the notification
            reminderData.id = reminderId;
            notificationId = await scheduleReminderNotification(reminderData);
            
            // Save the notification ID to Firestore for later reference
            if (notificationId && reminderId) {
              await reminderService.updateReminder(reminderId, { notificationId });
            }
          } catch (importError) {
            console.error('Error importing notification helpers:', importError);
            // Notification functionality will be skipped
          }
        } catch (notificationError) {
          console.error('Error in notification flow:', notificationError);
          // We don't want to block the flow if notification scheduling fails
        }
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving reminder:', error);
      toast.show({
        title: "Error",
        description: isEditing ? "Failed to update reminder" : "Failed to add reminder",
        placement: "top",
        backgroundColor: THEME.error
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate header title
  const headerTitle = isEditing 
    ? "Edit Reminder" 
    : title.trim() ? title : "New Reminder";

  return (
    <Box flex={1} bg={THEME.background}>
      {/* Header */}
      <Box 
        px={6} 
        pt={6} 
        pb={4} 
        bg={THEME.card} 
        shadow={3}
        borderBottomWidth={1} 
        borderBottomColor={THEME.border}
      >
        <HStack justifyContent="space-between" alignItems="center">
          <IconButton
            icon={<Icon as={Ionicons} name="arrow-back" size="md" color={THEME.text} />}
            variant="ghost"
            onPress={() => navigation.goBack()}
            borderRadius="full"
            _pressed={{ bg: `${THEME.primary}15` }}
          />
          <Heading size="md" color={THEME.text} numberOfLines={1} maxW="70%">
            {headerTitle}
          </Heading>
          <IconButton 
            icon={<Icon as={Ionicons} name="checkmark" size="md" color={THEME.primary} />}
            variant="ghost"
            onPress={saveReminder}
            isLoading={isSubmitting}
            borderRadius="full"
            _pressed={{ bg: `${THEME.primary}15` }}
          />
        </HStack>
      </Box>
      
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content */}
        <VStack space={4} px={6} py={6}>
          {/* Title & Amount Fields - Main focus with larger inputs */}
          <Box 
            p={6} 
            rounded="2xl" 
            bg={THEME.card} 
            shadow={2}
            mb={2}
          >
            <VStack space={6}>
              {/* Title */}
              <FormControl>
                <TextInput
                  placeholder="Reminder Title"
                  placeholderTextColor={THEME.placeholder}
                  value={title}
                  onChangeText={setTitle}
                  style={[
                    styles.input,
                    {
                      fontSize: 22,
                      fontWeight: '500',
                      textAlign: 'center',
                      color: THEME.text,
                      borderBottomWidth: 1,
                      borderBottomColor: THEME.border,
                      paddingVertical: 8,
                    }
                  ]}
                />
              </FormControl>
              
              {/* Amount */}
              <FormControl>
                <Box flexDirection="row" justifyContent="center" alignItems="center">
                  <Text fontSize="3xl" fontWeight="bold" color={THEME.text} mr={1}>₹</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={THEME.placeholder}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    style={[
                      styles.input,
                      {
                        fontSize: 28,
                        fontWeight: 'bold',
                        textAlign: 'center',
                        color: THEME.text,
                        width: '80%',
                      }
                    ]}
                  />
                </Box>
              </FormControl>
            </VStack>
          </Box>
          
          {/* Category & Date - Row with icons */}
          <HStack space={4} mb={2}>
            {/* Category Selection */}
            <Pressable
              flex={1}
              onPress={() => setShowCategoryModal(true)}
              bg={THEME.card}
              p={4}
              rounded="xl"
              shadow={1}
            >
              <VStack alignItems="center" space={2}>
                <Box 
                  p={3} 
                  bg={category ? (categoryOptions.find(c => c.id === category)?.color + '20') : `${THEME.primary}15`} 
                  rounded="full"
                >
                  <Icon 
                    as={Ionicons} 
                    name={categoryIcon || (category ? categoryOptions.find(c => c.id === category)?.icon : 'apps')} 
                    size="md" 
                    color={category ? categoryOptions.find(c => c.id === category)?.color : THEME.primary} 
                  />
                </Box>
                <Text color={THEME.text} fontWeight="medium">
                  {categoryName || 'Category'}
                </Text>
              </VStack>
            </Pressable>
            
            {/* Date Selection */}
            <Pressable
              flex={1}
              onPress={() => setShowDatePicker(true)}
              bg={THEME.card}
              p={4}
              rounded="xl"
              shadow={1}
            >
              <VStack alignItems="center" space={2}>
                <Box p={3} bg={`${THEME.primary}15`} rounded="full">
                  <Icon as={Ionicons} name="calendar" size="md" color={THEME.primary} />
                </Box>
                <Text color={THEME.text} fontWeight="medium">{formatDate(dueDate)}</Text>
              </VStack>
            </Pressable>
          </HStack>
          
          {/* Other Settings Card */}
          <Box bg={THEME.card} p={5} rounded="xl" shadow={1} mt={2}>
            <VStack space={5} divider={<Divider bg={THEME.border} />}>
              {/* Recurring Payment Toggle */}
              <HStack justifyContent="space-between" alignItems="center">
                <HStack space={3} alignItems="center">
                  <Icon as={Ionicons} name="repeat" size="sm" color={THEME.primary} />
                  <Text fontWeight="medium" color={THEME.text}>Recurring Payment</Text>
                </HStack>
                <Switch
                  isChecked={isRecurring}
                  onToggle={() => setIsRecurring(!isRecurring)}
                  onTrackColor={THEME.primary}
                />
              </HStack>
              
              {/* Recurrence Type - show only if recurring */}
              {isRecurring && (
                <Pressable 
                  onPress={() => setShowRecurrenceModal(true)}
                  py={1}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space={3} alignItems="center">
                      <Icon as={Ionicons} name="time" size="sm" color={THEME.primary} />
                      <Text fontWeight="medium" color={THEME.text}>Recurrence</Text>
                    </HStack>
                    <HStack space={1} alignItems="center">
                      <Text color={THEME.text}>
                        {recurrenceOptions.find(opt => opt.id === recurrenceType)?.name || 'Monthly'}
                      </Text>
                      <Icon as={Ionicons} name="chevron-forward" size="sm" color={THEME.placeholder} />
                    </HStack>
                  </HStack>
                </Pressable>
              )}
              
              {/* Notification Time */}
              <Pressable 
                onPress={() => setShowNotificationModal(true)}
                py={1}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Icon as={Ionicons} name="notifications" size="sm" color={THEME.primary} />
                    <Text fontWeight="medium" color={THEME.text}>Remind Me</Text>
                  </HStack>
                  <HStack space={1} alignItems="center">
                    <Text color={THEME.text}>{getNotificationName(notificationTime)}</Text>
                    <Icon as={Ionicons} name="chevron-forward" size="sm" color={THEME.placeholder} />
                  </HStack>
                </HStack>
              </Pressable>
            </VStack>
          </Box>
          
          {/* Notes */}
          <Box bg={THEME.card} p={5} rounded="xl" shadow={1} mt={2} mb={8}>
            <FormControl>
              <FormControl.Label _text={{ color: THEME.text, fontWeight: "medium" }}>
                Notes (Optional)
              </FormControl.Label>
              <TextInput
                placeholder="Add any additional notes"
                placeholderTextColor={THEME.placeholder}
                value={notes}
                onChangeText={setNotes}
                multiline={true}
                style={[
                  styles.input,
                  {
                    height: 80,
                    backgroundColor: `${THEME.border}20`,
                    borderRadius: 8,
                    padding: 12,
                    color: THEME.text,
                    textAlignVertical: 'top',
                  }
                ]}
              />
            </FormControl>
          </Box>
        </VStack>
      </KeyboardAwareScrollView>
      
      {/* Save Button - Fixed at bottom */}
      <Box position="absolute" bottom={8} left={0} right={0} alignItems="center">
        <Button
          onPress={saveReminder}
          isLoading={isSubmitting}
          bg={THEME.primary}
          _pressed={{ bg: THEME.primary + 'CC' }}
          rounded="full"
          shadow={3}
          leftIcon={<Icon as={Ionicons} name={isEditing ? "save-outline" : "add-outline"} size="sm" />}
          px={8}
        >
          {isEditing ? "Update Reminder" : "Save Reminder"}
        </Button>
      </Box>
      
      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
          accentColor={THEME.primary}
        />
      )}
      
      {/* Category Modal */}
      <Modal 
        isOpen={showCategoryModal} 
        onClose={() => setShowCategoryModal(false)} 
        size="full"
        animationPreset="slide"
      >
        <Modal.Content 
          maxH="80%" 
          maxW="94%" 
          borderRadius="2xl"
          bg={THEME.card}
        >
          <Modal.CloseButton _icon={{ color: THEME.text }} />
          <Modal.Header 
            bg={THEME.card} 
            borderBottomWidth={1} 
            borderBottomColor={THEME.border}
          >
            <Text color={THEME.text} fontSize="lg" fontWeight="semibold">Select Category</Text>
          </Modal.Header>
          <Modal.Body p={4}>
            <ScrollView>
              {categoryOptions.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => handleCategorySelect(cat.id, cat.name, cat.icon)}
                  py={4}
                  flexDirection="row"
                  alignItems="center"
                  justifyContent="space-between"
                  mx={2}
                  my={1}
                  bg={category === cat.id ? `${THEME.primary}15` : 'transparent'}
                  borderRadius="lg"
                  px={3}
                >
                  <HStack space={3} alignItems="center">
                    <Box
                      p={3}
                      borderRadius="full"
                      bg={cat.color + '20'}
                    >
                      <Icon
                        as={Ionicons}
                        name={cat.icon}
                        color={cat.color}
                        size="md"
                      />
                    </Box>
                    <Text
                      fontWeight={category === cat.id ? 'bold' : 'normal'}
                      color={category === cat.id ? THEME.primary : THEME.text}
                      fontSize="md"
                    >
                      {cat.name}
                    </Text>
                  </HStack>
                  
                  {category === cat.id && (
                    <Icon as={Ionicons} name="checkmark-circle" color={THEME.primary} size="sm" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      
      {/* Recurrence Type Modal */}
      <Modal 
        isOpen={showRecurrenceModal} 
        onClose={() => setShowRecurrenceModal(false)} 
        size="md"
        animationPreset="slide"
      >
        <Modal.Content 
          maxH="60%" 
          borderRadius="2xl"
          bg={THEME.card}
        >
          <Modal.CloseButton _icon={{ color: THEME.text }} />
          <Modal.Header 
            bg={THEME.card} 
            borderBottomWidth={1} 
            borderBottomColor={THEME.border}
          >
            <Text color={THEME.text} fontSize="md" fontWeight="semibold">Recurrence Type</Text>
          </Modal.Header>
          <Modal.Body p={4}>
            <VStack space={2}>
              {recurrenceOptions.map(option => (
                <Pressable
                  key={option.id}
                  bg={recurrenceType === option.id ? `${THEME.primary}15` : 'transparent'}
                  p={4}
                  rounded="lg"
                  onPress={() => {
                    setRecurrenceType(option.id as 'daily' | 'weekly' | 'monthly' | 'yearly');
                    setShowRecurrenceModal(false);
                  }}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text 
                      color={recurrenceType === option.id ? THEME.primary : THEME.text}
                      fontWeight={recurrenceType === option.id ? "bold" : "normal"}
                    >
                      {option.name}
                    </Text>
                    {recurrenceType === option.id && (
                      <Icon as={Ionicons} name="checkmark-circle" color={THEME.primary} />
                    )}
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>
      
      {/* Notification Time Modal */}
      <Modal 
        isOpen={showNotificationModal} 
        onClose={() => setShowNotificationModal(false)} 
        size="md"
        animationPreset="slide"
      >
        <Modal.Content 
          maxH="60%" 
          borderRadius="2xl"
          bg={THEME.card}
        >
          <Modal.CloseButton _icon={{ color: THEME.text }} />
          <Modal.Header 
            bg={THEME.card} 
            borderBottomWidth={1} 
            borderBottomColor={THEME.border}
          >
            <Text color={THEME.text} fontSize="md" fontWeight="semibold">Remind Me</Text>
          </Modal.Header>
          <Modal.Body p={4}>
            <VStack space={2}>
              {notificationOptions.map(option => (
                <Pressable
                  key={option.id}
                  bg={notificationTime === option.id ? `${THEME.primary}15` : 'transparent'}
                  p={4}
                  rounded="lg"
                  onPress={() => {
                    setNotificationTime(option.id);
                    setShowNotificationModal(false);
                  }}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <Text 
                      color={notificationTime === option.id ? THEME.primary : THEME.text}
                      fontWeight={notificationTime === option.id ? "bold" : "normal"}
                    >
                      {option.name}
                    </Text>
                    {notificationTime === option.id && (
                      <Icon as={Ionicons} name="checkmark-circle" color={THEME.primary} />
                    )}
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </Modal.Body>
        </Modal.Content>
      </Modal>
    </Box>
  );
}