import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorMode, Icon } from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { auth, onAuthStateChanged } from '../services/firebase';
import { User } from 'firebase/auth';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';

// Dashboard Screen (Finance Tracking)
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import TransactionDetailsScreen from '../screens/dashboard/TransactionDetailsScreen';
import CategoryBreakdownScreen from '../screens/dashboard/CategoryBreakdownScreen';
import ScanReceiptScreen from '../screens/dashboard/ScanReceiptScreen';
import BudgetTrackerScreen from '../screens/dashboard/BudgetTrackerScreen';
import AddTransactionScreen from '../screens/dashboard/AddTransactionScreen';

// Bill Reminders
import RemindersScreen from '../screens/reminders/RemindersScreen';
import ReminderDetailScreen from '../screens/reminders/ReminderDetailScreen';
import AddReminderScreen from '../screens/reminders/AddReminderScreen';

// Split Expenses
import SplitExpensesScreen from '../screens/split/SplitExpensesScreen';
import GroupsScreen from '../screens/split/GroupsScreen';
import GroupDetailScreen from '../screens/split/GroupDetailScreen';
import CreateGroupScreen from '../screens/split/CreateGroupScreen';
import AddExpenseScreen from '../screens/split/AddExpenseScreen';
import FriendsScreen from '../screens/split/FriendsScreen';
import GroupChatScreen from '../screens/split/GroupChatScreen';
import InviteMembersScreen from '../screens/split/InviteMembersScreen';
import PaymentMethodsScreen from '../screens/split/PaymentMethodsScreen';

// Settings
import SettingsScreen from '../screens/settings/SettingsScreen';
import NotificationsSettingsScreen from '../screens/settings/NotificationsSettingsScreen';
import AccountScreen from '../screens/settings/AccountScreen';
import ConnectedAccountsScreen from '../screens/settings/ConnectedAccountsScreen';
import SubscriptionScreen from '../screens/settings/SubscriptionScreen';
import AnalyticsScreen from '../screens/settings/AnalyticsScreen';
import APISettingsScreen from '../screens/settings/APISettingsScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();
const RemindersStack = createNativeStackNavigator();
const SplitStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
      <DashboardStack.Screen name="TransactionDetails" component={TransactionDetailsScreen} options={{ title: 'Transaction Details' }} />
      <DashboardStack.Screen name="CategoryBreakdown" component={CategoryBreakdownScreen} options={{ title: 'Category Breakdown' }} />
      <DashboardStack.Screen name="ScanReceipt" component={ScanReceiptScreen} options={{ title: 'Scan Receipt' }} />
      <DashboardStack.Screen name="BudgetTracker" component={BudgetTrackerScreen} options={{ title: 'Budget Tracker' }} />
      <DashboardStack.Screen name="AddTransaction" component={AddTransactionScreen} options={{ title: 'Add Transaction' }} />
    </DashboardStack.Navigator>
  );
}

function RemindersStackNavigator() {
  return (
    <RemindersStack.Navigator>
      <RemindersStack.Screen name="Reminders" component={RemindersScreen} options={{ headerShown: false }} />
      <RemindersStack.Screen name="ReminderDetail" component={ReminderDetailScreen} options={{ title: 'Reminder Details' }} />
      <RemindersStack.Screen name="AddReminder" component={AddReminderScreen} options={{ title: 'Add Reminder' }} />
    </RemindersStack.Navigator>
  );
}

function SplitStackNavigator() {
  return (
    <SplitStack.Navigator>
      <SplitStack.Screen name="SplitExpenses" component={SplitExpensesScreen} options={{ headerShown: false }} />
      <SplitStack.Screen name="Groups" component={GroupsScreen} options={{ title: 'My Groups' }} />
      <SplitStack.Screen name="GroupDetail" component={GroupDetailScreen} options={({ route }) => ({ title: route.params?.groupName || 'Group' })} />
      <SplitStack.Screen name="CreateGroup" component={CreateGroupScreen} options={{ title: 'Create Group' }} />
      <SplitStack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
      <SplitStack.Screen name="Friends" component={FriendsScreen} options={{ title: 'Friends' }} />
      <SplitStack.Screen name="GroupChat" component={GroupChatScreen} options={({ route }) => ({ title: route.params?.groupName || 'Group Chat' })} />
      <SplitStack.Screen name="InviteMembers" component={InviteMembersScreen} options={{ title: 'Invite Members' }} />
      <SplitStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} options={{ title: 'Payment Methods' }} />
    </SplitStack.Navigator>
  );
}

function SettingsStackNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
      <SettingsStack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} options={{ title: 'Notification Settings' }} />
      <SettingsStack.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
      <SettingsStack.Screen name="APISettings" component={APISettingsScreen} options={{ title: 'OCR API Settings' }} />
      <SettingsStack.Screen name="ConnectedAccounts" component={ConnectedAccountsScreen} options={{ title: 'Connected Accounts' }} />
      <SettingsStack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Subscription' }} />
      <SettingsStack.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'AI Analytics' }} />
    </SettingsStack.Navigator>
  );
}

function TabNavigator() {
  const { colorMode } = useColorMode();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'DashboardTab') {
            iconName = focused ? 'pie-chart' : 'pie-chart-outline';
          } else if (route.name === 'RemindersTab') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'SplitTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          return <Icon as={Ionicons} name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'primary.500',
        tabBarInactiveTintColor: colorMode === 'dark' ? 'gray.400' : 'gray.500',
        tabBarStyle: { 
          backgroundColor: colorMode === 'dark' ? '#1A1A1A' : '#FFFFFF',
          borderTopColor: colorMode === 'dark' ? '#333333' : '#E0E0E0',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStackNavigator} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="RemindersTab" component={RemindersStackNavigator} options={{ title: 'Reminders' }} />
      <Tab.Screen name="SplitTab" component={SplitStackNavigator} options={{ title: 'Split' }} />
      <Tab.Screen name="SettingsTab" component={SettingsStackNavigator} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle user state changes
  const onAuthStateChanged = (authUser: User | null) => {
    console.log('Auth state changed:', authUser ? 'User logged in' : 'No user');
    setUser(authUser);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    console.log('MainNavigator useEffect running...');
    console.log('Auth object available:', auth ? 'YES' : 'NO');
    
    try {
      console.log('Setting up auth state listener...');
      const subscriber = auth.onAuthStateChanged(onAuthStateChanged);
      console.log('Auth listener set up successfully');
      return subscriber; // unsubscribe on unmount
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      setAuthError(error.message);
      return () => {};
    }
  }, []);

  if (initializing) return null;

  // If there's an error with auth, go straight to the auth screen
  if (authError) {
    console.error('Auth error detected:', authError);
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Auth" component={AuthStackNavigator} />
      </RootStack.Navigator>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <RootStack.Screen name="Main" component={TabNavigator} />
      ) : (
        <RootStack.Screen name="Auth" component={AuthStackNavigator} />
      )}
    </RootStack.Navigator>
  );
}
