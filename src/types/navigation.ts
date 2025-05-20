import { NavigationProp, RouteProp } from '@react-navigation/native';

// Define the root stack parameter list with all possible screens and their params
export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  
  // Dashboard screens
  DashboardTab: undefined;
  Dashboard: undefined;
  TransactionDetails: { transaction: any };
  AddTransaction: { transactionToEdit?: any };
  CategoryBreakdown: undefined;
  AllTransactions: undefined;
  BudgetTracker: undefined;
  ScanReceipt: undefined;
  
  // Reminders screens
  RemindersTab: undefined;
  Reminders: undefined;
  ReminderDetail: { reminder: any };
  AddReminder: { reminderToEdit?: any };
  
  // Split expenses screens
  SplitTab: undefined;
  SplitExpenses: undefined;
  Groups: undefined;
  GroupDetail: { groupId: string, groupName: string };
  CreateGroup: undefined;
  AddExpense: { groupId?: string, initialData?: any, friend?: any, groupName?: string };
  Friends: undefined;
  FriendRequests: undefined;
  QRCodeScanner: undefined;
  InviteMembers: { groupId: string, groupName?: string };
  PaymentMethods: { 
    amount: number, 
    friendName: string, 
    isReceiving: boolean, 
    groupId?: string, 
    groupName?: string,
    friendId?: string,
    expenseId?: string
  };
  GroupChat: { groupId: string, groupName: string };
  
  // Settings screens
  SettingsTab: undefined;
  Settings: undefined;
  Account: undefined;
  NotificationsSettings: undefined;
  ConnectedAccounts: undefined;
  Subscription: undefined;
  Analytics: undefined;
  APISettings: undefined;
};

// Create types for navigation and route props
export type NavigationProps = NavigationProp<RootStackParamList>;
export type RouteProps<RouteName extends keyof RootStackParamList> = RouteProp<
  RootStackParamList,
  RouteName
>;
