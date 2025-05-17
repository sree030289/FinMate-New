import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  FormControl,
  Input,
  Select,
  CheckIcon,
  Button,
  Icon,
  useColorMode,
  useToast,
  Pressable,
  Modal
} from 'native-base';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';

// Mock categories
const incomeCategories = [
  { id: 'salary', name: 'Salary', icon: 'cash' },
  { id: 'investments', name: 'Investments', icon: 'trending-up' },
  { id: 'gifts', name: 'Gifts', icon: 'gift' },
  { id: 'refunds', name: 'Refunds', icon: 'refresh' },
  { id: 'other_income', name: 'Other Income', icon: 'add-circle' },
];

const expenseCategories = [
  { id: 'food', name: 'Food & Dining', icon: 'fast-food' },
  { id: 'shopping', name: 'Shopping', icon: 'cart' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film' },
  { id: 'transportation', name: 'Transportation', icon: 'car' },
  { id: 'utilities', name: 'Utilities', icon: 'flash' },
  { id: 'housing', name: 'Housing', icon: 'home' },
  { id: 'health', name: 'Healthcare', icon: 'medical' },
  { id: 'education', name: 'Education', icon: 'school' },
  { id: 'travel', name: 'Travel', icon: 'airplane' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'card' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

const paymentMethods = [
  { id: 'cash', name: 'Cash' },
  { id: 'credit_card', name: 'Credit Card' },
  { id: 'debit_card', name: 'Debit Card' },
  { id: 'upi', name: 'UPI' },
  { id: 'net_banking', name: 'Net Banking' },
  { id: 'wallet', name: 'Digital Wallet' },
];

const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorMode } = useColorMode();
  const toast = useToast();
  const initialData = route.params?.initialData;

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [type, setType] = useState(initialData?.type || 'expense');
  const [category, setCategory] = useState(initialData?.category || '');
  const [date, setDate] = useState(initialData?.date ? new Date(initialData.date) : new Date());
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const saveTransaction = async () => {
    if (!title.trim()) {
      toast.show({
        title: "Missing information",
        description: "Please enter a title for the transaction",
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

    try {
      if (!auth.currentUser) throw new Error("User not authenticated");
      
      const parsedAmount = parseFloat(amount);
      const finalAmount = type === 'expense' ? -parsedAmount : parsedAmount;
      
      const transactionData = {
        title,
        amount: finalAmount,
        originalAmount: parsedAmount,
        type,
        category,
        date: date.toISOString().split('T')[0],
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        createdAt: serverTimestamp(),
      };
      
      await addDoc(
        collection(db, 'users', auth.currentUser.uid, 'transactions'),
        transactionData
      );
      
      toast.show({
        title: "Success",
        description: "Transaction added successfully",
        status: "success"
      });
      
      navigation.goBack();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.show({
        title: "Error",
        description: "Failed to save transaction",
        status: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;
  
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <VStack space={5}>
          {/* Transaction Type Toggle */}
          <Box>
            <Text mb={2} fontWeight="medium">Transaction Type</Text>
            <HStack space={4}>
              <Pressable 
                flex={1} 
                onPress={() => setType('expense')}
                bg={type === 'expense' 
                  ? (colorMode === 'dark' ? 'red.900' : 'red.100') 
                  : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
                py={3}
                borderRadius="md"
                borderWidth={type === 'expense' ? 2 : 1}
                borderColor={type === 'expense' ? 'red.500' : (colorMode === 'dark' ? 'border.dark' : 'border.light')}
              >
                <VStack alignItems="center">
                  <Icon 
                    as={Ionicons} 
                    name="arrow-down-outline" 
                    size="md" 
                    color={type === 'expense' ? 'red.500' : (colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light')} 
                  />
                  <Text 
                    color={type === 'expense' ? 'red.500' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
                    fontWeight={type === 'expense' ? 'bold' : 'normal'}
                  >
                    Expense
                  </Text>
                </VStack>
              </Pressable>
              
              <Pressable 
                flex={1} 
                onPress={() => setType('income')}
                bg={type === 'income' 
                  ? (colorMode === 'dark' ? 'green.900' : 'green.100') 
                  : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
                py={3}
                borderRadius="md"
                borderWidth={type === 'income' ? 2 : 1}
                borderColor={type === 'income' ? 'green.500' : (colorMode === 'dark' ? 'border.dark' : 'border.light')}
              >
                <VStack alignItems="center">
                  <Icon 
                    as={Ionicons} 
                    name="arrow-up-outline" 
                    size="md" 
                    color={type === 'income' ? 'green.500' : (colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light')} 
                  />
                  <Text 
                    color={type === 'income' ? 'green.500' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
                    fontWeight={type === 'income' ? 'bold' : 'normal'}
                  >
                    Income
                  </Text>
                </VStack>
              </Pressable>
            </HStack>
          </Box>
          
          {/* Amount Input */}
          <FormControl>
            <FormControl.Label>Amount</FormControl.Label>
            <Input
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              fontSize="xl"
              placeholder="0.00"
              InputLeftElement={
                <Text fontSize="xl" ml={3} color={colorMode === 'dark' ? 'text.dark' : 'text.light'}>₹</Text>
              }
            />
          </FormControl>
          
          {/* Title Input */}
          <FormControl>
            <FormControl.Label>Title</FormControl.Label>
            <Input
              value={title}
              onChangeText={setTitle}
              placeholder="Enter transaction title"
            />
          </FormControl>
          
          {/* Category Selector */}
          <FormControl>
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
                    name={currentCategories.find(c => c.id === category)?.icon || 'help-circle'} 
                    color="primary.500" 
                  />
                  <Text>{currentCategories.find(c => c.id === category)?.name || 'Select category'}</Text>
                </HStack>
              ) : (
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                  Select category
                </Text>
              )}
              <Icon as={Ionicons} name="chevron-down" />
            </Pressable>
          </FormControl>
          
          {/* Date Picker */}
          <FormControl>
            <FormControl.Label>Date</FormControl.Label>
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
              <Text>{formatDate(date)}</Text>
              <Icon as={Ionicons} name="calendar-outline" />
            </Pressable>
          </FormControl>
          
          {/* Payment Method */}
          <FormControl>
            <FormControl.Label>Payment Method</FormControl.Label>
            <Select
              selectedValue={paymentMethod}
              accessibilityLabel="Choose payment method"
              placeholder="Select payment method"
              onValueChange={setPaymentMethod}
              _selectedItem={{
                bg: 'primary.100',
                endIcon: <CheckIcon size={5} />,
              }}
            >
              {paymentMethods.map((method) => (
                <Select.Item key={method.id} label={method.name} value={method.id} />
              ))}
            </Select>
          </FormControl>
          
          {/* Notes */}
          <FormControl>
            <FormControl.Label>Notes (Optional)</FormControl.Label>
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes"
              multiline
              height={20}
              textAlignVertical="top"
            />
          </FormControl>
          
          {/* Submit Button */}
          <Button
            size="lg"
            colorScheme={type === 'income' ? 'green' : 'primary'}
            onPress={saveTransaction}
            isLoading={isSubmitting}
            mt={4}
          >
            Save Transaction
          </Button>
        </VStack>
        
        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
        
        {/* Category Modal */}
        <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} size="full">
          <Modal.Content maxWidth="400px">
            <Modal.CloseButton />
            <Modal.Header>Select Category</Modal.Header>
            <Modal.Body>
              <VStack space={3}>
                {currentCategories.map((cat) => (
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

export default AddTransactionScreen;
