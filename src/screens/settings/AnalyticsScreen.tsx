import React, { useState, useEffect, useRef } from 'react';
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
  Pressable,
  Select,
  Modal,
  IconButton,
  Menu,
  useToast
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions, TouchableOpacity, Share, Platform } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import * as RNFS from 'react-native-fs';
import * as RNShare from 'react-native-share';

import * as analyticsService from '../../services/analyticsService';

const screenWidth = Dimensions.get('window').width - 40;

const AnalyticsScreen = () => {
  const { colorMode } = useColorMode();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('insights');
  const toast = useToast();
  
  // Date range selection
  const [selectedDateRange, setSelectedDateRange] = useState<analyticsService.DateRange | null>(
    analyticsService.DATE_RANGES.LAST_3_MONTHS
  );
  const [isCustomDateModalVisible, setIsCustomDateModalVisible] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  
  // Chart interactions
  const [activeChartIndex, setActiveChartIndex] = useState(-1);
  const [isZoomed, setIsZoomed] = useState(false);
  const scrollViewRef = useRef<any>(null);
  
  // Export options
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exportFormat, setExportFormat] = useState<analyticsService.ExportFormat>('csv');
  const [exportInProgress, setExportInProgress] = useState(false);
  
  // State for analytics data
  const [insights, setInsights] = useState<analyticsService.Insight[]>([]);
  const [spendingHistory, setSpendingHistory] = useState<analyticsService.SpendingData[]>([]);
  const [predictiveTrends, setPredictiveTrends] = useState<analyticsService.SpendingData[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<analyticsService.CategorySpending[]>([]);
  const [groupVsPersonal, setGroupVsPersonal] = useState<{ 
    personal: number, 
    group: number,
    personalPercentage: number,
    groupPercentage: number
  }>({ personal: 0, group: 0, personalPercentage: 50, groupPercentage: 50 });
  
  // Load data based on selected date range
  const loadAnalyticsData = async (dateRange: analyticsService.DateRange | null) => {
    setLoading(true);
    
    try {
      // Get months based on date range
      const months = dateRange ? 
        Math.ceil((dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)) : 
        6;
      
      // Load all analytics data
      const [
        insightsData,
        historyData,
        predictionsData,
        categoriesData,
        groupPersonalData
      ] = await Promise.all([
        analyticsService.generateInsights(),
        analyticsService.getSpendingHistory(months, false, dateRange),
        analyticsService.predictFutureSpending(3, dateRange),
        analyticsService.getCategoryBreakdown(months, true, dateRange),
        analyticsService.getGroupVsPersonalSpending(months, dateRange)
      ]);
      
      // Update state with real data
      setInsights(insightsData);
      setSpendingHistory(historyData);
      setPredictiveTrends(predictionsData);
      setCategoryBreakdown(categoriesData);
      setGroupVsPersonal(groupPersonalData);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      
      // In case of error, add some fallback insights
      setInsights([
        {
          id: 'error',
          title: 'Analytics Error',
          description: 'There was an error loading your analytics data. Please try again later.',
          icon: 'alert-circle',
          severity: 'alert'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Export analytics data
  const exportData = async (format: analyticsService.ExportFormat) => {
    try {
      setExportInProgress(true);
      
      // Generate the data for export
      const exportData = await analyticsService.exportAnalyticsData(format, selectedDateRange);
      
      if (Platform.OS === 'web') {
        // For web, create a download link
        const element = document.createElement('a');
        const file = new Blob([exportData], {
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });
        element.href = URL.createObjectURL(file);
        element.download = `finmate-analytics.${format}`;
        document.body.appendChild(element);
        element.click();
      } else {
        // For native platforms
        const path = `${RNFS.DocumentDirectoryPath}/finmate-analytics.${format}`;
        
        // Write the file
        await RNFS.writeFile(path, exportData, 'utf8');
        
        // Share the file
        await RNShare.default.open({
          title: 'Export FinMate Analytics',
          message: 'Here is your exported analytics data',
          url: `file://${path}`,
          type: format === 'csv' ? 'text/csv' : 'application/json'
        });
      }
      
      toast.show({
        title: "Export Successful",
        description: `Analytics data exported as ${format.toUpperCase()}`,
        status: "success"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.show({
        title: "Export Failed",
        description: "There was an error exporting your data",
        status: "error"
      });
    } finally {
      setExportInProgress(false);
      setShowExportOptions(false);
    }
  };
  
  // Set custom date range
  const setCustomRange = () => {
    if (customStartDate && customEndDate) {
      if (customEndDate < customStartDate) {
        toast.show({
          title: "Invalid Date Range",
          description: "End date must be after start date",
          status: "warning"
        });
        return;
      }
      
      const newRange: analyticsService.DateRange = {
        startDate: customStartDate,
        endDate: customEndDate,
        label: 'Custom Range'
      };
      
      setSelectedDateRange(newRange);
      setIsCustomDateModalVisible(false);
      loadAnalyticsData(newRange);
    }
  };
  
  // Chart interaction handlers
  const handleChartPress = (index: number) => {
    setActiveChartIndex(index);
    setIsZoomed(!isZoomed);
  };
  
  useEffect(() => {
    loadAnalyticsData(selectedDateRange);
  }, []);

  return (
    <ScrollView 
      bg={colorMode === 'dark' ? 'background.dark' : 'background.light'} 
      showsVerticalScrollIndicator={false}
    >
      <Box p={5}>
        <HStack justifyContent="space-between" alignItems="center" mb={6}>
          <Heading size="lg">AI Analytics</Heading>
          <HStack space={2}>
            <Button 
              size="sm" 
              leftIcon={<Icon as={Ionicons} name="refresh-outline" />} 
              variant="ghost"
              onPress={() => loadAnalyticsData(selectedDateRange)}
            >
              Refresh
            </Button>
            <Menu
              placement="bottom right"
              isOpen={showExportOptions}
              onClose={() => setShowExportOptions(false)}
              trigger={(triggerProps) => (
                <IconButton
                  {...triggerProps}
                  onPress={() => setShowExportOptions(true)}
                  icon={<Icon as={Ionicons} name="download-outline" />}
                  borderRadius="full"
                  variant="ghost"
                  size="sm"
                />
              )}
            >
              <Menu.Item onPress={() => exportData('csv')}>Export as CSV</Menu.Item>
              <Menu.Item onPress={() => exportData('json')}>Export as JSON</Menu.Item>
            </Menu>
          </HStack>
        </HStack>
        
        {/* Date range selector */}
        <Box mb={6}>
          <Text mb={2} fontSize="sm" fontWeight="medium">Date Range</Text>
          <HStack space={2}>
            <Select
              selectedValue={selectedDateRange?.label || "Last 3 Months"}
              minWidth="200"
              accessibilityLabel="Choose Date Range"
              _selectedItem={{
                bg: "primary.100",
                endIcon: <Icon as={Ionicons} name="checkmark" size="sm" />
              }}
              onValueChange={(itemValue) => {
                if (itemValue === "custom") {
                  setIsCustomDateModalVisible(true);
                } else {
                  const newRange = Object.values(analyticsService.DATE_RANGES).find(
                    range => range.label === itemValue
                  );
                  setSelectedDateRange(newRange || null);
                  loadAnalyticsData(newRange || null);
                }
              }}
            >
              {Object.values(analyticsService.DATE_RANGES).map(range => (
                <Select.Item 
                  key={range.label} 
                  label={range.label} 
                  value={range.label} 
                />
              ))}
              <Select.Item label="Custom Range" value="custom" />
            </Select>
            
            <Button
              leftIcon={<Icon as={Ionicons} name="filter-outline" />}
              onPress={() => setIsCustomDateModalVisible(true)}
            >
              Custom
            </Button>
          </HStack>
        </Box>
        
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
                
                {insights.length === 0 ? (
                  <Box 
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                    p={4} 
                    borderRadius="lg"
                    shadow={1}
                    alignItems="center"
                  >
                    <Icon as={Ionicons} name="analytics-outline" size="xl" color="gray.500" mb={3} />
                    <Text textAlign="center">
                      Not enough data to generate insights yet. Keep using the app!
                    </Text>
                  </Box>
                ) : (
                  insights.map(insight => (
                    <Box 
                      key={insight.id} 
                      bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                      p={4} 
                      borderRadius="lg"
                      shadow={1}
                      borderLeftWidth={4}
                      borderLeftColor={
                        insight.severity === 'success' ? 'green.500' : 
                        insight.severity === 'warning' ? 'yellow.500' : 
                        insight.severity === 'alert' ? 'red.500' : 'blue.500'
                      }
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
                          
                          {insight.action && (
                            <Button
                              size="sm"
                              mt={3}
                              alignSelf="flex-start"
                              leftIcon={<Icon as={Ionicons} name="arrow-forward" size="xs" />}
                              variant="ghost"
                            >
                              {insight.action}
                            </Button>
                          )}
                        </VStack>
                      </HStack>
                    </Box>
                  ))
                )}
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
                    
                    {predictiveTrends.length === 0 ? (
                      <Center p={4}>
                        <Icon as={Ionicons} name="calendar-outline" size="xl" color="gray.500" mb={3} />
                        <Text textAlign="center">
                          Not enough historical data to generate predictions.
                        </Text>
                      </Center>
                    ) : (
                      <HStack justifyContent="space-around" mt={2}>
                        {/* Show last 2 months of history + predictions */}
                        {[...spendingHistory.slice(-2), ...predictiveTrends].map((item, index) => {
                          const isHistory = index < 2;
                          const maxAmount = 20000; // For scaling
                          const amount = isHistory ? item.actual : (item.predicted || 0);
                          const percentage = Math.min((amount / maxAmount) * 100, 100);
                          
                          return (
                            <VStack key={index} alignItems="center">
                              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                                {item.month}
                                {isHistory ? ' (Actual)' : ' (Predicted)'}
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
                                  h={`${percentage}%`}
                                  bg={isHistory ? "blue.500" : "primary.500"}
                                />
                              </Box>
                              <Text fontWeight="bold" mt={2}>₹{amount.toLocaleString()}</Text>
                            </VStack>
                          );
                        })}
                      </HStack>
                    )}
                    
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
                    {categoryBreakdown.length === 0 ? (
                      <Center p={4}>
                        <Icon as={Ionicons} name="pie-chart-outline" size="xl" color="gray.500" mb={3} />
                        <Text textAlign="center">
                          No category data available yet. Start tracking your expenses!
                        </Text>
                      </Center>
                    ) : (
                      categoryBreakdown.map((category, index) => (
                        <HStack key={index} justifyContent="space-between" alignItems="center">
                          <HStack space={3} alignItems="center">
                            <Icon 
                              as={Ionicons} 
                              name={getCategoryIcon(category.category)} 
                              color="primary.500" 
                            />
                            <VStack>
                              <Text fontWeight="medium" textTransform="capitalize">
                                {category.category.replace('_', ' ')}
                              </Text>
                              <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                                {Math.round(category.percentage)}% of total
                              </Text>
                            </VStack>
                          </HStack>
                          
                          <HStack space={4} alignItems="center">
                            <Text>₹{category.amount.toLocaleString()}</Text>
                            {category.trend !== 'stable' && (
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
                                  {Math.abs(Math.round(category.changePercentage))}%
                                </Text>
                              </HStack>
                            )}
                          </HStack>
                        </HStack>
                      ))
                    )}
                  </VStack>
                </Box>
                
                <Heading size="md" mt={2}>Group vs. Personal Spending</Heading>
                
                <Box 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                  p={4} 
                  borderRadius="lg"
                  shadow={1}
                  mt={2}
                >
                  <VStack space={4}>
                    <Text>How your spending is distributed between personal and group expenses:</Text>
                    
                    {/* Bar chart visualization */}
                    <Box h={20} w="100%" position="relative" mt={2}>
                      {/* Personal spending bar */}
                      <Box 
                        position="absolute"
                        left={0}
                        top={0}
                        h="100%"
                        w={`${groupVsPersonal.personalPercentage}%`}
                        bg="blue.500"
                        borderLeftRadius="md"
                        borderRightRadius={groupVsPersonal.personalPercentage >= 99 ? "md" : 0}
                      />
                      
                      {/* Group spending bar */}
                      <Box 
                        position="absolute"
                        left={`${groupVsPersonal.personalPercentage}%`}
                        top={0}
                        h="100%"
                        w={`${groupVsPersonal.groupPercentage}%`}
                        bg="green.500"
                        borderRightRadius="md"
                        borderLeftRadius={groupVsPersonal.personalPercentage <= 1 ? "md" : 0}
                      />
                      
                      {/* Labels */}
                      <HStack 
                        position="absolute"
                        w="100%"
                        h="100%"
                        justifyContent="space-around"
                        alignItems="center"
                      >
                        <VStack alignItems="center">
                          <Text color="white" fontWeight="bold">
                            Personal
                          </Text>
                          <Text color="white" fontSize="xs">
                            ₹{groupVsPersonal.personal.toLocaleString()}
                          </Text>
                        </VStack>
                        
                        <VStack alignItems="center">
                          <Text color="white" fontWeight="bold">
                            Group
                          </Text>
                          <Text color="white" fontSize="xs">
                            ₹{groupVsPersonal.group.toLocaleString()}
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                    
                    <HStack justifyContent="space-between" mt={2}>
                      <Text fontSize="sm">
                        {Math.round(groupVsPersonal.personalPercentage)}% Personal
                      </Text>
                      <Text fontSize="sm">
                        {Math.round(groupVsPersonal.groupPercentage)}% Group
                      </Text>
                    </HStack>
                  </VStack>
                </Box>
                
                <Heading size="md" mt={6}>Spending Recommendations</Heading>
                
                <Box 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                  p={4} 
                  borderRadius="lg"
                  shadow={1}
                  mt={2}
                >
                  <VStack space={4}>
                    <HStack space={3} alignItems="center">
                      <Icon as={Ionicons} name="trending-down" color="green.500" size="md" />
                      <Text flex={1}>Based on your spending patterns, we recommend creating a budget of <Text fontWeight="bold">₹{Math.round((spendingHistory.reduce((sum, month) => sum + month.actual, 0) / Math.max(spendingHistory.length, 1)) * 0.9).toLocaleString()}</Text> per month.</Text>
                    </HStack>
                    
                    <Button
                      leftIcon={<Icon as={Ionicons} name="create-outline" />}
                      colorScheme="primary"
                    >
                      Create Budget Plan
                    </Button>
                  </VStack>
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

// Helper function to get icon name for a category
const getCategoryIcon = (category: string): string => {
  const icons = {
    food: 'restaurant',
    groceries: 'cart',
    shopping: 'bag-handle',
    entertainment: 'film',
    transportation: 'car',
    utilities: 'flash',
    healthcare: 'medical',
    education: 'school',
    personal_care: 'person',
    other: 'list',
  };
  
  return icons[category] || 'list';
};

export default AnalyticsScreen;
