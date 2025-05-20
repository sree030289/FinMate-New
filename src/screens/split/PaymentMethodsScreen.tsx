import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Radio,
  Button,
  useColorMode,
  Input,
  Divider,
  Pressable,
  IconButton,
  useToast,
  Modal,
  Spinner,
  Image,
  FormControl as NativeBaseFormControl
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { paymentService, PaymentDetails, PaymentVerification } from '../../services/paymentService';
import { auth } from '../../services/firebase';
import { default as firestoreService } from '../../services/firestoreService';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NavigationProps, RouteProps } from '../../types/navigation';

// Extract splitExpenseService from firestoreService
const { splitExpense: splitExpenseService } = firestoreService;

const paymentMethods = [
  {
    id: 'upi',
    title: 'UPI',
    icon: 'phone-portrait-outline',
    description: 'Direct bank transfer using UPI',
    providers: [
      { id: 'gpay', name: 'Google Pay', icon: 'logo-google' },
      { id: 'phonepe', name: 'PhonePe', icon: 'phone-portrait' },
      { id: 'paytm', name: 'Paytm', icon: 'wallet' }
    ]
  },
  {
    id: 'bank',
    title: 'Bank Transfer',
    icon: 'card-outline',
    description: 'Transfer directly to bank account',
    requiresAccountDetails: true
  },
  {
    id: 'cash',
    title: 'Cash',
    icon: 'cash-outline',
    description: 'Record a cash payment'
  }
];

const PaymentMethodsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RouteProps<'PaymentMethods'>>();
  const { colorMode } = useColorMode();
  const toast = useToast();

  const { amount, friendName, isReceiving = false, groupId, groupName, friendId, expenseId } = route.params || {
    amount: 1250,
    friendName: 'Rahul',
    isReceiving: true,
    groupId: undefined,
    groupName: undefined,
    friendId: undefined,
    expenseId: undefined
  };

  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    ifsc: '',
    accountHolderName: ''
  });
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  
  // New states for payment verification workflow
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'choice' | 'manual' | 'screenshot'>('choice');
  const [transactionId, setTransactionId] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Get current user display name
  const [currentUserName, setCurrentUserName] = useState('');

  useEffect(() => {
    const getUserDetails = async () => {
      if (auth.currentUser?.displayName) {
        setCurrentUserName(auth.currentUser.displayName);
      } else {
        try {
          const userProfile = await firestoreService.user.getCurrentUserProfile();
          if (userProfile?.displayName) {
            setCurrentUserName(userProfile.displayName);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    getUserDetails();
  }, []);

  const handlePayment = async () => {
    // Validate required fields based on selected payment method
    if (selectedMethod === 'upi' && !upiId) {
      toast.show({
        title: "Missing information",
        description: "Please enter UPI ID"
      });
      return;
    }

    if (selectedMethod === 'bank' && (!accountDetails.accountNumber || !accountDetails.ifsc || !accountDetails.accountHolderName)) {
      toast.show({
        title: "Missing information",
        description: "Please fill all bank details"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare payment details
      const paymentDetails: PaymentDetails = {
        amount,
        toUserId: friendId,
        toName: friendName,
        fromName: currentUserName,
        paymentMethod: selectedMethod as 'upi' | 'bank' | 'cash',
        note,
        groupId,
        expenseId,
        isRequest: isReceiving
      };

      // Add method-specific details
      if (selectedMethod === 'upi') {
        paymentDetails.provider = selectedProvider;
        paymentDetails.upiId = upiId;
      } else if (selectedMethod === 'bank') {
        paymentDetails.bankDetails = accountDetails;
      }

      // Process payment based on method
      let result;
      if (selectedMethod === 'upi') {
        result = await paymentService.initiateUpiPayment(paymentDetails);
      } else if (selectedMethod === 'bank') {
        result = await paymentService.initiateBankTransfer(paymentDetails);
      } else if (selectedMethod === 'cash') {
        result = await paymentService.recordCashPayment(paymentDetails);
      }

      if (result?.success) {
        if (isReceiving) {
          // If this is a payment request, show success and go back
          toast.show({
            title: "Payment Requested",
            description: `Payment request of ₹${amount} sent to ${friendName}`
          });
          
          // Navigate back
          navigateBack();
        } else if (selectedMethod === 'cash') {
          // For cash payments, mark as completed and go back
          toast.show({
            title: "Cash Payment Recorded",
            description: `Cash payment of ₹${amount} to ${friendName} recorded`
          });
          
          // Navigate back
          navigateBack();
        } else {
          // For UPI and bank transfers, we need verification
          setCurrentPaymentId(result.paymentId);
          
          // For UPI, show verification modal after a delay to allow payment app to open
          if (selectedMethod === 'upi') {
            // On iOS, UPI apps might not be available, so show information
            if (Platform.OS === 'ios') {
              Alert.alert(
                "Payment Initiated",
                "Please complete the payment in your UPI app and return here to verify it.",
                [{ text: "OK" }]
              );
            }
            
            // Show verification modal after a delay
            setTimeout(() => {
              setShowVerificationModal(true);
            }, 1000);
          } else {
            // For bank transfers, show verification immediately
            setShowVerificationModal(true);
          }
        }
      } else {
        throw new Error("Payment failed to initiate");
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.show({
        title: "Payment Error",
        description: error.message || "Failed to process payment"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const navigateBack = () => {
    if (groupId) {
      navigation.navigate('GroupDetail', {
        groupId,
        groupName: groupName || 'Group'
      });
    } else {
      navigation.navigate('Friends');
    }
  };

  const handleVerification = async (method: 'manual' | 'screenshot') => {
    setVerificationStep(method);
  };

  const submitVerification = async () => {
    if (!currentPaymentId) return;
    
    setIsProcessing(true);
    
    try {
      let receiptUrl = null;
      
      // If there's a receipt image, upload it
      if (receiptImage && verificationStep === 'screenshot') {
        // This would upload the receipt to storage in a real app
        // In a production environment, we would add code to upload to Firebase Storage
        receiptUrl = receiptImage;
      }
      
      await paymentService.verifyPayment(currentPaymentId, {
        paymentId: currentPaymentId,
        referenceId: currentPaymentId,
        status: 'success',
        transactionId: transactionId || undefined,
        timestamp: new Date(),
        receiptUrl,
        verificationMethod: verificationStep === 'screenshot' ? 'screenshot' : 'manual'
      });
      
      // In a real implementation, we would update the expense payment status
      // This would typically be handled by the payment service's verifyPayment method
      // which would update all relevant records in the database
      
      toast.show({
        title: "Payment Verified",
        description: `Payment of ₹${amount} to ${friendName} has been verified`
      });
      
      // Close modal and navigate back
      setShowVerificationModal(false);
      navigateBack();
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.show({
        title: "Verification Error",
        description: error.message || "Failed to verify payment"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets[0]) {
        setReceiptImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      toast.show({
        title: "Error",
        description: "Failed to pick image"
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <VStack space={6}>
          <Heading size="lg">{isReceiving ? 'Request Payment' : 'Send Payment'}</Heading>

          {/* Amount and person */}
          <Box
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={4}
            borderRadius="lg"
            shadow={1}
          >
            <HStack justifyContent="space-between" alignItems="center" mb={2}>
              <Text fontSize="lg">Amount</Text>
              <Text fontSize="xl" fontWeight="bold">₹{amount.toLocaleString()}</Text>
            </HStack>

            <Divider my={3} />

            <HStack justifyContent="space-between" alignItems="center">
              <Text fontSize="lg">{isReceiving ? 'From' : 'To'}</Text>
              <Text fontSize="lg" fontWeight="medium">{friendName}</Text>
            </HStack>
          </Box>

          {/* Payment Methods */}
          <Box>
            <Text fontSize="lg" fontWeight="medium" mb={4}>Payment Method</Text>

            <Radio.Group
              name="paymentMethod"
              value={selectedMethod}
              onChange={method => {
                setSelectedMethod(method);
                setSelectedProvider('');
              }}
            >
              <VStack space={4}>
                {paymentMethods.map(method => (
                  <Pressable
                    key={method.id}
                    onPress={() => setSelectedMethod(method.id)}
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                    p={4}
                    borderRadius="lg"
                    borderWidth={selectedMethod === method.id ? 2 : 0}
                    borderColor="primary.500"
                  >
                    <HStack alignItems="center" justifyContent="space-between">
                      <HStack space={3} alignItems="center">
                        <Icon as={Ionicons} name={method.icon} color="primary.500" size="md" />
                        <VStack>
                          <Text fontWeight="medium">{method.title}</Text>
                          <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                            {method.description}
                          </Text>
                        </VStack>
                      </HStack>
                      <Radio value={method.id} accessibilityLabel={method.title} />
                    </HStack>
                  </Pressable>
                ))}
              </VStack>
            </Radio.Group>
          </Box>

          {/* UPI Providers */}
          {selectedMethod === 'upi' && (
            <Box>
              <Text fontSize="md" fontWeight="medium" mb={3}>Select UPI App</Text>
              <HStack space={4} flexWrap="wrap">
                {paymentMethods.find(m => m.id === 'upi')?.providers.map(provider => (
                  <Pressable
                    key={provider.id}
                    onPress={() => setSelectedProvider(provider.id)}
                    bg={selectedProvider === provider.id 
                      ? 'primary.500' 
                      : colorMode === 'dark' ? 'card.dark' : 'card.light'}
                    p={3}
                    borderRadius="lg"
                    minW="80px"
                    alignItems="center"
                  >
                    <Icon 
                      as={Ionicons} 
                      name={provider.icon} 
                      color={selectedProvider === provider.id ? 'white' : 'primary.500'} 
                      mb={2} 
                    />
                    <Text 
                      fontSize="xs"
                      color={selectedProvider === provider.id 
                        ? 'white' 
                        : colorMode === 'dark' ? 'text.dark' : 'text.light'}
                    >
                      {provider.name}
                    </Text>
                  </Pressable>
                ))}
              </HStack>

              <NativeBaseFormControl mt={4}>
                <NativeBaseFormControl.Label>UPI ID</NativeBaseFormControl.Label>
                <Input
                  placeholder="username@upi"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </NativeBaseFormControl>
            </Box>
          )}

          {/* Bank Transfer Details */}
          {selectedMethod === 'bank' && (
            <VStack space={4}>
              <NativeBaseFormControl>
                <NativeBaseFormControl.Label>Account Number</NativeBaseFormControl.Label>
                <Input
                  placeholder="Enter account number"
                  value={accountDetails.accountNumber}
                  onChangeText={(value) => setAccountDetails({...accountDetails, accountNumber: value})}
                  keyboardType="number-pad"
                />
              </NativeBaseFormControl>

              <NativeBaseFormControl>
                <NativeBaseFormControl.Label>IFSC Code</NativeBaseFormControl.Label>
                <Input
                  placeholder="Enter IFSC code"
                  value={accountDetails.ifsc}
                  onChangeText={(value) => setAccountDetails({...accountDetails, ifsc: value.toUpperCase()})}
                  autoCapitalize="characters"
                />
              </NativeBaseFormControl>

              <NativeBaseFormControl>
                <NativeBaseFormControl.Label>Account Holder Name</NativeBaseFormControl.Label>
                <Input
                  placeholder="Enter name"
                  value={accountDetails.accountHolderName}
                  onChangeText={(value) => setAccountDetails({...accountDetails, accountHolderName: value})}
                />
              </NativeBaseFormControl>
            </VStack>
          )}

          {/* Additional note */}
          <NativeBaseFormControl>
            <NativeBaseFormControl.Label>Note (Optional)</NativeBaseFormControl.Label>
            <Input
              placeholder="Add a note about this payment"
              value={note}
              onChangeText={setNote}
              multiline
              height={20}
              textAlignVertical="top"
            />
          </NativeBaseFormControl>

          {/* Payment Button */}
          <Button
            size="lg"
            onPress={handlePayment}
            isLoading={isProcessing}
            isLoadingText={isReceiving ? "Requesting..." : "Paying..."}
            mt={4}
          >
            {isReceiving ? `Request ₹${amount}` : `Pay ₹${amount}`}
          </Button>
        </VStack>
        
        {/* Payment Verification Modal */}
        <Modal isOpen={showVerificationModal} onClose={() => setShowVerificationModal(false)}>
          <Modal.Content maxWidth="90%">
            <Modal.CloseButton />
            <Modal.Header>Verify Payment</Modal.Header>
            <Modal.Body>
              {verificationStep === 'choice' && (
                <VStack space={4}>
                  <Text>How would you like to verify your payment?</Text>
                  <Button 
                    leftIcon={<Icon as={Ionicons} name="receipt-outline" />}
                    onPress={() => handleVerification('screenshot')}
                  >
                    Upload Payment Screenshot
                  </Button>
                  <Button 
                    variant="outline"
                    leftIcon={<Icon as={Ionicons} name="create-outline" />}
                    onPress={() => handleVerification('manual')}
                  >
                    Enter Transaction ID
                  </Button>
                </VStack>
              )}
              
              {verificationStep === 'manual' && (
                <VStack space={4}>
                  <NativeBaseFormControl>
                    <NativeBaseFormControl.Label>Transaction ID</NativeBaseFormControl.Label>
                    <Input
                      placeholder="Enter the transaction ID"
                      value={transactionId}
                      onChangeText={setTransactionId}
                    />
                  </NativeBaseFormControl>
                </VStack>
              )}
              
              {verificationStep === 'screenshot' && (
                <VStack space={4} alignItems="center">
                  {receiptImage ? (
                    <Box position="relative">
                      <Image 
                        source={{ uri: receiptImage }} 
                        alt="Receipt" 
                        size="2xl"
                        resizeMode="contain"
                      />
                      <IconButton
                        icon={<Icon as={Ionicons} name="close-circle" />}
                        position="absolute"
                        top={0}
                        right={0}
                        onPress={() => setReceiptImage(null)}
                        colorScheme="danger"
                      />
                    </Box>
                  ) : (
                    <Button 
                      leftIcon={<Icon as={Ionicons} name="image-outline" />}
                      onPress={pickImage}
                    >
                      Select Screenshot
                    </Button>
                  )}
                </VStack>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button.Group space={2}>
                {verificationStep !== 'choice' && (
                  <Button variant="ghost" onPress={() => setVerificationStep('choice')}>
                    Back
                  </Button>
                )}
                <Button 
                  isDisabled={
                    (verificationStep === 'manual' && !transactionId) ||
                    (verificationStep === 'screenshot' && !receiptImage) ||
                    verificationStep === 'choice'
                  }
                  isLoading={isProcessing}
                  onPress={submitVerification}
                >
                  Verify Payment
                </Button>
              </Button.Group>
            </Modal.Footer>
          </Modal.Content>
        </Modal>
      </Box>
    </KeyboardAwareScrollView>
  );
};

export default PaymentMethodsScreen;
