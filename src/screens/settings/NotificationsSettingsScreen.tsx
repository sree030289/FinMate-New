import React, { useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Switch,
  Icon,
  Heading,
  useColorMode,
  Divider,
  ScrollView,
  Button,
  Select,
  CheckIcon,
  Radio,
  useToast
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationsSettingsScreen = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const navigation = useNavigation();
  
  // State for each notification category
  const [pushEnabled, setPushEnabled] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [billReminders, setBillReminders] = useState(true);
  const [expenseReminders, setExpenseReminders] = useState(true);
  const [settlementReminders, setSettlementReminders] = useState(true);
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [groupUpdates, setGroupUpdates] = useState(true);
  const [appUpdates, setAppUpdates] = useState(false);
  
  // Additional settings
  const [reminderTime, setReminderTime] = useState('1_day');
  const [reminderFrequency, setReminderFrequency] = useState('once');
  
  // Handle saving settings
  const handleSaveSettings = async () => {
    try {
      // In a real app, save to AsyncStorage and update backend
      await AsyncStorage.setItem('notification_settings', JSON.stringify({
        pushEnabled,
        transactionAlerts,
        billReminders,
        expenseReminders,
        settlementReminders,
        budgetAlerts,
        groupUpdates,
        appUpdates,
        reminderTime,
        reminderFrequency
      }));
      
      toast.show({
        title: "Settings Saved",
        description: "Your notification preferences have been updated",
        status: "success"
      });
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Failed to save notification settings",
        status: "error"
      });
    }
  };
  
  // Toggle all notifications
  const handleTogglePush = (value) => {
    setPushEnabled(value);
    
    if (!value) {
      // If turning off push notifications, disable all categories
      setTransactionAlerts(false);
      setBillReminders(false);
      setExpenseReminders(false);
      setSettlementReminders(false);
      setBudgetAlerts(false);
      setGroupUpdates(false);
      setAppUpdates(false);
    }
  };

  return (
    <ScrollView bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      <Box p={5}>
        <Heading size="lg" mb={6}>Notification Settings</Heading>
        
        {/* Main toggle */}
        <Box 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
          p={5} 
          borderRadius="lg"
          shadow={1}
          mb={5}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <Text fontSize="lg" fontWeight="bold">Push Notifications</Text>
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                {pushEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </VStack>
            <Switch
              isChecked={pushEnabled}
              onToggle={handleTogglePush}
              size="lg"
              colorScheme="primary"
            />
          </HStack>
        </Box>
        
        {/* Categories */}
        <Box 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
          p={5} 
          borderRadius="lg"
          shadow={1}
          mb={5}
          opacity={pushEnabled ? 1 : 0.6}
        >
          <Heading size="sm" mb={4}>Notification Categories</Heading>
          
          <VStack space={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Icon as={Ionicons} name="card-outline" color="primary.500" />
                <Text>Transaction Alerts</Text>
              </HStack>
              <Switch
                isChecked={pushEnabled && transactionAlerts}
                onToggle={setTransactionAlerts}
                isDisabled={!pushEnabled}
                colorScheme="primary"
              />
            </HStack>
            
            <Divider />
            
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Icon as={Ionicons} name="calendar-outline" color="primary.500" />
                <Text>Bill Reminders</Text>
              </HStack>
              <Switch
                isChecked={pushEnabled && billReminders}
                onToggle={setBillReminders}
                isDisabled={!pushEnabled}
                colorScheme="primary"
              />
            </HStack>
            
            <Divider />
            
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Icon as={Ionicons} name="receipt-outline" color="primary.500" />
                <Text>Expense Reminders</Text>
              </HStack>
              <Switch
                isChecked={pushEnabled && expenseReminders}
                onToggle={setExpenseReminders}
                isDisabled={!pushEnabled}
                colorScheme="primary"
              />
            </HStack>
            
            <Divider />
            
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Icon as={Ionicons} name="cash-outline" color="primary.500" />
                <Text>Settlement Reminders</Text>
              </HStack>
              <Switch
                isChecked={pushEnabled && settlementReminders}
                onToggle={setSettlementReminders}
                isDisabled={!pushEnabled}
                colorScheme="primary"
              />
            </HStack>
            
            <Divider />
            
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Icon as={Ionicons} name="pie-chart-outline" color="primary.500" />
                <Text>Budget Alerts</Text>
              </HStack>
              <Switch
                isChecked={pushEnabled && budgetAlerts}
                onToggle={setBudgetAlerts}
                isDisabled={!pushEnabled}
                colorScheme="primary"
              />
            </HStack>
            
            <Divider />
            
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Icon as={Ionicons} name="people-outline" color="primary.500" />
                <Text>Group Updates</Text>
              </HStack>
              <Switch
                isChecked={pushEnabled && groupUpdates}
                onToggle={setGroupUpdates}
                isDisabled={!pushEnabled}
                colorScheme="primary"
              />
            </HStack>
            
            <Divider />
            
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Icon as={Ionicons} name="megaphone-outline" color="primary.500" />
                <Text>App Updates & News</Text>
              </HStack>
              <Switch
                isChecked={pushEnabled && appUpdates}
                onToggle={setAppUpdates}
                isDisabled={!pushEnabled}
                colorScheme="primary"
              />
            </HStack>
          </VStack>
        </Box>
        
        {/* Reminder Settings */}
        <Box 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
          p={5} 
          borderRadius="lg"
          shadow={1}
          mb={5}
          opacity={pushEnabled ? 1 : 0.6}
        >
          <Heading size="sm" mb={4}>Reminder Settings</Heading>
          
          <VStack space={4}>
            <VStack>
              <Text mb={2}>When to send bill reminders</Text>
              <Radio.Group
                name="reminderTime"
                value={reminderTime}
                onChange={setReminderTime}
                isDisabled={!pushEnabled || !billReminders}
              >
                <VStack space={2}>
                  <Radio value="same_day" colorScheme="primary">
                    <Text>On the due date</Text>
                  </Radio>
                  <Radio value="1_day" colorScheme="primary">
                    <Text>1 day before</Text>
                  </Radio>
                  <Radio value="3_days" colorScheme="primary">
                    <Text>3 days before</Text>
                  </Radio>
                  <Radio value="7_days" colorScheme="primary">
                    <Text>1 week before</Text>
                  </Radio>
                </VStack>
              </Radio.Group>
            </VStack>
            
            <Divider />
            
            <VStack>
              <Text mb={2}>Reminder frequency</Text>
              <Radio.Group
                name="reminderFrequency"
                value={reminderFrequency}
                onChange={setReminderFrequency}
                isDisabled={!pushEnabled || !billReminders}
              >
                <VStack space={2}>
                  <Radio value="once" colorScheme="primary">
                    <Text>Once only</Text>
                  </Radio>
                  <Radio value="daily" colorScheme="primary">
                    <Text>Daily until paid</Text>
                  </Radio>
                </VStack>
              </Radio.Group>
            </VStack>
          </VStack>
        </Box>
        
        {/* Quiet Hours */}
        <Box 
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
          p={5} 
          borderRadius="lg"
          shadow={1}
          mb={5}
          opacity={pushEnabled ? 1 : 0.6}
        >
          <Heading size="sm" mb={4}>Quiet Hours</Heading>
          
          <HStack justifyContent="space-between" alignItems="center">
            <Text>Do Not Disturb</Text>
            <Switch
              isDisabled={!pushEnabled}
              colorScheme="primary"
            />
          </HStack>
          
          <HStack mt={4} justifyContent="space-between">
            <Box flex={1} mr={2}>
              <Text mb={1}>From</Text>
              <Select
                placeholder="10:00 PM"
                isDisabled={!pushEnabled}
              >
                <Select.Item label="9:00 PM" value="9pm" />
                <Select.Item label="10:00 PM" value="10pm" />
                <Select.Item label="11:00 PM" value="11pm" />
                <Select.Item label="12:00 AM" value="12am" />
              </Select>
            </Box>
            
            <Box flex={1} ml={2}>
              <Text mb={1}>To</Text>
              <Select
                placeholder="7:00 AM"
                isDisabled={!pushEnabled}
              >
                <Select.Item label="5:00 AM" value="5am" />
                <Select.Item label="6:00 AM" value="6am" />
                <Select.Item label="7:00 AM" value="7am" />
                <Select.Item label="8:00 AM" value="8am" />
              </Select>
            </Box>
          </HStack>
        </Box>
        
        <Button
          mt={2}
          leftIcon={<Icon as={Ionicons} name="save-outline" size="sm" />}
          onPress={handleSaveSettings}
        >
          Save Settings
        </Button>
      </Box>
    </ScrollView>
  );
};

export default NotificationsSettingsScreen;
