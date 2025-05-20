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
  useToast,
  Actionsheet,
  ScrollView,
  Button
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { auth } from '../../services/firebase';
import * as messageService from '../../services/messageService';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import * as Location from 'expo-location';
import { analyzeChat } from '../../services/aiService';

// // Helper component for center alignment
// const Center = ({ children, ...props }) => (
//   <Box width="full" alignItems="center" justifyContent="center" {...props}>
//     {children}
//   </Box>
// );

// Badge component
const DateBadge = ({ children, ...props }) => (
  <Box 
    borderRadius="full" 
    px={3} 
    py={1} 
    bg="rgba(0,0,0,0.05)"
    {...props}
  >
    {children}
  </Box>
);

const GroupChatScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const toast = useToast();
  const { groupId, groupName } = route.params || {};
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAttaching, setIsAttaching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestedExpenses, setSuggestedExpenses] = useState<any[]>([]);
  const [showExpenseSuggestion, setShowExpenseSuggestion] = useState(false);
  const flatListRef = useRef(null);
  
  // Auto-scroll to bottom when messages change
  // Subscribe to messages and mark them as read
  useEffect(() => {
    if (groupId) {
      setIsLoading(true);
      const unsubscribe = messageService.subscribeToGroupMessages(
        groupId, 
        (newMessages) => {
          setMessages(newMessages);
          setIsLoading(false);
          
          // Mark messages as delivered
          const messageIds = newMessages
            .filter(msg => !msg.deliveredTo?.includes(auth.currentUser?.uid))
            .map(msg => msg.id)
            .filter(Boolean);
          
          if (messageIds.length > 0) {
            messageService.markMessagesAsDelivered(groupId, messageIds);
          }
        }
      );
      
      return () => unsubscribe();
    }
  }, [groupId]);
  
  // Mark visible messages as read
  useEffect(() => {
    if (groupId && messages.length > 0) {
      const unreadMessages = messages
        .filter(msg => msg.senderId !== auth.currentUser?.uid && !msg.readBy?.includes(auth.currentUser?.uid))
        .map(msg => msg.id)
        .filter(Boolean);
      
      if (unreadMessages.length > 0) {
        messageService.markMessagesAsRead(groupId, unreadMessages);
      }
    }
  }, [messages, groupId]);
  
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
