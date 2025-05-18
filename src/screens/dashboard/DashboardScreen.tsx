import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity,
  FlatList 
} from 'react-native';
import { Box, Text, VStack, HStack, Heading, Progress, Icon, Pressable, useColorMode } from 'native-base';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Mock data for demonstration
const transactionData = [
  { id: '1', category: 'Food', merchant: 'Swiggy', amount: -850, date: '2023-10-21', type: 'expense', icon: 'fast-food-outline' },
  { id: '2', category: 'Entertainment', merchant: 'Netflix', amount: -499, date: '2023-10-15', type: 'expense', icon: 'film-outline' },
  { id: '3', category: 'Shopping', merchant: 'Amazon', amount: -1299, date: '2023-10-12', type: 'expense', icon: 'cart-outline' },
  { id: '4', category: 'Salary', merchant: 'Company XYZ', amount: 50000, date: '2023-10-01', type: 'income', icon: 'cash-outline' },
  { id: '5', category: 'Bills', merchant: 'Electricity', amount: -2100, date: '2023-10-08', type: 'expense', icon: 'flash-outline' },
];

const categoryTotals = {
  Food: 4500,
  Entertainment: 1200,
  Shopping: 3500,
  Bills: 5800,
  Transport: 2000,
};

// Helper function to safely handle numeric values
const safeNumber = (value) => {
  if (typeof value === 'number') {
    // Ensure we're not passing values that might cause precision issues
    return Math.round(value); // Round to integer to avoid precision issues
  }
  return 0;
};

const DashboardScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const [activeTab, setActiveTab] = useState('all');
  
  const screenWidth = Dimensions.get('window').width - 40;
  
  const chartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: () => colorMode === 'dark' ? '#00B1F9' : '#00B1F9',
        strokeWidth: 2
      }
    ],
  };
  
  const chartConfig = {
    backgroundGradientFrom: colorMode === 'dark' ? '#232323' : '#F9F9F9',
    backgroundGradientTo: colorMode === 'dark' ? '#232323' : '#F9F9F9',
    decimalPlaces: 0,
    color: () => colorMode === 'dark' ? '#FFFFFF' : '#333333',
    labelColor: () => colorMode === 'dark' ? '#A3A3A3' : '#757575',
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#00B1F9"
    }
  };

  // Fix for precision issue in calculations
  // Make sure any floating-point calculations are properly handled
  const calculateValues = (value) => {
    // Convert to number explicitly and use toFixed for consistent precision
    return Number(parseFloat(value).toFixed(2));
  };

  // Fix any data processing that might cause precision issues
  useEffect(() => {
    // Example of safe number handling
    const processData = () => {
      // If you have any calculations here, make sure they use proper precision
      // For example:
      // const value = calculateValues(someNumber);
    };

    processData();
  }, []);

  // If you have sample transaction data or calculations, modify them like this:
  const sampleData = [
    // Replace any problematic floating point values
    { amount: safeNumber(87.5), category: "Food" },
    // ...other data
  ];

  // When displaying financial values in the UI, use toFixed
  const formatCurrency = (value) => {
    return `$${safeNumber(value).toFixed(2)}`;
  };

  // When doing calculations, make sure to handle precision
  const calculateTotal = (items) => {
    if (!items || !items.length) return 0;
    return items.reduce((sum, item) => safeNumber(sum + item.amount), 0);
  };

  // Render individual transaction item
  const renderTransactionItem = ({ item: transaction }) => (
    <TouchableOpacity 
      key={transaction.id}
      onPress={() => navigation.navigate('TransactionDetails', { transaction })}
    >
      <HStack 
        bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
        borderRadius="lg" 
        p={4} 
        shadow={1}
        justifyContent="space-between"
        alignItems="center"
        mb={3} // Add margin bottom for spacing
      >
        <HStack space={3} alignItems="center">
          <Box 
            p={2} 
            borderRadius="full"
            bg={transaction.type === 'income' ? 'green.100' : 'red.100'}
          >
            <Icon 
              as={Ionicons} 
              name={transaction.icon} 
              size="md" 
              color={transaction.type === 'income' ? 'green.500' : 'red.500'}
            />
          </Box>
          <VStack>
            <Text fontWeight="medium">{transaction.merchant}</Text>
            <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              {transaction.category} • {transaction.date}
            </Text>
          </VStack>
        </HStack>
        <Text 
          fontWeight="bold"
          color={transaction.amount > 0 ? 'green.500' : 'red.500'}
        >
          {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount)}
        </Text>
      </HStack>
    </TouchableOpacity>
  );

  // Filter transactions based on active tab
  const filteredTransactions = transactionData.filter(t => {
    if (activeTab === 'all') return true;
    return t.type === activeTab;
  }).slice(0, 5);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Box p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <HStack justifyContent="space-between" alignItems="center" mb={3}>
          <Heading size="lg">Dashboard</Heading>
          <Icon as={Ionicons} name="notifications-outline" size={6} color="primary.500" />
        </HStack>
        
        {/* Account Balance Section */}
        <Box 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
          borderRadius="lg"
          p={4}
          mb={5}
          shadow={2}
        >
          <Text fontSize="sm" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Total Balance</Text>
          <Text fontSize="3xl" fontWeight="bold">₹42,500.00</Text>
          
          <HStack mt={3} space={2} alignItems="center">
            <Icon as={Ionicons} name="arrow-up-circle" color="green.500" size="sm" />
            <Text color="green.500" fontWeight="medium">+12.5% from last month</Text>
          </HStack>
        </Box>
        
        {/* Spending Analysis */}
        <Heading size="md" mb={4}>Spending Analysis</Heading>
        <Box mb={5}>
          <LineChart
            data={chartData}
            width={screenWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              borderRadius: 16,
              marginVertical: 8,
            }}
          />
        </Box>
        
        {/* Budget Status */}
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <Heading size="md">Budget Status</Heading>
          <Pressable 
            onPress={() => navigation.navigate('CategoryBreakdown')}
            flexDirection="row"
            alignItems="center"
          >
            <Text color="primary.500" mr={1}>View All</Text>
            <Icon as={Ionicons} name="chevron-forward" color="primary.500" size="sm" />
          </Pressable>
        </HStack>
        
        <Box 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
          borderRadius="lg"
          p={4}
          mb={5}
          shadow={2}
        >
          {/* Category progress bars */}
          <VStack space={4}>
            <HStack justifyContent="space-between">
              <HStack alignItems="center" space={2}>
                <Icon as={Ionicons} name="fast-food-outline" size="sm" color="orange.500" />
                <Text>Food</Text>
              </HStack>
              <Text>₹4,500 / ₹6,000</Text>
            </HStack>
            <Progress value={safeNumber(75)} colorScheme="orange" />
            
            <HStack justifyContent="space-between">
              <HStack alignItems="center" space={2}>
                <Icon as={Ionicons} name="film-outline" size="sm" color="violet.500" />
                <Text>Entertainment</Text>
              </HStack>
              <Text>₹1,200 / ₹2,000</Text>
            </HStack>
            <Progress value={safeNumber(60)} colorScheme="violet" />
            
            <HStack justifyContent="space-between">
              <HStack alignItems="center" space={2}>
                <Icon as={Ionicons} name="cart-outline" size="sm" color="blue.500" />
                <Text>Shopping</Text>
              </HStack>
              <Text>₹3,500 / ₹4,000</Text>
            </HStack>
            <Progress value={safeNumber(88)} colorScheme="blue" />
          </VStack>
        </Box>
        
        {/* Recent Transactions */}
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <Heading size="md">Recent Transactions</Heading>
          <Pressable 
            onPress={() => {}} 
            flexDirection="row"
            alignItems="center"
          >
            <Text color="primary.500" mr={1}>View All</Text>
            <Icon as={Ionicons} name="chevron-forward" color="primary.500" size="sm" />
          </Pressable>
        </HStack>
        
        {/* Transaction Tabs */}
        <HStack space={4} mb={4}>
          {['all', 'income', 'expense'].map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              px={4}
              py={2}
              borderRadius="full"
              bg={activeTab === tab ? 'primary.500' : colorMode === 'dark' ? 'card.dark' : 'card.light'}
            >
              <Text
                color={activeTab === tab ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
                textTransform="capitalize"
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </HStack>
        
        {/* Transaction List - Use FlatList with ListHeaderComponent and scrollEnabled={false} instead of nesting in ScrollView */}
        <View style={{ marginBottom: 20 }}>
          <FlatList
            data={filteredTransactions}
            renderItem={renderTransactionItem}
            keyExtractor={item => item.id}
            scrollEnabled={false} // Important: disable scrolling since parent ScrollView handles it
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <Box h={1} />}
            ListEmptyComponent={
              <Box alignItems="center" py={4}>
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                  No transactions found
                </Text>
              </Box>
            }
          />
        </View>
      </Box>
    </ScrollView>
  );
};

export default DashboardScreen;
