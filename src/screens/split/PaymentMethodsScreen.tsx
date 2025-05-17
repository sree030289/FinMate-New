import React, { useState } from 'react';
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
  useToast
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

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
  const navigation = useNavigation();
  const route = useRoute();
  const { colorMode } = useColorMode();
  const toast = useToast();

  const { amount, friendName, isReceiving = false, groupId, groupName } = route.params || {
    amount: 1250,
    friendName: 'Rahul',
    isReceiving: true
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

  const handlePayment = () => {
    // Validate required fields based on selected payment method
    if (selectedMethod === 'upi' && !upiId) {
      toast.show({
        title: "Missing information",
        description: "Please enter UPI ID",
        status: "warning"
      });
      return;
    }

    if (selectedMethod === 'bank' && (!accountDetails.accountNumber || !accountDetails.ifsc || !accountDetails.accountHolderName)) {
      toast.show({
        title: "Missing information",
        description: "Please fill all bank details",
        status: "warning"
      });
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);

      toast.show({
        title: isReceiving ? "Payment Requested" : "Payment Sent",
        description: isReceiving 
          ? `Payment request of ₹${amount} sent to ${friendName}`
          : `Payment of ₹${amount} sent to ${friendName}`,
        status: "success"
      });

      // Navigate back or to a confirmation screen
      if (groupId) {
        navigation.navigate('GroupDetail', {
          groupId,
          groupName
        });
      } else {
        navigation.navigate('Friends');
      }
    }, 2000);
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

              <FormControl mt={4}>
                <FormControl.Label>UPI ID</FormControl.Label>
                <Input
                  placeholder="username@upi"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </FormControl>
            </Box>
          )}

          {/* Bank Transfer Details */}
          {selectedMethod === 'bank' && (
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>Account Number</FormControl.Label>
                <Input
                  placeholder="Enter account number"
                  value={accountDetails.accountNumber}
                  onChangeText={(value) => setAccountDetails({...accountDetails, accountNumber: value})}
                  keyboardType="number-pad"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>IFSC Code</FormControl.Label>
                <Input
                  placeholder="Enter IFSC code"
                  value={accountDetails.ifsc}
                  onChangeText={(value) => setAccountDetails({...accountDetails, ifsc: value.toUpperCase()})}
                  autoCapitalize="characters"
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Account Holder Name</FormControl.Label>
                <Input
                  placeholder="Enter name"
                  value={accountDetails.accountHolderName}
                  onChangeText={(value) => setAccountDetails({...accountDetails, accountHolderName: value})}
                />
              </FormControl>
            </VStack>
          )}

          {/* Additional note */}
          <FormControl>
            <FormControl.Label>Note (Optional)</FormControl.Label>
            <Input
              placeholder="Add a note about this payment"
              value={note}
              onChangeText={setNote}
              multiline
              height={20}
              textAlignVertical="top"
            />
          </FormControl>

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
      </Box>
    </KeyboardAwareScrollView>
  );
};

// Helper component for FormControl
const FormControl = ({ children, ...props }) => {
  return (
    <Box {...props}>
      {children}
    </Box>
  );
};

// Helper components for FormControl subcomponents
FormControl.Label = ({ children, ...props }) => {
  return (
    <Text fontSize="sm" fontWeight="medium" mb={1} {...props}>{children}</Text>
  );
};

export default PaymentMethodsScreen;
