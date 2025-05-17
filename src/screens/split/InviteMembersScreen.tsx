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
  Button,
  useColorMode,
  FlatList,
  Checkbox,
  IconButton,
  useToast,
  Divider,
  Spinner,
  Center
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Contacts from 'expo-contacts';
import { Share } from 'react-native';

// Mock data for friends and group members
const initialFriends = [
  { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', inApp: true },
  { id: '2', name: 'Priya Patel', phone: '+91 87654 32109', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', inApp: true },
  { id: '3', name: 'Amit Kumar', phone: '+91 76543 21098', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', inApp: true },
  { id: '4', name: 'Neha Singh', phone: '+91 65432 10987', avatar: 'https://randomuser.me/api/portraits/women/17.jpg', inApp: true },
  { id: '5', name: 'Raj Malhotra', phone: '+91 54321 09876', avatar: 'https://randomuser.me/api/portraits/men/53.jpg', inApp: true },
];

const InviteMembersScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorMode } = useColorMode();
  const toast = useToast();

  const { groupId, groupName } = route.params || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [appFriends, setAppFriends] = useState(initialFriends);
  const [phoneContacts, setPhoneContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Fetch contacts from phone
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { data } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
          sort: Contacts.SortTypes.FirstName
        });
        
        if (data.length > 0) {
          // Format and filter contacts (exclude those who are already in the app)
          const formattedContacts = data
            .filter(contact => contact.name && contact.phoneNumbers?.length > 0)
            .map(contact => {
              const phone = contact.phoneNumbers[0]?.number || '';
              // Check if contact is already in the app
              const existingFriend = initialFriends.find(
                friend => friend.phone.replace(/\s/g, '') === phone.replace(/\s/g, '')
              );
              
              return {
                id: contact.id,
                name: contact.name,
                phone,
                inApp: !!existingFriend,
                avatar: contact.imageAvailable ? contact.image.uri : null
              };
            })
            // Sort: first show those who are in the app
            .sort((a, b) => (b.inApp ? 1 : 0) - (a.inApp ? 1 : 0));
          
          setPhoneContacts(formattedContacts);
        }
      } else {
        toast.show({
          title: "Permission Denied",
          description: "Cannot access contacts without permission",
          status: "warning"
        });
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast.show({
        title: "Error",
        description: "Failed to load contacts",
        status: "error"
      });
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleToggleSelect = (contact) => {
    if (selectedContacts.some(c => c.id === contact.id)) {
      setSelectedContacts(selectedContacts.filter(c => c.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const handleInvite = async () => {
    if (selectedContacts.length === 0) {
      toast.show({
        title: "No Contacts Selected",
        description: "Please select at least one contact to invite",
        status: "warning"
      });
      return;
    }

    setIsInviting(true);

    try {
      // For app friends, add them directly to the group
      const appUsers = selectedContacts.filter(contact => contact.inApp);
      // For non-app users, send SMS invites
      const nonAppUsers = selectedContacts.filter(contact => !contact.inApp);

      if (nonAppUsers.length > 0) {
        const message = `Join me on FinMate to split expenses! I've added you to the "${groupName}" group. Download the app: https://finmate.app/download`;
        await Share.share({
          message,
          title: "Invite to FinMate"
        });
      }

      // Simulate API call to add users to group
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.show({
        title: "Invites Sent",
        description: `${selectedContacts.length} ${selectedContacts.length === 1 ? 'person' : 'people'} invited to the group`,
        status: "success"
      });

      navigation.navigate('GroupDetail', { groupId, groupName });
    } catch (error) {
      console.error("Error sending invites:", error);
      toast.show({
        title: "Error",
        description: "Failed to send invites",
        status: "error"
      });
    } finally {
      setIsInviting(false);
    }
  };

  // Filter contacts based on search
  const filteredContacts = phoneContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery)
  );

  // Filter app friends based on search
  const filteredFriends = appFriends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.phone.includes(searchQuery)
  );

  return (
    <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      <VStack space={4}>
        <Heading size="lg">Invite to {groupName}</Heading>
        
        <Input
          placeholder="Search contacts"
          value={searchQuery}
          onChangeText={setSearchQuery}
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
        
        {loadingContacts ? (
          <Center flex={1}>
            <Spinner size="lg" />
            <Text mt={2}>Loading contacts...</Text>
          </Center>
        ) : (
          <FlatList
            data={searchQuery ? [...filteredFriends, ...filteredContacts] : [...appFriends, ...phoneContacts]}
            keyExtractor={item => item.id}
            renderItem={({ item: contact }) => (
              <HStack
                p={3}
                bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                borderRadius="md"
                mb={2}
                justifyContent="space-between"
                alignItems="center"
              >
                <HStack space={3} alignItems="center" flex={1}>
                  <Avatar
                    source={contact.avatar ? { uri: contact.avatar } : null}
                    bg={!contact.avatar ? 'primary.500' : undefined}
                  >
                    {contact.name.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <VStack>
                    <Text fontWeight="medium">{contact.name}</Text>
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                      {contact.phone}
                    </Text>
                  </VStack>
                </HStack>

                <HStack space={2} alignItems="center">
                  {contact.inApp && (
                    <Badge colorScheme="green" variant="subtle" px={2} py={0.5} borderRadius="full">
                      <Text fontSize="2xs">In App</Text>
                    </Badge>
                  )}
                  
                  <Checkbox
                    isChecked={selectedContacts.some(c => c.id === contact.id)}
                    onChange={() => handleToggleSelect(contact)}
                    value={contact.id}
                    accessibilityLabel={`Select ${contact.name}`}
                  />
                </HStack>
              </HStack>
            )}
            ListEmptyComponent={
              <Box p={10} alignItems="center">
                <Icon as={Ionicons} name="people" size="6xl" color="gray.300" mb={4} />
                <Text color="gray.500" textAlign="center">
                  {searchQuery ? "No contacts match your search" : "No contacts found"}
                </Text>
              </Box>
            }
          />
        )}
        
        {/* Bottom Action Bar */}
        <HStack 
          position="absolute" 
          bottom={5} 
          left={5} 
          right={5} 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
          p={4} 
          borderRadius="lg"
          justifyContent="space-between"
          alignItems="center"
          shadow={3}
        >
          <Text>
            {selectedContacts.length} {selectedContacts.length === 1 ? 'contact' : 'contacts'} selected
          </Text>
          
          <Button
            onPress={handleInvite}
            isDisabled={selectedContacts.length === 0}
            isLoading={isInviting}
            leftIcon={<Icon as={Ionicons} name="paper-plane-outline" size="sm" />}
          >
            Send Invites
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};

// Helper component for Badge
const Badge = ({ children, ...props }) => {
  return (
    <Box {...props}>
      {children}
    </Box>
  );
};

export default InviteMembersScreen;
