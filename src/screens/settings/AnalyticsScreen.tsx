import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Button,
  Icon,
  useColorMode,
  ScrollView,
  Center,
  Spinner,
  Pressable
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

// Mock data for analytics
const insights = [
  {
    id: '1',
    title: 'Spending Patterns',
    description: 'Your food expenses have increased by 15% in the last month.',
    icon: 'restaurant',
    action: 'Create a budget for food'
  },
  {
    id: '2',
    title: 'Unusual Transactions',
    description: 'We detected a recurring charge of ₹399 that might be an unwanted subscription.',
    icon: 'alert-circle',
    action: 'Review subscription'
  },
  {
    id: '3',
    title: 'Savings Opportunity',
    description: 'Based on your coffee purchases, you could save ₹1,200 monthly by making coffee at home.',
    icon: 'cafe',
    action: 'See savings plan'
  },
  {
    id: '4',
    title: 'Bill Reminder',
    description: 'Your electricity bill is due in 3 days and is 20% higher than usual.',
    icon: 'flash',
    action: 'Set reminder'
  }
];

const predictiveTrends = [
  {
    month: 'Jun',
    predicted: 15000,
  },
  {
    month: 'Jul',
    predicted: 16500,
  },
  {
    month: 'Aug',
    predicted: 14200,
  }
];

const categoryInsights = [
  {
    category: 'Food',
    spending: 4500,
    trend: 'up',
    percent: 15
  },
  {
    category: 'Transport',
    spending: 2200,
    trend: 'down',
    percent: 8
  },
  {
    category: 'Entertainment',
    spending: 3800,
    trend: 'up',
    percent: 22
  }
];

