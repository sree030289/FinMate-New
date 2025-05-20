import React, { useState, useEffect } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity,
  FlatList,
  RefreshControl
} from 'react-native';
import { Box, Text, VStack, HStack, Heading, Progress, Icon, Pressable, useColorMode, useToast, IToastProps } from 'native-base';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { useFetch } from '../../hooks/useData';
import { transactionService, categoryService } from '../../services/firestoreService';
import { Transaction, Category } from '../../types';
import { NavigationProps } from '../../types/navigation';

interface CategoryTotal {
  name: string;
  icon: string;
  color: string;
  spent: number;
  budget: number;
}

// Helper function to safely handle numeric values
const safeNumber = (value: any): number => {
  if (typeof value === 'number') {
    // Ensure we're not passing values that might cause precision issues
    return Math.round(value * 100) / 100; // Round to 2 decimal places
  }
  return 0;
};

const DashboardScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch transactions with the useFetch hook
  const { 
    data: transactions, 
    error: transactionsError, 
    isLoading: transactionsLoading,
    refetch: refetchTransactions
  } = useFetch<Transaction[]>(
    () => transactionService.getTransactions([], 'date', true, 20),
    { cacheKey: 'dashboard_transactions', cacheDuration: 2 * 60 * 1000 } // 2 minutes cache
  );

  // Fetch categories with the useFetch hook
  const { 
    data: categories, 
    error: categoriesError, 
    isLoading: categoriesLoading,
    refetch: refetchCategories
  } = useFetch<Category[]>(
    () => categoryService.getCategories(),
    { cacheKey: 'categories' }
  );
  
  const screenWidth = Dimensions.get('window').width - 40;
  
  // Calculate monthly spending data for the chart
  const getChartData = () => {
    if (!transactions || transactions.length === 0) {
      // Return default data if no transactions
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{ 
          data: [0, 0, 0, 0, 0, 0],
          color: () => colorMode === 'dark' ? '#00B1F9' : '#00B1F9',
          strokeWidth: 2
        }],
      };
    }

    // Group transactions by month and sum expenses
    const monthlyData: Record<string, number> = {};
    const currentDate = new Date();
    
    // Initialize with last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = month.toLocaleString('default', { month: 'short' });
      monthlyData[monthKey] = 0;
    }
    
    // Calculate totals for each month
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleString('default', { month: 'short' });
      
      if (monthlyData.hasOwnProperty(monthKey) && transaction.type === 'expense') {
        monthlyData[monthKey] += Math.abs(transaction.amount || 0);
      }
    });
    
    return {
      labels: Object.keys(monthlyData),
      datasets: [{
        data: Object.values(monthlyData).map(value => safeNumber(value)),
        color: () => colorMode === 'dark' ? '#00B1F9' : '#00B1F9',
        strokeWidth: 2
      }],
    };
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

  // Calculate current balance from transactions
  const calculateTotalBalance = (): number => {
    if (!transactions || transactions.length === 0) return 0;
    
    return transactions.reduce((total, transaction) => {
      return total + (transaction.amount || 0);
    }, 0);
  };

  // Calculate category spending and budgets
  const calculateCategoryTotals = (): Record<string, CategoryTotal> => {
    if (!transactions || !categories) return {};

    const categoryTotals: Record<string, CategoryTotal> = {};
    
    // Initialize with categories and their budgets
    categories.forEach(category => {
      categoryTotals[category.id] = {
        name: category.name,
        icon: category.icon,
        color: category.color,
        spent: 0,
        budget: category.budget || 0
      };
    });
    
    // Sum up expenses by category
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && transaction.category && categoryTotals[transaction.category]) {
        categoryTotals[transaction.category].spent += Math.abs(transaction.amount || 0);
      }
    });
    
    return categoryTotals;
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      await Promise.all([
        refetchTransactions(),
        refetchCategories()
      ]);
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Failed to refresh data"
      } as IToastProps);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Format currency for display
  const formatCurrency = (value: number): string => {
    return `₹${safeNumber(value).toLocaleString('en-IN')}`;
  };

  // Render individual transaction item
  const renderTransactionItem = ({ item: transaction }: { item: Transaction }) => (
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
              name={getCategoryIcon(transaction.category)} 
              size="md" 
              color={transaction.type === 'income' ? 'green.500' : 'red.500'}
            />
          </Box>
          <VStack>
            <Text fontWeight="medium">{transaction.title || transaction.category}</Text>
            <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              {getCategoryName(transaction.category)} • {formatDate(transaction.date)}
            </Text>
          </VStack>
        </HStack>
        <Text 
          fontWeight="bold"
          color={transaction.amount > 0 ? 'green.500' : 'red.500'}
        >
          {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount || 0).toLocaleString('en-IN')}
        </Text>
      </HStack>
    </TouchableOpacity>
  );

  // Helper to get category name
  const getCategoryName = (categoryId: string): string => {
    if (!categories) return categoryId;
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  // Helper to get category icon
  const getCategoryIcon = (categoryId: string): string => {
    if (!categories) return 'receipt-outline';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.icon : 'receipt-outline';
  };

  // Helper to format dates
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' });
  };

  // Filter transactions based on active tab
  const filteredTransactions = transactions 
    ? transactions.filter(t => {
        if (activeTab === 'all') return true;
        return t.type === activeTab;
      }).slice(0, 5)
    : [];

  // Show loading state while fetching initial data
  if ((transactionsLoading || categoriesLoading) && !transactions && !isRefreshing) {
    return <LoadingState fullScreen message="Loading dashboard..." />;
  }

  // Show error state if we failed to fetch data
  if ((transactionsError || categoriesError) && !transactions) {
    return (
      <ErrorState 
        error={transactionsError || categoriesError}
        onRetry={onRefresh}
        fullScreen
      />
    );
  }

  const categoryTotals = calculateCategoryTotals();
  const topCategories = Object.values(categoryTotals)
    .sort((a: CategoryTotal, b: CategoryTotal) => b.spent - a.spent)
    .slice(0, 3);

  return (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
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
          <Text fontSize="3xl" fontWeight="bold">{formatCurrency(calculateTotalBalance())}</Text>
          
          {transactions && transactions.length > 0 && (
            <HStack mt={3} space={2} alignItems="center">
              <Icon as={Ionicons} name="arrow-up-circle" color="green.500" size="sm" />
              <Text color="green.500" fontWeight="medium">Recent activity</Text>
            </HStack>
          )}
        </Box>
        
        {/* Spending Analysis */}
        <Heading size="md" mb={4}>Spending Analysis</Heading>
        <Box mb={5}>
          <LineChart
            data={getChartData()}
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
          {topCategories.length > 0 ? (
            <VStack space={4}>
              {topCategories.map((category: CategoryTotal, index: number) => (
                <React.Fragment key={index}>
                  <HStack justifyContent="space-between">
                    <HStack alignItems="center" space={2}>
                      <Icon as={Ionicons} name={category.icon || "help-circle"} size="sm" color={category.color || "blue.500"} />
                      <Text>{category.name}</Text>
                    </HStack>
                    <Text>₹{category.spent.toLocaleString('en-IN')} {category.budget ? `/ ₹${category.budget.toLocaleString('en-IN')}` : ''}</Text>
                  </HStack>
                  <Progress 
                    value={safeNumber(category.budget ? (category.spent / category.budget) * 100 : 100)} 
                    colorScheme={getCategoryColorScheme(category.color)} 
                  />
                </React.Fragment>
              ))}
            </VStack>
          ) : (
            <Box alignItems="center" py={4}>
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                No budget data available
              </Text>
            </Box>
          )}
        </Box>
        
        {/* Recent Transactions */}
        <HStack justifyContent="space-between" alignItems="center" mb={2}>
          <Heading size="md">Recent Transactions</Heading>
          <Pressable 
            onPress={() => navigation.navigate('AllTransactions')}
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
        
        {/* Transaction List */}
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

// Helper function to get category color scheme
const getCategoryColorScheme = (color: string): string => {
  switch (color) {
    case 'orange.500': return 'orange';
    case 'violet.500': return 'violet';
    case 'blue.500': return 'blue';
    case 'green.500': return 'green';
    case 'red.500': return 'red';
    case 'yellow.500': return 'yellow';
    case 'purple.500': return 'purple';
    default: return 'blue';
  }
};

export default DashboardScreen;
