import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  IconButton,
  Icon,
  Avatar,
  useColorMode,
  FlatList,
  Pressable,
  Menu,
  Divider,
  useToast
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { auth } from '../../services/firebase';

// Mock messages data
const initialMessages = [
  {
    id: '1',
    text: "Hey everyone, I've added the dinner expense from last night.",
    sender: {
      id: '2',
      name: 'Priya Patel',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    isExpense: true,
    expenseDetails: {
      title: 'Dinner at Restaurant',
      amount: 3600,
      participants: 4
    }
  },
  {
    id: '2',
    text: "Thanks for adding that. I'll settle up soon.",
    sender: {
      id: '3',
      name: 'Amit Kumar',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
    },
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: '3',
    text: "No rush! By the way, shall we plan another outing next weekend?",
    sender: {
      id: '2',
      name: 'Priya Patel',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    timestamp: new Date(Date.now() - 3000000).toISOString(), // 50 minutes ago
  },
  {
    id: '4',
    text: "I'm in for next weekend!",
    sender: {
      id: '5',
      name: 'Raj Malhotra',
      avatar: 'https://randomuser.me/api/portraits/men/53.jpg'
    },
    timestamp: new Date(Date.now() - 2400000).toISOString(), // 40 minutes ago
  },
  {
    id: '5',
    text: "Count me in too. Maybe we can try that new pizza place?",
    sender: {
      id: 'me',
      name: 'You',
      avatar: null
    },
    timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
  },
  {
    id: '6',
    text: "Perfect! Let's do pizza on Saturday.",
    sender: {
      id: '2',
      name: 'Priya Patel',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
  }
];

const GroupChatScreen = () => {
  const route = useRoute();
  const { colorMode } = useColorMode();
  const toast = useToast();
  const { groupId, groupName } = route.params;
  
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const flatListRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const message = {
      id: Date.now().toString(),
      text: newMessage.trim(),
      sender: {
        id: 'me',
        name: 'You',
        avatar: null
      },
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, message]);
    setNewMessage('');
  };
  
  const handleAttachment = () => {
    setIsAttaching(!isAttaching);
  };
  
  const handleAddExpense = () => {
    // Navigate to AddExpense screen
    // navigation.navigate('AddExpense', { groupId, groupName });
    toast.show({
      title: "Add Expense",
      description: "Navigating to add expense screen",
      status: "info"
    });
    setIsAttaching(false);
  };
  
  const groupMessagesByDate = () => {
    const groupedMessages = [];
    let currentDate = '';
    
    messages.forEach(message => {
      const messageDate = formatDate(message.timestamp);
      
      if (messageDate !== currentDate) {
        groupedMessages.push({ type: 'date', date: messageDate, id: `date-${messageDate}` });
        currentDate = messageDate;
      }
      
      groupedMessages.push({ type: 'message', ...message });
    });
    
    return groupedMessages;
  };
  
  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <Center my={4}>
          <Badge borderRadius="full" px={3} py={1} bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}>
            <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              {item.date}
            </Text>
          </Badge>
        </Center>
      );
    }
    
    const isOwnMessage = item.sender.id === 'me';
    
    return (
      <HStack 
        width="full"
        justifyContent={isOwnMessage ? 'flex-end' : 'flex-start'} 
        mb={4}
      >
        {!isOwnMessage && (
          <Avatar 
            size="sm"
            source={item.sender.avatar ? { uri: item.sender.avatar } : undefined}
            bg={item.sender.avatar ? undefined : 'gray.500'}
            mr={2}
          >
            {item.sender.name.charAt(0).toUpperCase()}
          </Avatar>
        )}
        
        <VStack 
          maxWidth="80%"
          bg={
            isOwnMessage 
              ? (colorMode === 'dark' ? 'primary.700' : 'primary.500')
              : (colorMode === 'dark' ? 'card.dark' : 'card.light')
          }
          px={4}
          py={2}
          borderRadius="lg"
          borderBottomLeftRadius={isOwnMessage ? 'lg' : 'xs'}
          borderBottomRightRadius={isOwnMessage ? 'xs' : 'lg'}
        >
          {!isOwnMessage && (
            <Text fontSize="xs" fontWeight="bold" color={colorMode === 'dark' ? 'primary.300' : 'primary.600'}>
              {item.sender.name}
            </Text>
          )}
          
          {item.isExpense && (
            <Pressable
              bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
              p={2}
              borderRadius="md"
              mb={2}
            >
              <HStack alignItems="center" space={2}>
                <Icon as={Ionicons} name="receipt-outline" color="primary.500" />
                <VStack>
                  <Text fontSize="xs" fontWeight="bold">{item.expenseDetails.title}</Text>
                  <HStack space={1}>
                    <Text fontSize="2xs">₹{item.expenseDetails.amount}</Text>
                    <Text fontSize="2xs">•</Text>
                    <Text fontSize="2xs">{item.expenseDetails.participants} people</Text>
                  </HStack>
                </VStack>
              </HStack>
            </Pressable>
          )}
          
          <Text color={isOwnMessage ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}>
            {item.text}
          </Text>
          
          <Text 
            fontSize="2xs" 
            alignSelf="flex-end" 
            mt={1}
            color={isOwnMessage ? 'rgba(255,255,255,0.6)' : (colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light')}
          >
            {formatTime(item.timestamp)}
          </Text>
        </VStack>
      </HStack>
    );
  };
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Box flex={1} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={groupMessagesByDate()}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => 
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
        
        {/* Message Input */}
        <Box
          p={4}
          borderTopWidth={1}
          borderTopColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
        >
          {isAttaching && (
            <HStack space={4} py={3} px={2} mb={4} justifyContent="space-around">
              <Pressable onPress={handleAddExpense} alignItems="center">
                <Box
                  bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                  p={3}
                  borderRadius="full"
                >
                  <Icon as={Ionicons} name="receipt-outline" color="primary.500" />
                </Box>
                <Text fontSize="xs" mt={1}>Add Expense</Text>
              </Pressable>
              
              <Pressable alignItems="center">
                <Box
                  bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                  p={3}
                  borderRadius="full"
                >
                  <Icon as={Ionicons} name="image-outline" color="primary.500" />
                </Box>
                <Text fontSize="xs" mt={1}>Gallery</Text>
              </Pressable>
              
              <Pressable alignItems="center">
                <Box
                  bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                  p={3}
                  borderRadius="full"
                >
                  <Icon as={Ionicons} name="camera-outline" color="primary.500" />
                </Box>
                <Text fontSize="xs" mt={1}>Camera</Text>
              </Pressable>
              
              <Pressable alignItems="center">
                <Box
                  bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                  p={3}
                  borderRadius="full"
                >
                  <Icon as={Ionicons} name="location-outline" color="primary.500" />
                </Box>
                <Text fontSize="xs" mt={1}>Location</Text>
              </Pressable>
            </HStack>
          )}
          
          <HStack space={2} alignItems="center">
            <IconButton
              icon={<Icon as={Ionicons} name={isAttaching ? "close" : "add"} />}
              borderRadius="full"
              variant="ghost"
              onPress={handleAttachment}
            />
            
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              flex={1}
              py={2}
              px={4}
              borderRadius="full"
              fontSize="md"
              bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
              borderWidth={0}
            />
            
            <IconButton
              icon={<Icon as={Ionicons} name="send" color="primary.500" />}
              borderRadius="full"
              disabled={newMessage.trim() === ''}
              _disabled={{ opacity: 0.5 }}
              onPress={handleSendMessage}
            />
          </HStack>
        </Box>
      </Box>
    </KeyboardAvoidingView>
  );
};

// Helper component for center alignment
const Center = ({ children, ...props }) => (
  <Box width="full" alignItems="center" justifyContent="center" {...props}>
    {children}
  </Box>
);

// Badge component
const Badge = ({ children, ...props }) => (
  <Box {...props}>
    {children}
  </Box>
);

export default GroupChatScreen;
