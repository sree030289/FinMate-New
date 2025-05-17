import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Pressable,
  Progress,
  useColorMode,
  ScrollView,
  Divider,
  Button,
  Modal,
  FormControl,
  Input,
  useToast,
  IconButton,
  Menu
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Sample budget data
const initialBudgets = [
  {
    id: '1',
    category: 'Food',
    icon: 'fast-food-outline',
    budget: 10000,
    spent: 7500,
    color: 'orange.500'
  },
  {
    id: '2',
    category: 'Shopping',
    icon: 'cart-outline',
    budget: 8000,
    spent: 6000,
    color: 'blue.500'
  },
  {
    id: '3',
    category: 'Entertainment',
    icon: 'film-outline',
    budget: 3000,
    spent: 2900,
    color: 'violet.500'
  },
  {
    id: '4',
    category: 'Transportation',
    icon: 'car-outline',
    budget: 5000,
    spent: 2500,
    color: 'green.500'
  },
  {
    id: '5',
    category: 'Utilities',
    icon: 'flash-outline',
    budget: 4000,
    spent: 3800,
    color: 'red.500'
  },
  {
    id: '6',
    category: 'Healthcare',
    icon: 'medical-outline',
    budget: 2000,
    spent: 500,
    color: 'teal.500'
  }
];

// Category options
const categoryOptions = [
  { icon: 'fast-food-outline', name: 'Food', color: 'orange.500' },
  { icon: 'cart-outline', name: 'Shopping', color: 'blue.500' },
  { icon: 'film-outline', name: 'Entertainment', color: 'violet.500' },
  { icon: 'car-outline', name: 'Transportation', color: 'green.500' },
  { icon: 'flash-outline', name: 'Utilities', color: 'red.500' },
  { icon: 'medical-outline', name: 'Healthcare', color: 'teal.500' },
  { icon: 'home-outline', name: 'Housing', color: 'yellow.500' },
  { icon: 'school-outline', name: 'Education', color: 'cyan.500' },
  { icon: 'airplane-outline', name: 'Travel', color: 'pink.500' },
  { icon: 'shirt-outline', name: 'Clothing', color: 'purple.500' }
];

