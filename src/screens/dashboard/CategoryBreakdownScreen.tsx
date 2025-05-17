import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { Box, Text, VStack, HStack, Heading, Icon, Progress, Select, useColorMode } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

// Mock data for demonstration
const categoryData = {
  Food: { amount: 4500, color: '#FF6384', icon: 'fast-food-outline' },
  Entertainment: { amount: 1200, color: '#36A2EB', icon: 'film-outline' },
  Shopping: { amount: 3500, color: '#FFCE56', icon: 'cart-outline' },
  Bills: { amount: 5800, color: '#4BC0C0', icon: 'flash-outline' },
  Transport: { amount: 2000, color: '#9966FF', icon: 'car-outline' },
};

const CategoryBreakdownScreen = () => {
  const { colorMode } = useColorMode();
  const [timeRange, setTimeRange] = useState('monthly');
  
  const screenWidth = Dimensions.get('window').width - 40;
  const totalSpending = Object.values(categoryData).reduce((sum, cat) => sum + cat.amount, 0);
  
  // Prepare chart data
  const chartData = Object.entries(categoryData).map(([category, data]) => {
    return {
      name: category,
      amount: data.amount,
      color: data.color,
      legendFontColor: colorMode === 'dark' ? '#FFFFFF' : '#000000',
      legendFontSize: 12,
    };
  });

  return (
    <ScrollView>
      <Box p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <HStack justifyContent="space-between" alignItems="center" mb={4}>
          <Heading size="lg">Spending by Category</Heading>
          <Select
            selectedValue={timeRange}
            width="120px"
            accessibilityLabel="Choose Time Range"
            onValueChange={(value) => setTimeRange(value)}
            _selectedItem={{
              bg: 'primary.100',
            }}
          >
            <Select.Item label="Weekly" value="weekly" />
            <Select.Item label="Monthly" value="monthly" />
            <Select.Item label="Yearly" value="yearly" />
          </Select>
        </HStack>
        
        {/* Pie Chart */}
        <Box 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
          borderRadius="lg"
          p={4}
          mb={5}
          alignItems="center"
          shadow={2}
        >
          <PieChart
            data={chartData}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundColor: colorMode === 'dark' ? '#232323' : '#F9F9F9',
              backgroundGradientFrom: colorMode === 'dark' ? '#232323' : '#F9F9F9',
              backgroundGradientTo: colorMode === 'dark' ? '#232323' : '#F9F9F9',
              color: () => colorMode === 'dark' ? '#FFFFFF' : '#000000',
            }}
            accessor={"amount"}
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
          
          <Box mt={3} alignItems="center">
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Total Spending
            </Text>
            <Text fontSize="2xl" fontWeight="bold">₹{totalSpending.toLocaleString()}</Text>
          </Box>
        </Box>
        
        {/* Category List */}
        <Heading size="md" mb={4}>Categories</Heading>
        <VStack space={4}>
          {Object.entries(categoryData).map(([category, data]) => (
            <Box 
              key={category}
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
              borderRadius="lg"
              p={4}
              shadow={1}
            >
              <HStack justifyContent="space-between" alignItems="center" mb={2}>
                <HStack space={3} alignItems="center">
                  <Box 
                    p={2} 
                    borderRadius="full"
                    bg={`${data.color}20`} // Transparent background based on category color
                  >
                    <Icon 
                      as={Ionicons} 
                      name={data.icon} 
                      size="md" 
                      color={data.color}
                    />
                  </Box>
                  <VStack>
                    <Text fontWeight="medium">{category}</Text>
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                      {((data.amount / totalSpending) * 100).toFixed(1)}% of total
                    </Text>
                  </VStack>
                </HStack>
                <Text fontWeight="bold">₹{data.amount.toLocaleString()}</Text>
              </HStack>
              
              <Progress 
                value={(data.amount / totalSpending) * 100} 
                backgroundColor={`${data.color}30`}
                _filledTrack={{
                  bg: data.color
                }}
              />
            </Box>
          ))}
        </VStack>
      </Box>
    </ScrollView>
  );
};

export default CategoryBreakdownScreen;
