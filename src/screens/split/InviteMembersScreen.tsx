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
  Center,
  Badge
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Contacts from 'expo-contacts';
import { Share } from 'react-native';
import { splitExpenseService } from '../../services/firestoreService';
import { useFetch } from '../../hooks/useData';
import LoadingState from '../../components/LoadingState';

const InviteMembersScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorMode } = useColorMode();
  const toast = useToast();

  const { groupId, groupName } = route.params || {};
  const [searchQuery, setSearchQuery] = useState('');

  const [phoneContacts, setPhoneContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Fetch friends from Firestore
  const { 
    data: appFriends = [], 
    isLoading: friendsLoading,
    error: friendsError
  } = useFetch(() => splitExpenseService.getFriends(), {
    cacheKey: 'user-friends'
  });

  // Fetch group details to get current members
  const { 
    data: groupDetails, 
    isLoading: groupLoading
  } = useFetch(
    groupId ? () => splitExpenseService.getGroupDetails(groupId) : null,
    {
      cacheKey: `group-${groupId}`,
      enabled: !!groupId
    }
  );


  // Filter out friends who are already in the group
  const availableFriends = appFriends.filter(friend => {
    if (!groupDetails?.members) return true;
    return !groupDetails.members.includes(friend.id);
  });

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
          // Format and filter contacts
          const formattedContacts = data
            .filter(contact => contact.name && contact.phoneNumbers?.length > 0)
            .map(contact => {
              const phone = contact.phoneNumbers[0]?.number || '';
              // Check if contact is already a friend
              const existingFriend = appFriends.find(
                friend => friend.phone && friend.phone.replace(/\s/g, '') === phone.replace(/\s/g, '')
              );
              
              return {
                id: contact.id,
                name: contact.name,
                phone,
                inApp: !!existingFriend,
                friendId: existingFriend?.id,
                avatar: contact.imageAvailable ? contact.image.uri : null
              };
            })
            // Filter out contacts who are already in the group
            .filter(contact => {
              if (!contact.inApp || !groupDetails?.members) return true;
              return !groupDetails.members.includes(contact.friendId);
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
      // Separate app users from non-app users
      const appUsers = selectedContacts.filter(contact => contact.inApp);
      const nonAppUsers = selectedContacts.filter(contact => !contact.inApp);

      // Add app users directly to the group
      if (appUsers.length > 0) {
        const userIds = appUsers.map(u => u.friendId || u.id);
        await splitExpenseService.addMembersToGroup(groupId, userIds);
      }

      // Send invites to non-app users
      if (nonAppUsers.length > 0) {
        // Store pending invites
        await splitExpenseService.sendGroupInvites(groupId, nonAppUsers);
        
        // Share invite message
        const message = `Join me on FinMate to split expenses! I've added you to the "${groupName}" group. Download the app: https://finmate.app/download`;
        await Share.share({
          message,
          title: "Invite to FinMate"
        });
      }

      toast.show({
        title: "Success",
        description: `${selectedContacts.length} ${selectedContacts.length === 1 ? 'person' : 'people'} invited to the group`,
        status: "success"
      });

      navigation.goBack();
    } catch (error) {
      console.error("Error sending invites:", error);
      toast.show({
        title: "Error",
        description: error.message || "Failed to send invites",
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
  const filteredFriends = availableFriends.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.email && friend.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Combine and sort all contacts
  const allContacts = [
    ...filteredFriends.map(f => ({ ...f, inApp: true, friendId: f.id })),
    ...filteredContacts
  ].sort((a, b) => {
    // First sort by inApp status
    if (a.inApp !== b.inApp) return b.inApp ? 1 : -1;
    // Then sort by name
    return a.name.localeCompare(b.name);
  });

  if (friendsLoading || groupLoading) {
    return <LoadingState />;
  }

  return (
    <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      <VStack space={4} flex={1}>
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
            data={allContacts}
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
                  
                  <VStack flex={1}>
                    <Text fontWeight="medium">{contact.name}</Text>
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                      {contact.email || contact.phone}
                    </Text>
                  </VStack>
                </HStack>

                <HStack space={2} alignItems="center">
                  {contact.inApp && (
                    <Badge colorScheme="green" variant="subtle">
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
                  {searchQuery ? "No contacts match your search" : "No contacts available to invite"}
                </Text>
              </Box>
            }
            contentContainerStyle={{ paddingBottom: 100 }}
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

export default InviteMembersScreen;