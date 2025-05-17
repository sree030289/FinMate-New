import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  FormControl,
  Input,
  Select,
  CheckIcon,
  Switch,
  useColorMode,
  Pressable,
  Modal,
  ScrollView,
  useToast
} from 'native-base';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

// Category options
const categoryOptions = [
  { id: 'bills', name: 'Bills', icon: 'receipt-outline' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'repeat-outline' },
  { id: 'loans', name: 'Loans', icon: 'cash-outline' },
  { id: 'credit_cards', name: 'Credit Cards', icon: 'card-outline' },
  { id: 'utilities', name: 'Utilities', icon: 'flash-outline' },
  { id: 'rent', name: 'Rent', icon: 'home-outline' },
  { id: 'emi', name: 'EMI', icon: 'calendar-outline' },
  { id: 'insurance', name: 'Insurance', icon: 'shield-outline' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const AddReminderScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('monthly');
  const [notificationTime, setNotificationTime] = useState('day_before');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const saveReminder = () => {
    if (!title.trim()) {
      toast.show({
        title: "Missing information",
        description: "Please enter a title for the reminder",
        status: "warning"
      });
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      toast.show({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        status: "warning"
      });
      return;
    }

    if (!category) {
      toast.show({
        title: "Missing information",
        description: "Please select a category",
        status: "warning"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      
      toast.show({
        title: "Reminder Added",
        description: `${title} has been added to your reminders`,
        status: "success"
      });
      
      navigation.goBack();
    }, 1000);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <VStack space={5}>
          <Heading size="lg" mb={2}>Add Reminder</Heading>
          
          {/* Title */}
          <FormControl isRequired>
            <FormControl.Label>Title</FormControl.Label>
            <Input
              placeholder="E.g. Credit Card Bill, Netflix"
              value={title}
              onChangeText={setTitle}
            />
          </FormControl>
          
          {/* Amount */}
          <FormControl isRequired>
            <FormControl.Label>Amount</FormControl.Label>
            <Input
              placeholder="Enter amount"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              InputLeftElement={
                <Text fontSize="lg" ml={3} color={colorMode === 'dark' ? 'text.dark' : 'text.light'}>₹</Text>
              }
            />
          </FormControl>
          
          {/* Category */}
          <FormControl isRequired>
            <FormControl.Label>Category</FormControl.Label>
            <Pressable
              onPress={() => setShowCategoryModal(true)}
              borderWidth={1}
              borderColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}
              borderRadius="md"
              py={3}
              px={4}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              bg={colorMode === 'dark' ? 'input.dark' : 'input.light'}
            >
              {category ? (
                <HStack alignItems="center" space={2}>
                  <Icon 
                    as={Ionicons} 
                    name={categoryOptions.find(c => c.id === category)?.icon || 'help-circle'} 
                    color="primary.500" 
                  />
                  <Text>{categoryOptions.find(c => c.id === category)?.name || 'Select category'}</Text>
                </HStack>
              ) : (
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                  Select category
                </Text>
              )}
              <Icon as={Ionicons} name="chevron-down" />
            </Pressable>
          </FormControl>
          
          {/* Due Date */}
          <FormControl isRequired>
            <FormControl.Label>Due Date</FormControl.Label>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              borderWidth={1}
              borderColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}
              borderRadius="md"
              py={3}
              px={4}
              flexDirection="row"
              justifyContent="space-between"
              alignItems="center"
              bg={colorMode === 'dark' ? 'input.dark' : 'input.light'}
            >
              <Text>{formatDate(dueDate)}</Text>
              <Icon as={Ionicons} name="calendar-outline" />
            </Pressable>
          </FormControl>
          
          {/* Recurring */}
          <FormControl>
            <HStack justifyContent="space-between" alignItems="center">
              <FormControl.Label m={0}>Recurring Payment</FormControl.Label>
              <Switch
                isChecked={isRecurring}
                onToggle={() => setIsRecurring(!isRecurring)}
                colorScheme="primary"
              />
            </HStack>
            <FormControl.HelperText>
              Set this for bills that repeat regularly
            </FormControl.HelperText>
          </FormControl>
          
          {/* Recurrence Type - show only if recurring */}
          {isRecurring && (
            <FormControl>
              <FormControl.Label>Recurrence</FormControl.Label>
              <Select
                selectedValue={recurrenceType}
                accessibilityLabel="Select recurrence"
                _selectedItem={{
                  bg: "primary.100",
                  endIcon: <CheckIcon size={5} />
                }}
                onValueChange={value => setRecurrenceType(value)}
              >
                <Select.Item label="Daily" value="daily" />
                <Select.Item label="Weekly" value="weekly" />
                <Select.Item label="Monthly" value="monthly" />
                <Select.Item label="Quarterly" value="quarterly" />
                <Select.Item label="Yearly" value="yearly" />
              </Select>
            </FormControl>
          )}
          
          {/* Notification Time */}
          <FormControl>
            <FormControl.Label>Remind Me</FormControl.Label>
            <Select
              selectedValue={notificationTime}
              accessibilityLabel="Select when to notify"
              _selectedItem={{
                bg: "primary.100",
                endIcon: <CheckIcon size={5} />
              }}
              onValueChange={value => setNotificationTime(value)}
            >
              <Select.Item label="On due date" value="same_day" />
              <Select.Item label="1 day before" value="day_before" />
              <Select.Item label="3 days before" value="three_days_before" />
              <Select.Item label="1 week before" value="week_before" />
            </Select>
          </FormControl>
          
          {/* Notes */}
          <FormControl>
            <FormControl.Label>Notes (Optional)</FormControl.Label>
            <Input
              placeholder="Add any additional notes"
              value={notes}
              onChangeText={setNotes}
              multiline
              height={20}
              textAlignVertical="top"
            />
          </FormControl>
          
          {/* Submit Button */}
          <Button
            mt={5}
            isLoading={isSubmitting}
            onPress={saveReminder}
            leftIcon={<Icon as={Ionicons} name="save-outline" size="sm" />}
          >
            Save Reminder
          </Button>
        </VStack>
        
        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={dueDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
        
        {/* Category Modal */}
        <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} size="full">
          <Modal.Content maxWidth="400px">
            <Modal.CloseButton />
            <Modal.Header>Select Category</Modal.Header>
            <Modal.Body>
              <VStack space={3}>
                {categoryOptions.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setCategory(cat.id);
                      setShowCategoryModal(false);
                    }}
                    py={3}
                    px={2}
                    borderBottomWidth={1}
                    borderBottomColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}
                    flexDirection="row"
                    alignItems="center"
                  >
                    <Box
                      borderRadius="full"
                      p={2}
                      mr={3}
                      bg={cat.id === category ? 'primary.100' : (colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')}
                    >
                      <Icon
                        as={Ionicons}
                        name={cat.icon}
                        color={cat.id === category ? 'primary.500' : (colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light')}
                        size="md"
                      />
                    </Box>
                    <Text
                      fontWeight={cat.id === category ? 'bold' : 'normal'}
                      color={cat.id === category ? 'primary.500' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </VStack>
            </Modal.Body>
          </Modal.Content>
        </Modal>
      </Box>
    </KeyboardAwareScrollView>
  );
};

export default AddReminderScreen;
