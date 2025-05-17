import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Button,
  Icon,
  useColorMode,
  Pressable,
  Avatar,
  Badge,
  Switch,
  Divider,
  useToast,
  Modal,
  ScrollView
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

// Mock data for connected accounts
const initialAccounts = [
  {
    id: '1',
    name: 'HDFC Bank',
    type: 'bank',
    icon: 'card',
    connected: true,
    lastSync: '2 hours ago',
    balance: '₹24,500.75',
    accountNumber: 'XXXX1234'
  },
  {
    id: '2',
    name: 'SBI Credit Card',
    type: 'card',
    icon: 'card',
    connected: true,
    lastSync: '1 day ago',
    balance: '₹-15,340.50',
    accountNumber: 'XXXX5678'
  },
  {
    id: '3',
    name: 'UPI Account',
    type: 'upi',
    icon: 'phone-portrait',
    connected: true,
    lastSync: '3 hours ago',
    balance: '₹840.25',
    accountNumber: 'user@okicici'
  }
];

// Available banks/services to connect
const availableServices = [
  { id: 'hdfc', name: 'HDFC Bank', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg', type: 'bank' },
  { id: 'sbi', name: 'State Bank of India', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg', type: 'bank' },
  { id: 'icici', name: 'ICICI Bank', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/ICICI_Bank_Logo.svg', type: 'bank' },
  { id: 'axis', name: 'Axis Bank', icon: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Axis_Bank_logo.svg', type: 'bank' },
  { id: 'gpay', name: 'Google Pay', icon: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg', type: 'upi' },
  { id: 'phonepe', name: 'PhonePe', icon: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/PhonePe_Logo.svg', type: 'upi' }
];

const ConnectedAccountsScreen = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();

  const [accounts, setAccounts] = useState(initialAccounts);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const handleToggleConnection = (id, value) => {
    setAccounts(accounts.map(account => 
      account.id === id ? { ...account, connected: value } : account
    ));

    toast.show({
      title: value ? "Account Connected" : "Account Disconnected",
      status: value ? "success" : "info"
    });
  };

  const handleAddAccount = (service) => {
    setIsLoading(true);

    // Simulate connection process
    setTimeout(() => {
      setIsLoading(false);
      setShowModal(false);
      
      toast.show({
        title: "Account Connected",
        description: `Successfully connected to ${service.name}`,
        status: "success"
      });
      
      // Add new account to the list
      const newAccount = {
        id: Date.now().toString(),
        name: service.name,
        type: service.type,
        icon: service.type === 'bank' ? 'card' : 'phone-portrait',
        connected: true,
        lastSync: 'Just now',
        balance: '₹0.00',
        accountNumber: 'XXXX' + Math.floor(1000 + Math.random() * 9000)
      };
      
      setAccounts([...accounts, newAccount]);
    }, 2000);
  };

  const refreshAccounts = () => {
    setIsLoading(true);
    
    // Simulate refresh
    setTimeout(() => {
      setIsLoading(false);
      
      toast.show({
        title: "Accounts Refreshed",
        description: "All account information has been updated",
        status: "success"
      });
    }, 2000);
  };

  const filteredAccounts = accounts.filter(account => {
    if (activeTab === 'all') return true;
    return account.type === activeTab;
  });

  const disconnectAccount = (account) => {
    setAccounts(accounts.map(acc => 
      acc.id === account.id ? { ...acc, connected: false } : acc
    ));
    
    toast.show({
      title: "Account Disconnected",
      description: `${account.name} has been disconnected`,
      status: "info"
    });
  };

  return (
    <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      <VStack space={5}>
        <HStack justifyContent="space-between" alignItems="center">
          <Heading size="lg">Connected Accounts</Heading>
          <Button
            leftIcon={<Icon as={Ionicons} name="add-circle-outline" size="sm" />}
            onPress={() => setShowModal(true)}
            size="sm"
          >
            Add
          </Button>
        </HStack>
        
        <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
          Connect your bank accounts and payment methods to automatically track your transactions
        </Text>

        {/* Filter tabs */}
        <HStack space={2}>
          <Pressable 
            onPress={() => setActiveTab('all')} 
            px={4} 
            py={2} 
            bg={activeTab === 'all' ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
            borderRadius="full"
          >
            <Text color={activeTab === 'all' ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}>
              All
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('bank')} 
            px={4} 
            py={2} 
            bg={activeTab === 'bank' ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
            borderRadius="full"
          >
            <Text color={activeTab === 'bank' ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}>
              Banks
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('card')} 
            px={4} 
            py={2} 
            bg={activeTab === 'card' ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
            borderRadius="full"
          >
            <Text color={activeTab === 'card' ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}>
              Cards
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => setActiveTab('upi')} 
            px={4} 
            py={2} 
            bg={activeTab === 'upi' ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
            borderRadius="full"
          >
            <Text color={activeTab === 'upi' ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}>
              UPI
            </Text>
          </Pressable>
        </HStack>

        {/* Account list */}
        <VStack space={4}>
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map(account => (
              <Box 
                key={account.id} 
                bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                p={4} 
                borderRadius="lg"
                shadow={1}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Box 
                      p={2} 
                      borderRadius="full"
                      bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                    >
                      <Icon as={Ionicons} name={account.icon} size="md" color="primary.500" />
                    </Box>
                    <VStack>
                      <Text fontWeight="medium">{account.name}</Text>
                      <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                        {account.accountNumber}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Switch
                    isChecked={account.connected}
                    onToggle={(value) => handleToggleConnection(account.id, value)}
                    colorScheme="primary"
                  />
                </HStack>
                
                {account.connected && (
                  <VStack mt={4} space={2}>
                    <Divider />
                    <HStack justifyContent="space-between" alignItems="center" mt={2}>
                      <HStack space={2} alignItems="center">
                        <Icon as={Ionicons} name="time-outline" size="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} />
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                          Last sync: {account.lastSync}
                        </Text>
                      </HStack>
                      
                      <Text fontWeight="bold" fontSize="md" color={account.balance.includes('-') ? 'red.500' : 'green.500'}>
                        {account.balance}
                      </Text>
                    </HStack>
                    
                    <HStack space={2} mt={2}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        leftIcon={<Icon as={Ionicons} name="refresh-outline" size="xs" />}
                        flex={1}
                        onPress={refreshAccounts}
                        isLoading={isLoading}
                      >
                        Refresh
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant="outline" 
                        colorScheme="red"
                        leftIcon={<Icon as={Ionicons} name="close-outline" size="xs" />}
                        flex={1}
                        onPress={() => disconnectAccount(account)}
                      >
                        Disconnect
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </Box>
            ))
          ) : (
            <Box 
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
              p={6} 
              borderRadius="lg" 
              alignItems="center"
            >
              <Icon as={Ionicons} name="card-outline" size="6xl" color="gray.400" mb={4} />
              <Heading size="sm" textAlign="center" mb={2}>No Accounts Connected</Heading>
              <Text color="gray.500" textAlign="center" mb={6}>
                Connect your bank accounts to track your finances automatically
              </Text>
              <Button 
                leftIcon={<Icon as={Ionicons} name="add-circle" size="sm" />}
                onPress={() => setShowModal(true)}
              >
                Add an Account
              </Button>
            </Box>
          )}
        </VStack>

        {/* Security note */}
        <Box 
          bg={colorMode === 'dark' ? 'rgba(49,130,206,0.1)' : 'rgba(49,130,206,0.05)'} 
          p={4} 
          borderRadius="lg"
          borderWidth={1}
          borderColor="blue.500"
          mt={4}
        >
          <HStack space={3} alignItems="center">
            <Icon as={Ionicons} name="shield-checkmark-outline" color="blue.500" />
            <VStack flex={1}>
              <Text fontWeight="medium" color="blue.500">Security Information</Text>
              <Text fontSize="xs" mt={1}>
                We use bank-level security to protect your data. We never store your bank login credentials on our servers.
              </Text>
            </VStack>
          </HStack>
        </Box>
      </VStack>

      {/* Add Account Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Add Financial Account</Modal.Header>
          <Modal.Body>
            <ScrollView maxH={400} showsVerticalScrollIndicator={false}>
              <VStack space={4}>
                {availableServices.map(service => (
                  <Pressable 
                    key={service.id} 
                    onPress={() => handleAddAccount(service)}
                    _pressed={{ opacity: 0.7 }}
                  >
                    <HStack 
                      space={3} 
                      alignItems="center"
                      bg={colorMode === 'dark' ? 'card.dark' : 'white'} 
                      p={3}
                      borderRadius="md"
                      borderWidth={1}
                      borderColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}
                    >
                      <Avatar 
                        size="sm"
                        source={{
                          uri: service.icon
                        }}
                        bg="white"
                      />
                      <VStack>
                        <Text fontWeight="medium">{service.name}</Text>
                        <Badge colorScheme="blue" variant="subtle" alignSelf="flex-start" mt={1}>
                          <Text fontSize="2xs">{service.type === 'bank' ? 'Bank' : service.type === 'upi' ? 'UPI' : 'Card'}</Text>
                        </Badge>
                      </VStack>
                    </HStack>
                  </Pressable>
                ))}
              </VStack>
            </ScrollView>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowModal(false)}>
                Cancel
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

export default ConnectedAccountsScreen;