const BudgetTrackerScreen = () => {
  const { colorMode } = useColorMode();
  const navigation = useNavigation();
  const toast = useToast();

  const [budgets, setBudgets] = useState(initialBudgets);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<any>(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [timeFrame, setTimeFrame] = useState('monthly');

  // For budget overview
  const totalBudget = budgets.reduce((sum, item) => sum + item.budget, 0);
  const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0);
  const overallPercentage = Math.round((totalSpent / totalBudget) * 100);

  const handleAddBudget = () => {
    if (!selectedCategory) {
      toast.show({
        title: "Error",
        description: "Please select a category",
        status: "error"
      });
      return;
    }

    if (!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0) {
      toast.show({
        title: "Error",
        description: "Please enter a valid budget amount",
        status: "error"
      });
      return;
    }

    const categoryDetails = categoryOptions.find(c => c.name === selectedCategory);
    
    if (!categoryDetails) return;
    
    const existingBudget = budgets.find(b => b.category === selectedCategory);
    
    if (existingBudget) {
      setBudgets(budgets.map(b => 
        b.id === existingBudget.id 
          ? { ...b, budget: Number(budgetAmount) }
          : b
      ));
    } else {
      const newBudget = {
        id: Date.now().toString(),
        category: selectedCategory,
        icon: categoryDetails.icon,
        budget: Number(budgetAmount),
        spent: 0,
        color: categoryDetails.color
      };
      
      setBudgets([...budgets, newBudget]);
    }
    
    setShowAddModal(false);
    setSelectedCategory(null);
    setBudgetAmount('');
    
    toast.show({
      title: "Success",
      description: "Budget added successfully",
      status: "success"
    });
  };

  const handleEditBudget = () => {
    if (!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0) {
      toast.show({
        title: "Error",
        description: "Please enter a valid budget amount",
        status: "error"
      });
      return;
    }
    
    if (!selectedBudget) return;
    
    setBudgets(budgets.map(b => 
      b.id === selectedBudget.id 
        ? { ...b, budget: Number(budgetAmount) }
        : b
    ));
    
    setShowEditModal(false);
    setBudgetAmount('');
    
    toast.show({
      title: "Success",
      description: "Budget updated successfully",
      status: "success"
    });
  };

  const deleteBudget = (id: string) => {
    setBudgets(budgets.filter(b => b.id !== id));
    
    toast.show({
      title: "Success",
      description: "Budget deleted successfully",
      status: "info"
    });
  };

  const openEditModal = (budget: any) => {
    setSelectedBudget(budget);
    setBudgetAmount(budget.budget.toString());
    setShowEditModal(true);
  };

  return (
    <ScrollView bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      <Box p={5}>
        <HStack justifyContent="space-between" alignItems="center" mb={5}>
          <Heading size="lg">Budget Tracker</Heading>
          <Button 
            leftIcon={<Icon as={Ionicons} name="add" size="sm" />}
            onPress={() => setShowAddModal(true)}
          >
            Add Budget
          </Button>
        </HStack>
        
        {/* Budget Overview */}
        <Box 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
          borderRadius="lg"
          p={5}
          mb={6}
          shadow={1}
        >
          <HStack justifyContent="space-between" alignItems="center" mb={2}>
            <Heading size="md">Monthly Overview</Heading>
            <HStack space={2} alignItems="center">
              <Text color={overallPercentage > 85 ? 'red.500' : 'green.500'} fontWeight="bold">
                {overallPercentage}%
              </Text>
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>used</Text>
            </HStack>
          </HStack>
          
          <Progress 
            value={overallPercentage} 
            colorScheme={overallPercentage > 85 ? 'red' : 'green'} 
            mb={4}
          />
          
          <HStack justifyContent="space-between" mt={2}>
            <VStack>
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                Total Budget
              </Text>
              <Text fontSize="xl" fontWeight="bold">₹{totalBudget.toLocaleString()}</Text>
            </VStack>
            
            <VStack alignItems="flex-end">
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                Spent So Far
              </Text>
              <Text fontSize="xl" fontWeight="bold">₹{totalSpent.toLocaleString()}</Text>
            </VStack>
          </HStack>
          
          <HStack justifyContent="flex-end" mt={2}>
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Remaining: <Text fontWeight="bold" color={totalBudget - totalSpent > 0 ? 'green.500' : 'red.500'}>
                ₹{(totalBudget - totalSpent).toLocaleString()}
              </Text>
            </Text>
          </HStack>
        </Box>
        
        {/* Category Budgets */}
        <Heading size="md" mb={4}>Category Budgets</Heading>
        
        {budgets.length === 0 ? (
          <Box 
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            borderRadius="lg"
            p={5}
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={Ionicons} name="wallet-outline" size="6xl" color="gray.400" mb={4} />
            <Heading size="sm" textAlign="center" color="gray.400">No Budgets Set</Heading>
            <Text textAlign="center" color="gray.400" mt={2} mb={6}>
              Start by setting up budgets for your spending categories
            </Text>
            <Button 
              leftIcon={<Icon as={Ionicons} name="add-circle-outline" size="sm" />}
              onPress={() => setShowAddModal(true)}
            >
              Add Your First Budget
            </Button>
          </Box>
        ) : (
          <VStack space={4}>
            {budgets.map(budget => {
              const percentage = Math.round((budget.spent / budget.budget) * 100);
              const isOverBudget = percentage > 100;
              
              return (
                <Box 
                  key={budget.id}
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
                        bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                      >
                        <Icon 
                          as={Ionicons} 
                          name={budget.icon} 
                          size="md" 
                          color={budget.color}
                        />
                      </Box>
                      <Text fontWeight="medium">{budget.category}</Text>
                    </HStack>
                    
                    <Menu trigger={triggerProps => {
                      return (
                        <IconButton
                          {...triggerProps}
                          icon={<Icon as={Ionicons} name="ellipsis-vertical" />}
                          borderRadius="full"
                          variant="ghost"
                        />
                      );
                    }}>
                      <Menu.Item onPress={() => openEditModal(budget)}>Edit</Menu.Item>
                      <Menu.Item onPress={() => deleteBudget(budget.id)}>Delete</Menu.Item>
                    </Menu>
                  </HStack>
                  
                  <HStack justifyContent="space-between" alignItems="center" mb={1}>
                    <Text 
                      fontSize="xs" 
                      color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}
                    >
                      ₹{budget.spent.toLocaleString()} of ₹{budget.budget.toLocaleString()}
                    </Text>
                    <Text 
                      fontSize="xs" 
                      fontWeight="bold"
                      color={
                        percentage > 90 ? 'red.500' : 
                        percentage > 75 ? 'orange.500' : 'green.500'
                      }
                    >
                      {percentage}%
                    </Text>
                  </HStack>
                  
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    colorScheme={
                      percentage > 90 ? 'red' : 
                      percentage > 75 ? 'orange' : 'green'
                    } 
                  />
                  
                  {isOverBudget && (
                    <HStack alignItems="center" space={1} mt={1}>
                      <Icon as={Ionicons} name="alert-circle" color="red.500" size="xs" />
                      <Text fontSize="xs" color="red.500">
                        Over budget by ₹{(budget.spent - budget.budget).toLocaleString()}
                      </Text>
                    </HStack>
                  )}
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>
      
      {/* Add Budget Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)}>
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Add Budget</Modal.Header>
          <Modal.Body>
            <FormControl mb={4}>
              <FormControl.Label>Category</FormControl.Label>
              <Box maxHeight={150}>
                <ScrollView>
                  <VStack space={2}>
                    {categoryOptions.map((category) => (
                      <Pressable
                        key={category.name}
                        onPress={() => setSelectedCategory(category.name)}
                        bg={selectedCategory === category.name 
                          ? (colorMode === 'dark' ? 'primary.700' : 'primary.100') 
                          : 'transparent'
                        }
                        p={2}
                        borderRadius="md"
                      >
                        <HStack space={3} alignItems="center">
                          <Icon as={Ionicons} name={category.icon} color={category.color} />
                          <Text>{category.name}</Text>
                        </HStack>
                      </Pressable>
                    ))}
                  </VStack>
                </ScrollView>
              </Box>
            </FormControl>
            
            <FormControl>
              <FormControl.Label>Budget Amount</FormControl.Label>
              <Input
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                InputLeftElement={
                  <Text ml={2}>₹</Text>
                }
              />
            </FormControl>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onPress={handleAddBudget}>
                Save
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
      
      {/* Edit Budget Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Edit {selectedBudget?.category} Budget</Modal.Header>
          <Modal.Body>
            <HStack space={3} alignItems="center" mb={4}>
              <Box 
                p={2} 
                borderRadius="full"
                bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
              >
                <Icon 
                  as={Ionicons} 
                  name={selectedBudget?.icon} 
                  size="md" 
                  color={selectedBudget?.color}
                />
              </Box>
              <Text fontWeight="medium">{selectedBudget?.category}</Text>
            </HStack>
            
            <FormControl>
              <FormControl.Label>Budget Amount</FormControl.Label>
              <Input
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                InputLeftElement={
                  <Text ml={2}>₹</Text>
                }
              />
              <FormControl.HelperText>
                Current spending: ₹{selectedBudget?.spent.toLocaleString()}
              </FormControl.HelperText>
            </FormControl>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button onPress={handleEditBudget}>
                Update
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default BudgetTrackerScreen;
