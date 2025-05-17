import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Input,
  Avatar,
  FlatList,
  Pressable,
  Button,
  useColorMode,
  IconButton,
  Menu,
  Modal,
  FormControl,
  useToast,
  Divider
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Contacts from 'expo-contacts';

// Mock friends data
const initialFriends = [
  { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', balance: 450 },
  { id: '2', name: 'Priya Patel', phone: '+91 87654 32109', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', balance: -250 },
  { id: '3', name: 'Amit Kumar', phone: '+91 76543 21098', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', balance: 800 },
  { id: '4', name: 'Neha Singh', phone: '+91 65432 10987', avatar: 'https://randomuser.me/api/portraits/women/17.jpg', balance: -120 },
  { id: '5', name: 'Raj Malhotra', phone: '+91 54321 09876', avatar: 'https://randomuser.me/api/portraits/men/53.jpg', balance: 0 },
];

const FriendsScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState(initialFriends);
  const [phoneContacts, setPhoneContacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  useEffect(() => {
    requestContactsPermission();
  }, []);
  
  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === 'granted') {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
        sort: Contacts.SortTypes.FirstName
      });
      
      if (data.length > 0) {
        // Format contacts data
        const formattedContacts = data.map(contact => ({
          id: contact.id,
          name: contact.name,
          phone: contact.phoneNumbers?.[0]?.number || '',
          email: contact.emails?.[0]?.email || '',
          isContact: true
        }));
        
        setPhoneContacts(formattedContacts);
      }
    }
  };
  
  const handleAddFriend = () => {
    if (!formData.name) {
      toast.show({
        title: "Error",
        description: "Please enter a name",
        status: "error"
      });
      return;
    }
    
    if (!formData.phone && !formData.email) {
      toast.show({
        title: "Error",
        description: "Please enter a phone number or email",
        status: "error"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newFriend = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`,
        balance: 0
      };
      
      setFriends([...friends, newFriend]);
      setFormData({ name: '', phone: '', email: '' });
      setShowAddModal(false);
      setIsLoading(false);
      
      toast.show({
        title: "Friend Added",
        description: `${formData.name} has been added to your friends`,
        status: "success"
      });
    }, 1000);
  };
  
  const handleRemoveFriend = (id) => {
    setFriends(friends.filter(friend => friend.id !== id));
    
    toast.show({
      title: "Friend Removed",
      description: "Friend has been removed from your list",
      status: "info"
    });
  };
  
  const handleSettleUp = (friend) => {
    navigation.navigate('PaymentMethods', {
      amount: Math.abs(friend.balance),
      friendName: friend.name,
      isReceiving: friend.balance < 0
    });
  };
  
  const handleAddContactAsFriend = (contact) => {
    const newFriend = {
      id: Date.now().toString(),
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      avatar: `https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 99)}.jpg`,
      balance: 0
    };
    
    setFriends([...friends, newFriend]);
    
    toast.show({
      title: "Friend Added",
      description: `${contact.name} has been added to your friends`,
      status: "success"
    });
  };
  
  // Filter friends based on search query
  const filteredFriends = friends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.phone && friend.phone.includes(searchQuery))
  );
  
  // Filter contacts that are not already friends
  const filteredContacts = phoneContacts.filter(contact => {
    const isAlreadyFriend = friends.some(friend => 
      (friend.phone && contact.phone && friend.phone.replace(/\s+/g, '') === contact.phone.replace(/\s+/g, '')) || 
      (friend.email && contact.email && friend.email.toLowerCase() === contact.email.toLowerCase())
    );
    
    return !isAlreadyFriend && (
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.phone && contact.phone.includes(searchQuery))
    );
  });
  
  // Further filter based on selected filter
  const displayedFriends = filteredFriends.filter(friend => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'owe_you') return friend.balance > 0;
    if (selectedFilter === 'you_owe') return friend.balance < 0;
    if (selectedFilter === 'settled') return friend.balance === 0;
    return true;
  });

  return (
    <Box flex={1} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'} p={5}>
      <HStack justifyContent="space-between" alignItems="center" mb={5}>
        <Heading size="lg">Friends</Heading>
        <Button 
          leftIcon={<Icon as={Ionicons} name="add" size="sm" />}
          onPress={() => setShowAddModal(true)}
        >
          Add Friend
        </Button>
      </HStack>
      
      {/* Search */}
      <Input
        placeholder="Search friends"
        value={searchQuery}
        onChangeText={setSearchQuery}
        mb={4}
        InputLeftElement={
          <Icon as={Ionicons} name="search" size={5} ml={2} color="muted.400" />
        }
        InputRightElement={
          searchQuery ? (
            <IconButton
              icon={<Icon as={Ionicons} name="close-circle" />}
              onPress={() => setSearchQuery('')}
              _icon={{ color: "muted.400" }}
              variant="unstyled"
              mr={1}
            />
          ) : null
        }
      />
      
      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} mb={4}>
        <HStack space={2}>
          {[
            { id: 'all', name: 'All' },
            { id: 'owe_you', name: 'Owe You' },
            { id: 'you_owe', name: 'You Owe' },
            { id: 'settled', name: 'Settled' },
          ].map(filter => (
            <Pressable
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              bg={selectedFilter === filter.id ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
              px={4}
              py={2}
              borderRadius="full"
            >
              <Text
                color={selectedFilter === filter.id ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
              >
                {filter.name}
              </Text>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
      
      {/* Friends List */}
      <Box>
        <Heading size="sm" mb={3}>Your Friends ({displayedFriends.length})</Heading>
        
        {displayedFriends.length > 0 ? (
          <FlatList
            data={displayedFriends}
            renderItem={({ item: friend }) => (
              <Box 
                bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                p={4} 
                borderRadius="lg"
                mb={3}
                shadow={1}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center" flex={1}>
                    <Avatar 
                      size="md"
                      source={{ uri: friend.avatar }}
                    >
                      {friend.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <VStack flex={1}>
                      <Text fontWeight="medium">{friend.name}</Text>
                      {friend.phone && (
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                          {friend.phone}
                        </Text>
                      )}
                      {friend.balance !== 0 && (
                        <Text 
                          fontSize="sm" 
                          color={friend.balance > 0 ? 'green.500' : 'red.500'}
                        >
                          {friend.balance > 0 ? 
                            `Owes you ₹${friend.balance}` : 
                            `You owe ₹${Math.abs(friend.balance)}`}
                        </Text>
                      )}
                      {friend.balance === 0 && (
                        <Text fontSize="sm" color="green.500">
                          All settled up
                        </Text>
                      )}
                    </VStack>
                  </HStack>
                  
                  <HStack space={2}>
                    {friend.balance !== 0 && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onPress={() => handleSettleUp(friend)}
                      >
                        Settle
                      </Button>
                    )}
                    
                    <Menu trigger={triggerProps => {
                      return (
                        <IconButton
                          {...triggerProps}
                          icon={<Icon as={Ionicons} name="ellipsis-vertical" />}
                          variant="ghost"
                        />
                      );
                    }}>
                      <Menu.Item onPress={() => navigation.navigate('AddExpense', { friend })}>
                        <HStack space={2} alignItems="center">
                          <Icon as={Ionicons} name="add-circle-outline" size="xs" />
                          <Text>Add Expense</Text>
                        </HStack>
                      </Menu.Item>
                      <Menu.Item onPress={() => handleRemoveFriend(friend.id)}>
                        <HStack space={2} alignItems="center">
                          <Icon as={Ionicons} name="trash-outline" size="xs" color="red.500" />
                          <Text color="red.500">Remove</Text>
                        </HStack>
                      </Menu.Item>
                    </Menu>
                  </HStack>
                </HStack>
              </Box>
            )}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <Box p={5} alignItems="center">
                <Icon as={Ionicons} name="people" size="6xl" color="gray.300" />
                <Text mt={2} color="gray.500" textAlign="center">
                  No friends found with the current filter
                </Text>
              </Box>
            }
          />
        ) : (
          <Box 
            p={6} 
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
            borderRadius="lg" 
            alignItems="center"
          >
            <Icon as={Ionicons} name="people" size="6xl" color="gray.300" mb={4} />
            <Heading size="sm" textAlign="center" mb={2}>No Friends Yet</Heading>
            <Text color="gray.500" textAlign="center" mb={6}>
              Add friends to split expenses and track who owes what
            </Text>
            <Button 
              leftIcon={<Icon as={Ionicons} name="add-circle" size="sm" />}
              onPress={() => setShowAddModal(true)}
            >
              Add Your First Friend
            </Button>
          </Box>
        )}
        
        {/* Show contacts suggestions if search is active */}
        {searchQuery && filteredContacts.length > 0 && (
          <Box mt={4}>
            <HStack alignItems="center" space={2} mb={3}>
              <Icon as={Ionicons} name="people-circle" color="primary.500" />
              <Text fontWeight="medium">Contacts</Text>
            </HStack>
            
            <VStack space={2} maxH={200}>
              {filteredContacts.slice(0, 5).map(contact => (
                <Pressable
                  key={contact.id}
                  onPress={() => handleAddContactAsFriend(contact)}
                >
                  <HStack 
                    space={3} 
                    alignItems="center" 
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                    p={3}
                    borderRadius="md"
                  >
                    <Box 
                      p={2}
                      borderRadius="full"
                      bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                    >
                      <Icon as={Ionicons} name="person" color="primary.500" />
                    </Box>
                    <VStack flex={1}>
                      <Text>{contact.name}</Text>
                      <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                        {contact.phone || contact.email}
                      </Text>
                    </VStack>
                    <Button size="xs" leftIcon={<Icon as={Ionicons} name="add" size="xs" />}>
                      Add
                    </Button>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </Box>
        )}
      </Box>
      
      {/* Add Friend Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Add Friend</Modal.Header>
          <Modal.Body>
            <VStack space={4}>
              <FormControl isRequired>
                <FormControl.Label>Name</FormControl.Label>
                <Input 
                  placeholder="Enter friend's name"
                  value={formData.name}
                  onChangeText={(value) => setFormData({ ...formData, name: value })}
                />
              </FormControl>
              
              <FormControl>
                <FormControl.Label>Phone Number</FormControl.Label>
                <Input 
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  value={formData.phone}
                  onChangeText={(value) => setFormData({ ...formData, phone: value })}
                />
              </FormControl>
              
              <FormControl>
                <FormControl.Label>Email (Optional)</FormControl.Label>
                <Input 
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  value={formData.email}
                  onChangeText={(value) => setFormData({ ...formData, email: value })}
                />
              </FormControl>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button isLoading={isLoading} onPress={handleAddFriend}>
                Add
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </Box>
  );
};

const ScrollView = ({ children, ...props }) => {
  return (
    <Box {...props}>
      <Box flexDirection="row">{children}</Box>
    </Box>
  );
};

export default FriendsScreen;
