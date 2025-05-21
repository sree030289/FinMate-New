import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  FormControl,
  useColorMode,
  Avatar,
  Checkbox,
  Radio,
  IconButton,
  useToast,
  Pressable,
  ScrollView,
  Modal,
  Divider,
  Image
} from 'native-base';
import SafeInput from '../../components/SafeInput';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// Mock data for categories
const expenseCategories = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant' },
  { id: 'transportation', name: 'Transportation', icon: 'car' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film' },
  { id: 'shopping', name: 'Shopping', icon: 'cart' },
  { id: 'housing', name: 'Housing', icon: 'home' },
  { id: 'travel', name: 'Travel', icon: 'airplane' },
  { id: 'utilities', name: 'Utilities', icon: 'flash' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

// Mock data for friends
const friends = [
  { id: '1', name: 'Rahul Sharma', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: '2', name: 'Priya Patel', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: '3', name: 'Amit Kumar', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
  { id: '4', name: 'Neha Singh', avatar: 'https://randomuser.me/api/portraits/women/17.jpg' },
  { id: '5', name: 'Raj Malhotra', avatar: 'https://randomuser.me/api/portraits/men/53.jpg' },
];

// Mock data for groups
const groups = [
  { id: '1', name: 'Roommates', members: friends.slice(0, 3) },
  { id: '2', name: 'Goa Trip', members: friends.slice(1, 5) },
  { id: '3', name: 'Office Lunch', members: [friends[0], friends[2], friends[4]] },
];

const AddExpenseScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  // Get initial data if provided
  const initialData = route.params?.initialData;
  const initialFriend = route.params?.friend;
  const initialGroupId = route.params?.groupId;
  
  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [date, setDate] = useState(initialData?.date ? new Date(initialData.date) : new Date());
  const [category, setCategory] = useState(initialData?.category || '');
  const [paidBy, setPaidBy] = useState('me'); // 'me' or friend id
  const [splitType, setSplitType] = useState('equal'); // equal, percentage, custom
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [receiptImage, setReceiptImage] = useState(initialData?.receiptUrl || null);
  const [selectedGroup, setSelectedGroup] = useState(initialGroupId || '');
  const [participants, setParticipants] = useState<any[]>([]);
  const [customAmounts, setCustomAmounts] = useState<{[key: string]: string}>({});
  
  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize participants based on route params
  useEffect(() => {
    // Don't run if groups is not yet loaded
    if (!groups || groups.length === 0) return;
    
    let initialParticipants = [];
    
    if (initialFriend) {
      initialParticipants = [initialFriend];
    } else if (initialGroupId) {
      const group = groups.find(g => g.id === initialGroupId);
      if (group) {
        initialParticipants = [...group.members];
      }
    }
    
    setParticipants(initialParticipants);
  }, [initialFriend, initialGroupId, groups]); // Add groups to dependencies

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setReceiptImage(result.assets[0].uri);
    }
  };
  
  const handleAddSplitWithFriends = (selectedFriends) => {
    setParticipants(selectedFriends);
    setShowFriendsModal(false);
    
    // Initialize custom amounts for new participants
    if (splitType === 'custom') {
      const newCustomAmounts = { ...customAmounts };
      selectedFriends.forEach(friend => {
        if (!newCustomAmounts[friend.id]) {
          newCustomAmounts[friend.id] = '';
        }
      });
      setCustomAmounts(newCustomAmounts);
    }
  };
  
  const handleGroupSelect = (groupId) => {
    setSelectedGroup(groupId);
    
    if (groupId) {
      const group = groups.find(g => g.id === groupId);
      if (group) {
        setParticipants(group.members);
        
        // Initialize custom amounts for new participants
        if (splitType === 'custom') {
          const newCustomAmounts = { ...customAmounts };
          group.members.forEach(member => {
            if (!newCustomAmounts[member.id]) {
              newCustomAmounts[member.id] = '';
            }
          });
          setCustomAmounts(newCustomAmounts);
        }
      }
    } else {
      setParticipants([]);
    }
  };
  
  const removeParticipant = (participantId) => {
    setParticipants(participants.filter(p => p.id !== participantId));
    
    // If using custom amounts, remove this participant's amount
    if (splitType === 'custom') {
      const newCustomAmounts = { ...customAmounts };
      delete newCustomAmounts[participantId];
      setCustomAmounts(newCustomAmounts);
    }
  };
  
  const calculateSplitAmounts = () => {
    if (!amount || isNaN(parseFloat(amount))) return null;
    
    const totalAmount = parseFloat(amount);
    const numParticipants = participants.length + 1; // +1 for you
    
    if (splitType === 'equal') {
      const perPerson = totalAmount / numParticipants;
      return {
        perPerson,
        total: totalAmount
      };
    } else if (splitType === 'custom') {
      // For custom amounts, we need to calculate the remaining for self
      let totalAssigned = 0;
      
      for (const id in customAmounts) {
        const amountVal = parseFloat(customAmounts[id]);
        if (!isNaN(amountVal)) {
          totalAssigned += amountVal;
        }
      }
      
      return {
        perPerson: 0, // Not applicable
        yourPortion: totalAmount - totalAssigned,
        total: totalAmount
      };
    }
    
    return null;
  };
  
  const saveExpense = () => {
    if (!title.trim()) {
      toast.show({
        title: "Missing information",
        description: "Please enter a title for the expense",
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
    
    if (participants.length === 0) {
      toast.show({
        title: "Missing information",
        description: "Please add at least one person to split with",
        status: "warning"
      });
      return;
    }
    
    if (splitType === 'custom') {
      // Validate custom amounts
      let totalAssigned = 0;
      
      for (const id in customAmounts) {
        const amountVal = parseFloat(customAmounts[id]);
        if (isNaN(amountVal)) {
          toast.show({
            title: "Invalid custom amount",
            description: "Please enter valid amounts for all participants",
            status: "warning"
          });
          return;
        }
        totalAssigned += amountVal;
      }
      
      if (totalAssigned > parseFloat(amount)) {
        toast.show({
          title: "Invalid split",
          description: "The sum of assigned amounts exceeds the total expense",
          status: "warning"
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    // Simulate saving expense
    setTimeout(() => {
      setIsSubmitting(false);
      
      toast.show({
        title: "Success",
        description: "Expense has been added successfully",
        status: "success"
      });
      
      // Navigate back or to the appropriate screen
      if (selectedGroup) {
        navigation.navigate('GroupDetail', { groupId: selectedGroup });
      } else {
        navigation.goBack();
      }
    }, 1000);
  };
  
  // Convert participants to checkable list for the selection modal
  const friendsWithSelection = friends.map(friend => ({
    ...friend,
    isSelected: participants.some(p => p.id === friend.id)
  }));

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <VStack space={5}>
          <Heading size="lg" mb={2}>Add Expense</Heading>
          
          {/* Title */}
          <FormControl isRequired>
            <FormControl.Label>Title</FormControl.Label>
            <SafeInput
              placeholder="What's this expense for?"
              value={title}
              onChangeText={setTitle}
            />
          </FormControl>
          
          {/* Amount */}
          <FormControl isRequired>
            <FormControl.Label>Amount</FormControl.Label>
            <SafeInput
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              fontSize="xl"
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
                    as={MaterialIcons} 
                    name={expenseCategories.find(c => c.id === category)?.icon || 'help-outline'} 
                    color="primary.500" 
                  />
                  <Text>{expenseCategories.find(c => c.id === category)?.name || 'Select category'}</Text>
                </HStack>
              ) : (
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                  Select category
                </Text>
              )}
              <Icon as={Ionicons} name="chevron-down" />
            </Pressable>
          </FormControl>
          
          {/* Date */}
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
          
          {/* Group or Friends */}
          <Box>
            <FormControl.Label>Split With</FormControl.Label>
            
            {/* Group Selector */}
            <FormControl mb={4}>
              <Radio.Group
                name="groupSelect"
                value={selectedGroup}
                onChange={handleGroupSelect}
              >
                <HStack space={4} flexWrap="wrap">
                  <Radio value="" my={1}>Individual</Radio>
                  {groups.map(group => (
                    <Radio key={group.id} value={group.id} my={1}>
                      {group.name}
                    </Radio>
                  ))}
                </HStack>
              </Radio.Group>
            </FormControl>
            
            {/* Show participants/friends */}
            <Box 
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
              p={4} 
              borderRadius="lg" 
              mb={3}
            >
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <Text fontWeight="medium">Participants</Text>
                {!selectedGroup && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    leftIcon={<Icon as={Ionicons} name="add" size="sm" />}
                    onPress={() => setShowFriendsModal(true)}
                  >
                    Add Friends
                  </Button>
                )}
              </HStack>
              
              <VStack space={3}>
                {/* Current user (you) */}
                <HStack alignItems="center" space={2}>
                  <Avatar 
                    size="sm" 
                    bg="primary.500"
                  >
                    You
                  </Avatar>
                  <Text fontWeight="medium">You</Text>
                </HStack>
                
                {/* Participants */}
                {participants.length > 0 ? (
                  participants.map(participant => (
                    <HStack key={participant.id} alignItems="center" space={2} justifyContent="space-between">
                      <HStack alignItems="center" space={2}>
                        <Avatar 
                          size="sm" 
                          source={{ uri: participant.avatar }}
                        >
                          {participant.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Text>{participant.name}</Text>
                      </HStack>
                      
                      {!selectedGroup && (
                        <IconButton
                          icon={<Icon as={Ionicons} name="close-circle" />}
                          variant="ghost"
                          _icon={{ color: "red.500" }}
                          onPress={() => removeParticipant(participant.id)}
                        />
                      )}
                    </HStack>
                  ))
                ) : (
                  <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                    No participants added yet
                  </Text>
                )}
              </VStack>
            </Box>
          </Box>
          
          {/* Paid by */}
          <FormControl>
            <FormControl.Label>Paid By</FormControl.Label>
            <Radio.Group
              name="paidBy"
              value={paidBy}
              onChange={setPaidBy}
            >
              <VStack space={3}>
                <Radio value="me">
                  <Text>You</Text>
                </Radio>
                
                {participants.map(participant => (
                  <Radio key={participant.id} value={participant.id}>
                    <Text>{participant.name}</Text>
                  </Radio>
                ))}
              </VStack>
            </Radio.Group>
          </FormControl>
          
          {/* Split options */}
          <FormControl>
            <FormControl.Label>Split Options</FormControl.Label>
            <Radio.Group
              name="splitType"
              value={splitType}
              onChange={setSplitType}
            >
              <VStack space={3}>
                <Radio value="equal">
                  <Text>Split Equally</Text>
                </Radio>
                
                <Radio value="custom">
                  <Text>Custom Split</Text>
                </Radio>
              </VStack>
            </Radio.Group>
          </FormControl>
          
          {/* Custom amounts (if custom split) */}
          {splitType === 'custom' && (
            <Box 
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
              p={4} 
              borderRadius="lg" 
              mb={3}
            >
              <Text fontWeight="medium" mb={3}>Enter Custom Amounts</Text>
              
              <VStack space={3}>
                {participants.map(participant => (
                  <HStack key={participant.id} alignItems="center" justifyContent="space-between">
                    <Text>{participant.name}</Text>
                    <SafeInput
                      w="120px"
                      value={customAmounts[participant.id] || ''}
                      onChangeText={(value) => setCustomAmounts({
                        ...customAmounts,
                        [participant.id]: value
                      })}
                      placeholder="Amount"
                      keyboardType="decimal-pad"
                      InputLeftElement={
                        <Text fontSize="sm" ml={2}>₹</Text>
                      }
                    />
                  </HStack>
                ))}
                
                <Divider my={2} />
                
                <HStack justifyContent="space-between">
                  <Text fontWeight="medium">Your portion</Text>
                  <Text fontWeight="medium">₹{
                    calculateSplitAmounts()?.yourPortion !== undefined
                      ? calculateSplitAmounts()?.yourPortion.toFixed(2)
                      : '0.00'
                  }</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text fontWeight="medium">Total</Text>
                  <Text fontWeight="medium">₹{amount || '0.00'}</Text>
                </HStack>
              </VStack>
            </Box>
          )}
          
          {/* Split preview (if equal split) */}
          {splitType === 'equal' && amount && participants.length > 0 && (
            <Box 
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
              p={4} 
              borderRadius="lg" 
              mb={3}
            >
              <Text fontWeight="medium" mb={3}>Split Preview</Text>
              
              <VStack space={3}>
                <HStack justifyContent="space-between">
                  <Text>Each person pays</Text>
                  <Text>₹{calculateSplitAmounts()?.perPerson.toFixed(2)}</Text>
                </HStack>
                
                <HStack justifyContent="space-between">
                  <Text>Total amount</Text>
                  <Text>₹{parseFloat(amount).toFixed(2)}</Text>
                </HStack>
              </VStack>
            </Box>
          )}
          
          {/* Receipt Image */}
          <FormControl>
            <FormControl.Label>Attach Receipt (Optional)</FormControl.Label>
            {receiptImage ? (
              <Box position="relative">
                <Image 
                  source={{ uri: receiptImage }}
                  alt="Receipt"
                  height={200}
                  width="100%"
                  borderRadius="lg"
                  resizeMode="cover"
                />
                <IconButton
                  icon={<Icon as={Ionicons} name="close-circle" />}
                  position="absolute"
                  top={2}
                  right={2}
                  bg="rgba(0,0,0,0.5)"
                  _icon={{ color: "white" }}
                  onPress={() => setReceiptImage(null)}
                />
              </Box>
            ) : (
              <Pressable
                onPress={pickImage}
                borderWidth={1}
                borderColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}
                borderRadius="lg"
                py={4}
                borderStyle="dashed"
                alignItems="center"
              >
                <Icon as={Ionicons} name="image-outline" size="lg" color="primary.500" mb={2} />
                <Text color="primary.500">Add Receipt Image</Text>
              </Pressable>
            )}
          </FormControl>
          
          {/* Notes */}
          <FormControl>
            <FormControl.Label>Notes (Optional)</FormControl.Label>
            <SafeInput
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              height={100}
              placeholder="Add any notes about this expense"
              value={notes}
              onChangeText={setNotes}
            />
          </FormControl>
          
          {/* Save Button */}
          <Button
            mt={5}
            colorScheme="primary"
            isLoading={isSubmitting}
            onPress={saveExpense}
            leftIcon={<Icon as={Ionicons} name="save-outline" size="sm" />}
          >
            Save Expense
          </Button>
        </VStack>
      </Box>
      
      {/* Date Picker */}
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
      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Select Category</Modal.Header>
          <Modal.Body>
            <VStack space={3}>
              {expenseCategories.map((cat) => (
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
                      as={MaterialIcons}
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
      
      {/* Friends Selection Modal */}
      <Modal isOpen={showFriendsModal} onClose={() => setShowFriendsModal(false)}>
        <Modal.Content maxWidth="400px">
          <Modal.CloseButton />
          <Modal.Header>Select Friends</Modal.Header>
          <Modal.Body>
            <VStack space={3}>
              {friendsWithSelection.map((friend) => (
                <HStack 
                  key={friend.id} 
                  space={3} 
                  alignItems="center" 
                  justifyContent="space-between"
                >
                  <HStack space={2} alignItems="center">
                    <Avatar 
                      size="sm" 
                      source={{ uri: friend.avatar }}
                    >
                      {friend.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text>{friend.name}</Text>
                  </HStack>
                  <Checkbox
                    value={friend.id}
                    isChecked={friend.isSelected}
                    onChange={(isSelected) => {
                      if (isSelected) {
                        setParticipants([...participants, friend]);
                      } else {
                        setParticipants(participants.filter(p => p.id !== friend.id));
                      }
                    }}
                    accessibilityLabel={`Select ${friend.name}`}
                  />
                </HStack>
              ))}
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button 
                variant="ghost" 
                onPress={() => setShowFriendsModal(false)}
              >
                Cancel
              </Button>
              <Button 
                onPress={() => setShowFriendsModal(false)}
              >
                Done
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </KeyboardAwareScrollView>
  );
};

export default AddExpenseScreen;
