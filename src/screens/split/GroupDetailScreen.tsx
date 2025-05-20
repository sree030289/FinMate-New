import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  FlatList,
  Avatar,
  Icon,
  Pressable,
  Button,
  Badge,
  Menu,
  IconButton,
  useColorMode,
  useToast,
  Modal,
  Input,
  ScrollView as NBScrollView,
  Divider,
  Center
} from 'native-base';
import { ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { splitExpenseService } from '../../services/firestoreService';
import { Group, GroupMember, User } from '../../types';
import { NavigationProps, RouteProps } from '../../types/navigation';
import { MaterialIcons } from '@expo/vector-icons';
import { collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';

// Mock data for group expenses
const mockExpenses = [
  {
    id: '1',
    title: 'Dinner at Restaurant',
    date: '2023-06-08',
    amount: 3600.00,
    paidBy: {
      id: '2',
      name: 'Priya Patel',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    participants: [
      { id: 'me', name: 'You', share: 900.00 },
      { id: '2', name: 'Priya Patel', share: 900.00 },
      { id: '3', name: 'Amit Kumar', share: 900.00 },
      { id: '5', name: 'Raj Malhotra', share: 900.00 }
    ],
    category: 'food',
    settled: false
  },
  {
    id: '2',
    title: 'Movie Tickets',
    date: '2023-06-05',
    amount: 1500.00,
    paidBy: {
      id: 'me',
      name: 'You',
      avatar: null
    },
    participants: [
      { id: 'me', name: 'You', share: 500.00 },
      { id: '2', name: 'Priya Patel', share: 500.00 },
      { id: '3', name: 'Amit Kumar', share: 500.00 }
    ],
    category: 'entertainment',
    settled: true
  },
  {
    id: '3',
    title: 'Groceries',
    date: '2023-06-03',
    amount: 2400.00,
    paidBy: {
      id: '3',
      name: 'Amit Kumar',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
    },
    participants: [
      { id: 'me', name: 'You', share: 800.00 },
      { id: '3', name: 'Amit Kumar', share: 800.00 },
      { id: '5', name: 'Raj Malhotra', share: 800.00 }
    ],
    category: 'groceries',
    settled: false
  }
];

// Mock data for group members
const mockMembers = [
  {
    id: 'me',
    name: 'You',
    avatar: null,
    owes: 0,
    owed: 500.00
  },
  {
    id: '2',
    name: 'Priya Patel',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    owes: 1400.00,
    owed: 0
  },
  {
    id: '3',
    name: 'Amit Kumar',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    owes: 0,
    owed: 1600.00
  },
  {
    id: '5',
    name: 'Raj Malhotra',
    avatar: 'https://randomuser.me/api/portraits/men/53.jpg',
    owes: 1700.00,
    owed: 0
  }
];

type RouteParams = {
  groupId: string;
  groupName: string;
};

type Member = {
  id: string;
  name: string;
  avatar?: string;
  balance: number;
};

type LocalExpense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  paidBy: string;
  category: string;
  icon: string;
  splitBy: Array<{
    userId: string;
    amount: number;
  }>;
};

const GroupDetailScreen = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<RouteProps<'GroupDetail'>>();
  const { groupId, groupName } = route.params;
  
  const [activeTab, setActiveTab] = useState('expenses');
  const [groupData, setGroupData] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<LocalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Get group details
        const groupRef = doc(db, 'groups', groupId);
        const groupSnap = await getDoc(groupRef);
        
        if (groupSnap.exists()) {
          setGroupData(groupSnap.data());
        }
        
        // Get members
        const membersRef = collection(db, `groups/${groupId}/members`);
        const membersSnap = await getDocs(membersRef);
        
        const membersData: Member[] = membersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Member));
        
        setMembers(membersData);
        
        // Get expenses
        const expensesRef = collection(db, `groups/${groupId}/expenses`);
        const expensesQuery = query(expensesRef, orderBy('date', 'desc'));
        const expensesSnap = await getDocs(expensesQuery);
        
        const expensesData: LocalExpense[] = expensesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as LocalExpense));
        
        setExpenses(expensesData);
        
      } catch (error) {
        console.error("Error fetching group data:", error);
        toast.show({
          title: "Error",
          description: "Failed to load group data",
          status: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId]);
  
  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };
  
  const getCurrentUserBalance = () => {
    const currentUser = members.find(member => member.id === auth.currentUser?.uid);
    return currentUser?.balance || 0;
  };
  
  // Categorize members by their balance
  const getBalanceCategories = () => {
    const currentUserId = auth.currentUser?.uid;
    
    const youOwe = members.filter(member => 
      member.id !== currentUserId && member.balance > 0
    );
    
    const oweYou = members.filter(member => 
      member.id !== currentUserId && member.balance < 0
    );
    
    const settled = members.filter(member => 
      member.id !== currentUserId && member.balance === 0
    );
    
    return { youOwe, oweYou, settled };
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  const handleSettleExpense = (expenseId) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setExpenses(expenses.map(expense => 
        expense.id === expenseId ? {...expense, settled: true} : expense
      ));
      
      toast.show({
        title: "Expense Settled",
        description: "The expense has been marked as settled",
        status: "success"
      });
      
      setLoading(false);
    }, 1000);
  };
  
  const handleDeleteExpense = (expenseId) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setExpenses(expenses.filter(expense => expense.id !== expenseId));
      
      toast.show({
        title: "Expense Deleted",
        description: "The expense has been deleted",
        status: "info"
      });
      
      setLoading(false);
    }, 1000);
  };
  
  const handleOpenChat = () => {
    navigation.navigate('GroupChat', { groupId, groupName });
  };
  
  const handleAddExpense = () => {
    navigation.navigate('AddExpense', { groupId, groupName });
  };
  
  const handleSettleUp = (memberInfo: any) => {
    navigation.navigate('PaymentMethods', {
      amount: memberInfo.owes || memberInfo.owed,
      friendName: memberInfo.name,
      friendId: memberInfo.id,
      groupId,
      isReceiving: memberInfo.owes > 0
    });
  };
  
  const handleInviteMembers = () => {
    navigation.navigate('InviteMembers', { groupId, groupName });
  };

  return (
    <Box flex={1} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      {/* Group Header */}
      <Box 
        p={5}
        bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
        shadow={2}
      >
        <HStack space={4} alignItems="center" mb={4}>
          <Avatar 
            bg="primary.500" 
            size="lg"
          >
            {groupName?.charAt(0).toUpperCase()}
          </Avatar>
          
          <VStack>
            <Heading size="md">{groupName}</Heading>
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Created {groupData?.createdAt?.toDate()?.toLocaleDateString() || 'N/A'}
            </Text>
            <HStack space={2} mt={1}>
              <Icon as={Ionicons} name="people" size="sm" color="primary.500" />
              <Text>{members.length} members</Text>
            </HStack>
          </VStack>
        </HStack>
        
        <HStack space={4} justifyContent="space-between">
          <Box 
            flex={1} 
            p={3} 
            bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}
            borderRadius="md"
            alignItems="center"
          >
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Total Expenses
            </Text>
            <Text fontWeight="bold" fontSize="lg">₹{getTotalExpenses().toLocaleString()}</Text>
          </Box>
          
          <Box 
            flex={1} 
            p={3} 
            bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}
            borderRadius="md"
            alignItems="center"
          >
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Your Balance
            </Text>
            <Text 
              fontWeight="bold" 
              fontSize="lg" 
              color={
                getCurrentUserBalance() > 0 ? 'red.500' : 
                getCurrentUserBalance() < 0 ? 'green.500' : 
                colorMode === 'dark' ? 'text.dark' : 'text.light'
              }
            >
              {getCurrentUserBalance() > 0 ? 'You owe' : 
               getCurrentUserBalance() < 0 ? 'You get' : 'Settled up'}
              {getCurrentUserBalance() !== 0 ? ` ₹${Math.abs(getCurrentUserBalance()).toLocaleString()}` : ''}
            </Text>
          </Box>
        </HStack>
      </Box>
      
      {/* Action Buttons */}
      <HStack 
        p={4}
        justifyContent="space-around" 
        bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
        borderBottomWidth={1}
        borderBottomColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}
      >
        <Pressable 
          onPress={() => navigation.navigate('AddExpense', { groupId, groupName })}
          alignItems="center"
        >
          <Icon as={Ionicons} name="add-circle-outline" size="lg" color="primary.500" mb={1} />
          <Text color="primary.500">Add Expense</Text>
        </Pressable>
        
        <Pressable 
          onPress={() => navigation.navigate('GroupChat', { groupId, groupName })}
          alignItems="center"
        >
          <Icon as={Ionicons} name="chatbubble-outline" size="lg" color="primary.500" mb={1} />
          <Text color="primary.500">Group Chat</Text>
        </Pressable>
        
        <Pressable 
          onPress={() => navigation.navigate('InviteMembers', { groupId, groupName })}
          alignItems="center"
        >
          <Icon as={Ionicons} name="person-add-outline" size="lg" color="primary.500" mb={1} />
          <Text color="primary.500">Add Member</Text>
        </Pressable>
      </HStack>
      
      {/* Tabs */}
      <HStack 
        bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
        p={1}
        mb={2}
      >
        <Pressable 
          onPress={() => setActiveTab('expenses')}
          flex={1}
          p={2}
          alignItems="center"
          borderBottomWidth={2}
          borderBottomColor={activeTab === 'expenses' ? 'primary.500' : 'transparent'}
        >
          <Text 
            fontWeight={activeTab === 'expenses' ? 'bold' : 'normal'}
            color={activeTab === 'expenses' ? 'primary.500' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
          >
            Expenses
          </Text>
        </Pressable>
        
        <Pressable 
          onPress={() => setActiveTab('balances')}
          flex={1}
          p={2}
          alignItems="center"
          borderBottomWidth={2}
          borderBottomColor={activeTab === 'balances' ? 'primary.500' : 'transparent'}
        >
          <Text 
            fontWeight={activeTab === 'balances' ? 'bold' : 'normal'}
            color={activeTab === 'balances' ? 'primary.500' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
          >
            Balances
          </Text>
        </Pressable>
        
        <Pressable 
          onPress={() => setActiveTab('members')}
          flex={1}
          p={2}
          alignItems="center"
          borderBottomWidth={2}
          borderBottomColor={activeTab === 'members' ? 'primary.500' : 'transparent'}
        >
          <Text 
            fontWeight={activeTab === 'members' ? 'bold' : 'normal'}
            color={activeTab === 'members' ? 'primary.500' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
          >
            Members
          </Text>
        </Pressable>
      </HStack>
      
      {/* Tab Content */}
      <Box flex={1}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {activeTab === 'expenses' && (
            <VStack space={3}>
              <Heading size="sm" mb={2}>Recent Expenses</Heading>
              
              {expenses.length === 0 ? (
                <Box 
                  p={6} 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                  borderRadius="lg"
                  alignItems="center"
                >
                  <Icon as={Ionicons} name="receipt-outline" size="4xl" color="gray.400" mb={2} />
                  <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                    No expenses yet
                  </Text>
                  <Button 
                    mt={4} 
                    leftIcon={<Icon as={Ionicons} name="add" />}
                    onPress={() => navigation.navigate('AddExpense', { groupId, groupName })}
                  >
                    Add First Expense
                  </Button>
                </Box>
              ) : (
                expenses.map((expense) => (
                  <Pressable 
                    key={expense.id}
                    onPress={() => navigation.navigate('TransactionDetails', { 
                      transaction: { ...expense, type: 'expense' }
                    })}
                  >
                    <Box 
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
                            <Icon 
                              as={MaterialIcons} 
                              name={expense.icon} 
                              size="md" 
                              color="primary.500"
                            />
                          </Box>
                          <VStack>
                            <Text fontWeight="medium">{expense.title}</Text>
                            <HStack space={1} alignItems="center">
                              <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                                {expense.date}
                              </Text>
                              <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                                • Paid by {members.find(m => m.id === expense.paidBy)?.name || 'Unknown'}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                        
                        <Text fontWeight="bold">₹{expense.amount}</Text>
                      </HStack>
                    </Box>
                  </Pressable>
                ))
              )}
            </VStack>
          )}
          
          {activeTab === 'balances' && (
            <VStack space={4}>
              {/* You owe section */}
              <VStack space={2}>
                <Heading size="sm" mb={1}>You owe</Heading>
                
                {getBalanceCategories().youOwe.length === 0 ? (
                  <Box p={4} bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} borderRadius="lg">
                    <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                      You don't owe anyone
                    </Text>
                  </Box>
                ) : (
                  getBalanceCategories().youOwe.map((member) => (
                    <Box 
                      key={member.id} 
                      p={4} 
                      bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                      borderRadius="lg"
                      shadow={1}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <HStack space={3} alignItems="center">
                          <Avatar 
                            size="sm" 
                            source={member.avatar ? { uri: member.avatar } : undefined}
                            bg="primary.500"
                          >
                            {member.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Text>{member.name}</Text>
                        </HStack>
                        
                        <HStack space={2} alignItems="center">
                          <Text fontWeight="bold" color="red.500">
                            You owe ₹{member.balance.toLocaleString()}
                          </Text>
                          <Button size="sm" colorScheme="primary" variant="outline">
                            Pay
                          </Button>
                        </HStack>
                      </HStack>
                    </Box>
                  ))
                )}
              </VStack>
              
              {/* You are owed section */}
              <VStack space={2}>
                <Heading size="sm" mb={1}>You are owed</Heading>
                
                {getBalanceCategories().oweYou.length === 0 ? (
                  <Box p={4} bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} borderRadius="lg">
                    <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                      No one owes you
                    </Text>
                  </Box>
                ) : (
                  getBalanceCategories().oweYou.map((member) => (
                    <Box 
                      key={member.id} 
                      p={4} 
                      bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                      borderRadius="lg"
                      shadow={1}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <HStack space={3} alignItems="center">
                          <Avatar 
                            size="sm" 
                            source={member.avatar ? { uri: member.avatar } : undefined}
                            bg="primary.500"
                          >
                            {member.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Text>{member.name}</Text>
                        </HStack>
                        
                        <Text fontWeight="bold" color="green.500">
                          Owes you ₹{Math.abs(member.balance).toLocaleString()}
                        </Text>
                      </HStack>
                    </Box>
                  ))
                )}
              </VStack>
              
              {/* Settled up section */}
              {getBalanceCategories().settled.length > 0 && (
                <VStack space={2}>
                  <Heading size="sm" mb={1}>Settled up</Heading>
                  {getBalanceCategories().settled.map((member) => (
                    <Box 
                      key={member.id} 
                      p={4} 
                      bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                      borderRadius="lg"
                      shadow={1}
                    >
                      <HStack justifyContent="space-between" alignItems="center">
                        <HStack space={3} alignItems="center">
                          <Avatar 
                            size="sm" 
                            source={member.avatar ? { uri: member.avatar } : undefined}
                            bg="primary.500"
                          >
                            {member.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Text>{member.name}</Text>
                        </HStack>
                        
                        <HStack space={2} alignItems="center">
                          <Icon as={Ionicons} name="checkmark-circle" color="green.500" size="sm" />
                          <Text>Settled up</Text>
                        </HStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              )}
            </VStack>
          )}
          
          {activeTab === 'members' && (
            <VStack space={3}>
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <Heading size="sm">Group Members ({members.length})</Heading>
                <Button 
                  leftIcon={<Icon as={Ionicons} name="person-add" />}
                  variant="ghost"
                  colorScheme="primary"
                  onPress={() => navigation.navigate('InviteMembers', { groupId, groupName })}
                >
                  Invite
                </Button>
              </HStack>
              
              {members.map((member) => (
                <Box 
                  key={member.id} 
                  p={4} 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                  borderRadius="lg"
                  shadow={1}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space={3} alignItems="center">
                      <Avatar 
                        size="sm" 
                        source={member.avatar ? { uri: member.avatar } : undefined}
                        bg="primary.500"
                      >
                        {member.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      
                      <VStack>
                        <Text fontWeight="medium">
                          {member.name}
                          {member.id === auth.currentUser?.uid && " (You)"}
                        </Text>
                        
                        {member.id === groupData?.createdBy && (
                          <HStack alignItems="center" space={1}>
                            <Icon as={Ionicons} name="star" size="xs" color="yellow.500" />
                            <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                              Admin
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </HStack>
                    
                    <Menu 
                      trigger={(triggerProps) => (
                        <Pressable {...triggerProps}>
                          <Icon 
                            as={Ionicons} 
                            name="ellipsis-vertical" 
                            size="sm" 
                            color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} 
                          />
                        </Pressable>
                      )}
                      placement="bottom right"
                    >
                      <Menu.Item>View Profile</Menu.Item>
                      {member.id !== auth.currentUser?.uid && groupData?.createdBy === auth.currentUser?.uid && (
                        <Menu.Item isDisabled={false}>
                          Remove from Group
                        </Menu.Item>
                      )}
                    </Menu>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </ScrollView>
      </Box>
    </Box>
  );
};

export default GroupDetailScreen;
