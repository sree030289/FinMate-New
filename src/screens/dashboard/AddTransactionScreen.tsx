import React, { useState, useEffect } from 'react';
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
  Modal,
  IToastProps,
  WarningOutlineIcon
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { transactionService, categoryService } from '../../services/firestoreService';
import { NavigationProps, RouteProps } from '../../types/navigation';
import { Category, Transaction } from '../../types';
import { useFetch, useMutation } from '../../hooks/useData';
import LoadingState from '../../components/LoadingState';

// Default categories (used as fallback if API fails)
const defaultIncomeCategories = [
  { id: 'salary', name: 'Salary', icon: 'cash', color: 'green.500' },
  { id: 'investments', name: 'Investments', icon: 'trending-up', color: 'blue.500' },
  { id: 'gifts', name: 'Gifts', icon: 'gift', color: 'purple.500' },
  { id: 'refunds', name: 'Refunds', icon: 'refresh', color: 'teal.500' },
  { id: 'other_income', name: 'Other Income', icon: 'add-circle', color: 'orange.500' },
];

const defaultExpenseCategories = [
  { id: 'food', name: 'Food & Dining', icon: 'fast-food', color: 'red.500' },
  { id: 'shopping', name: 'Shopping', icon: 'cart', color: 'blue.500' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film', color: 'violet.500' },
  { id: 'transportation', name: 'Transportation', icon: 'car', color: 'green.500' },
  { id: 'utilities', name: 'Utilities', icon: 'flash', color: 'yellow.500' },
  { id: 'housing', name: 'Housing', icon: 'home', color: 'pink.500' },
  { id: 'health', name: 'Healthcare', icon: 'medical', color: 'teal.500' },
  { id: 'education', name: 'Education', icon: 'school', color: 'indigo.500' },
  { id: 'travel', name: 'Travel', icon: 'airplane', color: 'cyan.500' },
  { id: 'subscriptions', name: 'Subscriptions', icon: 'card', color: 'orange.500' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: 'gray.500' },
];

const paymentMethods = [
  { id: 'cash', name: 'Cash' },
  { id: 'credit_card', name: 'Credit Card' },
  { id: 'debit_card', name: 'Debit Card' },
  { id: 'upi', name: 'UPI' },
  { id: 'net_banking', name: 'Net Banking' },
  { id: 'wallet', name: 'Digital Wallet' },
];

interface FormErrors {
  title?: string;
  amount?: string;
  category?: string;
  date?: string;
  paymentMethod?: string;
}

const AddTransactionScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RouteProps<'AddTransaction'>>();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  // Get transaction to edit from route params
  const transactionToEdit = route.params?.transactionToEdit;
  const isEditMode = !!transactionToEdit;

  // Fetch categories
  const { 
    data: categories, 
    error: categoriesError, 
    isLoading: categoriesLoading
  } = useFetch<Category[]>(
    () => categoryService.getCategories(),
    { cacheKey: 'categories' }
  );

  // Form state
  const [title, setTitle] = useState(transactionToEdit?.title || '');
  const [amount, setAmount] = useState(
    transactionToEdit?.amount 
      ? Math.abs(transactionToEdit.amount).toString()
      : ''
  );
  const [type, setType] = useState(transactionToEdit?.type || 'expense');
  const [category, setCategory] = useState(transactionToEdit?.category || '');
  const [date, setDate] = useState(
    transactionToEdit?.date 
      ? new Date(transactionToEdit.date) 
      : new Date()
  );
  const [paymentMethod, setPaymentMethod] = useState(transactionToEdit?.paymentMethod || '');
  const [notes, setNotes] = useState(transactionToEdit?.notes || '');
  
  // Form validation
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({
    title: false,
    amount: false,
    category: false
  });
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Setup mutations
  const { 
    mutate: saveNewTransaction, 
    isLoading: isCreating, 
    error: createError 
  } = useMutation<string, Partial<Transaction>>(
    (data) => transactionService.addTransaction(data)
  );

  const { 
    mutate: updateExistingTransaction, 
    isLoading: isUpdating, 
    error: updateError 
  } = useMutation<void, { id: string, data: Partial<Transaction> }>(
    ({ id, data }) => transactionService.updateTransaction(id, data)
  );

  // Determine if form is being submitted
  const isSubmitting = isCreating || isUpdating;

  // Validate form fields on change
  useEffect(() => {
    const newErrors: FormErrors = {};
    
    if (touched.title && !title.trim()) {
      newErrors.title = "Title is required";
    }
    
    if (touched.amount) {
      if (!amount) {
        newErrors.amount = "Amount is required";
      } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        newErrors.amount = "Please enter a valid amount";
      }
    }
    
    if (touched.category && !category) {
      newErrors.category = "Please select a category";
    }
    
    setErrors(newErrors);
  }, [title, amount, category, touched]);

  // Handle field blur to mark field as touched
  const handleBlur = (field: string) => {
    setTouched({
      ...touched,
      [field]: true
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Validate all fields before submission
  const validateForm = () => {
    const newErrors: FormErrors = {};
    let isValid = true;
    
    // Mark all fields as touched
    setTouched({
      title: true,
      amount: true,
      category: true
    });
    
    // Title validation
    if (!title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    }
    
    // Amount validation
    if (!amount) {
      newErrors.amount = "Amount is required";
      isValid = false;
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
      isValid = false;
    }
    
    // Category validation
    if (!category) {
      newErrors.category = "Please select a category";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const saveTransaction = async () => {
    if (!validateForm()) {
      toast.show({
        title: "Form Validation",
        description: "Please correct the errors in the form",
        status: "warning"
      } as IToastProps);
      return;
    }

    try {
      const parsedAmount = parseFloat(amount);
      const finalAmount = type === 'expense' ? -parsedAmount : parsedAmount;
      
      const transactionData: Partial<Transaction> = {
        title,
        amount: finalAmount,
        type,
        category,
        date: date.toISOString(),
        paymentMethod: paymentMethod || undefined,
        notes: notes || undefined
      };
      
      if (isEditMode && transactionToEdit) {
        await updateExistingTransaction({
          id: transactionToEdit.id,
          data: transactionData
        });
        
        toast.show({
          title: "Success",
          description: "Transaction updated successfully",
          status: "success"
        } as IToastProps);
      } else {
        await saveNewTransaction(transactionData);
        
        toast.show({
          title: "Success",
          description: "Transaction added successfully",
          status: "success"
        } as IToastProps);
      }
      
      navigation.goBack();
    } catch (error: any) {
      toast.show({
        title: "Error",
        description: error.message || "Failed to save transaction",
        status: "error"
      } as IToastProps);
    }
  };

  // Get appropriate categories based on transaction type
  const getCategories = () => {
    if (!categories || categories.length === 0) {
      return type === 'income' ? defaultIncomeCategories : defaultExpenseCategories;
    }
    
    return categories.filter(cat => {
      // If your categories have a type field, you can filter by it
      // Otherwise, show all categories regardless of transaction type
      return true;
    });
  };

  const currentCategories = getCategories();
  
  // Show loading state if categories are being fetched
  if (categoriesLoading && !categories) {
    return <LoadingState message="Loading categories..." />;
  }
  
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
          <FormControl isInvalid={!!errors.amount} isRequired>
            <FormControl.Label>Amount</FormControl.Label>
            <Input
              value={amount}
              onChangeText={setAmount}
              onBlur={() => handleBlur('amount')}
              keyboardType="decimal-pad"
              fontSize="xl"
              placeholder="0.00"
              InputLeftElement={
                <Text fontSize="xl" ml={3} color={colorMode === 'dark' ? 'text.dark' : 'text.light'}>₹</Text>
              }
            />
            <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
              {errors.amount}
            </FormControl.ErrorMessage>
          </FormControl>
          
          {/* Title Input */}
          <FormControl isInvalid={!!errors.title} isRequired>
            <FormControl.Label>Title</FormControl.Label>
            <Input
              value={title}
              onChangeText={setTitle}
              onBlur={() => handleBlur('title')}
              placeholder="Enter transaction title"
            />
            <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
              {errors.title}
            </FormControl.ErrorMessage>
          </FormControl>
          
          {/* Category Selector */}
          <FormControl isInvalid={!!errors.category} isRequired>
            <FormControl.Label>Category</FormControl.Label>
            <Pressable
              onPress={() => setShowCategoryModal(true)}
              borderWidth={1}
              borderColor={errors.category ? 'red.500' : (colorMode === 'dark' ? 'border.dark' : 'border.light')}
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
            <FormControl.ErrorMessage leftIcon={<WarningOutlineIcon size="xs" />}>
              {errors.category}
            </FormControl.ErrorMessage>
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
            isDisabled={isSubmitting}
            mt={4}
          >
            {isEditMode ? 'Update Transaction' : 'Save Transaction'}
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
                      setTouched({ ...touched, category: true });
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