const AnalyticsScreen = () => {
  const { colorMode } = useColorMode();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView 
      bg={colorMode === 'dark' ? 'background.dark' : 'background.light'} 
      showsVerticalScrollIndicator={false}
    >
      <Box p={5}>
        <HStack justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">AI Analytics</Heading>
          <Button size="sm" leftIcon={<Icon as={Ionicons} name="refresh-outline" />} variant="ghost">
            Refresh
          </Button>
        </HStack>
        
        {/* Premium badge */}
        <Box 
          bg={colorMode === 'dark' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(250, 204, 21, 0.1)'} 
          p={3} 
          borderRadius="lg"
          borderWidth={1}
          borderColor="amber.500"
          mb={6}
        >
          <HStack space={3} alignItems="center">
            <Icon as={Ionicons} name="star" size="md" color="amber.500" />
            <VStack flex={1}>
              <Text fontWeight="bold" color="amber.500">Premium Feature</Text>
              <Text fontSize="xs">
                AI-powered insights to help you understand your spending patterns and save money.
              </Text>
            </VStack>
          </HStack>
        </Box>
        
        {/* Tabs */}
        <HStack space={2} mb={6}>
          <Pressable 
            flex={1} 
            onPress={() => setActiveTab('insights')}
            bg={activeTab === 'insights' ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
            p={3}
            borderRadius="lg"
            alignItems="center"
          >
            <Text color={activeTab === 'insights' ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}>
              Insights
            </Text>
          </Pressable>
          
          <Pressable 
            flex={1} 
            onPress={() => setActiveTab('predictions')}
            bg={activeTab === 'predictions' ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
            p={3}
            borderRadius="lg"
            alignItems="center"
          >
            <Text color={activeTab === 'predictions' ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}>
              Predictions
            </Text>
          </Pressable>
          
          <Pressable 
            flex={1} 
            onPress={() => setActiveTab('categories')}
            bg={activeTab === 'categories' ? 'primary.500' : (colorMode === 'dark' ? 'card.dark' : 'card.light')}
            p={3}
            borderRadius="lg"
            alignItems="center"
          >
            <Text color={activeTab === 'categories' ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}>
              Categories
            </Text>
          </Pressable>
        </HStack>
        
        {loading ? (
          <Center p={10}>
            <Spinner size="lg" color="primary.500" />
            <Text mt={4}>Analyzing your financial data...</Text>
          </Center>
        ) : (
          <>
            {/* Insights Tab */}
            {activeTab === 'insights' && (
              <VStack space={4}>
                <Heading size="md">Smart Insights</Heading>
                
                {insights.map(insight => (
                  <Box 
                    key={insight.id} 
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                    p={4} 
                    borderRadius="lg"
                    shadow={1}
                  >
                    <HStack space={3}>
                      <Center 
                        bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                        p={2}
                        borderRadius="full"
                        h={12}
                        w={12}
                      >
                        <Icon as={Ionicons} name={insight.icon} size="md" color="primary.500" />
                      </Center>
                      
                      <VStack flex={1}>
                        <Text fontWeight="bold">{insight.title}</Text>
                        <Text fontSize="sm" mt={1} color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                          {insight.description}
                        </Text>
                        
                        <Button
                          size="sm"
                          mt={3}
                          alignSelf="flex-start"
                          leftIcon={<Icon as={Ionicons} name="arrow-forward" size="xs" />}
                          variant="ghost"
                        >
                          {insight.action}
                        </Button>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
            
            {/* Predictions Tab */}
            {activeTab === 'predictions' && (
              <VStack space={4}>
                <Heading size="md">Spending Predictions</Heading>
                
                <Box 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                  p={4} 
                  borderRadius="lg"
                  shadow={1}
                  mb={4}
                >
                  <VStack space={4}>
                    <Text fontWeight="medium">Based on your historical spending, we predict:</Text>
                    
                    <HStack justifyContent="space-around" mt={2}>
                      {predictiveTrends.map((item, index) => (
                        <VStack key={index} alignItems="center">
                          <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                            {item.month}
                          </Text>
                          <Box 
                            h={100} 
                            w={20} 
                            bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                            borderRadius="md"
                            mt={2}
                            position="relative"
                            overflow="hidden"
                          >
                            <Box 
                              position="absolute"
                              bottom={0}
                              w="full"
                              h={`${(item.predicted / 20000) * 100}%`}
                              bg="primary.500"
                            />
                          </Box>
                          <Text fontWeight="bold" mt={2}>₹{item.predicted.toLocaleString()}</Text>
                        </VStack>
                      ))}
                    </HStack>
                    
                    <Text fontSize="sm" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                      These predictions are based on your past 6 months of transactions and seasonal patterns.
                    </Text>
                  </VStack>
                </Box>
                
                <Heading size="md" mt={2}>Recommendations</Heading>
                
                <Box 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                  p={4} 
                  borderRadius="lg"
                  shadow={1}
                >
                  <VStack space={4}>
                    <HStack space={3} alignItems="center">
                      <Icon as={Ionicons} name="wallet-outline" color="amber.500" size="md" />
                      <Text fontWeight="medium">Suggested Monthly Budget: ₹25,000</Text>
                    </HStack>
                    
                    <HStack space={3} alignItems="center">
                      <Icon as={Ionicons} name="save-outline" color="green.500" size="md" />
                      <Text fontWeight="medium">Recommended Savings: ₹5,000/month</Text>
                    </HStack>
                    
                    <Button mt={2}>Create Budget Plan</Button>
                  </VStack>
                </Box>
              </VStack>
            )}
            
            {/* Categories Tab */}
            {activeTab === 'categories' && (
              <VStack space={4}>
                <Heading size="md">Category Insights</Heading>
                
                <Box 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                  p={4} 
                  borderRadius="lg"
                  shadow={1}
                >
                  <VStack space={4} divider={<Divider />}>
                    {categoryInsights.map((category, index) => (
                      <HStack key={index} justifyContent="space-between" alignItems="center">
                        <HStack space={3} alignItems="center">
                          <Icon 
                            as={Ionicons} 
                            name={
                              category.category === 'Food' ? 'restaurant' : 
                              category.category === 'Transport' ? 'car' : 'film'
                            } 
                            color="primary.500" 
                          />
                          <Text fontWeight="medium">{category.category}</Text>
                        </HStack>
                        
                        <HStack space={4} alignItems="center">
                          <Text>₹{category.spending.toLocaleString()}</Text>
                          <HStack space={1} alignItems="center">
                            <Icon 
                              as={Ionicons} 
                              name={category.trend === 'up' ? 'arrow-up' : 'arrow-down'} 
                              size="xs" 
                              color={category.trend === 'up' ? 'red.500' : 'green.500'} 
                            />
                            <Text 
                              fontSize="xs"
                              color={category.trend === 'up' ? 'red.500' : 'green.500'}
                            >
                              {category.percent}%
                            </Text>
                          </HStack>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
                
                <Heading size="md" mt={2}>Anomaly Detection</Heading>
                
                <Box 
                  bg={colorMode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'}
                  p={4} 
                  borderRadius="lg"
                  borderWidth={1}
                  borderColor="red.500"
                >
                  <HStack space={3} alignItems="center">
                    <Icon as={Ionicons} name="alert-circle" color="red.500" size="md" />
                    <VStack flex={1}>
                      <Text fontWeight="bold" color="red.500">Unusual Spending Detected</Text>
                      <Text fontSize="sm" mt={1}>
                        Your entertainment spending is 22% higher than your normal pattern. This might be affecting your savings goals.
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Button mt={4} colorScheme="red" variant="outline">
                    Review Entertainment Expenses
                  </Button>
                </Box>
                
                <Box 
                  bg={colorMode === 'dark' ? 'rgba(72, 187, 120, 0.1)' : 'rgba(72, 187, 120, 0.05)'}
                  p={4} 
                  borderRadius="lg"
                  mt={4}
                  borderWidth={1}
                  borderColor="green.500"
                >
                  <HStack space={3} alignItems="center">
                    <Icon as={Ionicons} name="checkmark-circle" color="green.500" size="md" />
                    <VStack flex={1}>
                      <Text fontWeight="bold" color="green.500">Good Job!</Text>
                      <Text fontSize="sm" mt={1}>
                        You've reduced your transportation expenses by 8%. Keep up the good work!
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            )}
          </>
        )}
      </Box>
    </ScrollView>
  );
};

// Helper component for divider
const Divider = () => {
  const { colorMode } = useColorMode();
  return <Box h="1px" w="100%" bg={colorMode === 'dark' ? 'border.dark' : 'border.light'} />;
};

export default AnalyticsScreen;
