// Helper utilities for handling demo/sample data when live data isn't available
// This is especially useful during development and testing

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group, Expense, Friend } from '../types';

// Key to determine if we should use demo data
const DEMO_DATA_ENABLED_KEY = 'demo_data_enabled';

// Sample groups data
export const sampleGroups: Group[] = [
  {
    id: 'demo-group-1',
    name: 'Weekend Trip',
    description: 'Trip to California',
    type: 'trip',
    members: ['current-user', 'friend-1', 'friend-2'],
    owedByYou: 120.50,
    owedToYou: 0,
    totalExpenses: 450.75,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    createdBy: 'current-user',
    isArchived: false
  },
  {
    id: 'demo-group-2',
    name: 'Apartment Expenses',
    description: 'Monthly apartment bills and supplies',
    type: 'apartment',
    members: ['current-user', 'friend-3', 'friend-4'],
    owedByYou: 0,
    owedToYou: 85.25,
    totalExpenses: 320.40,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    createdBy: 'friend-3',
    isArchived: false
  },
  {
    id: 'demo-group-3',
    name: 'Dinner Group',
    description: 'Weekly dinner outings',
    type: 'others',
    members: ['current-user', 'friend-1', 'friend-5'],
    owedByYou: 45.30,
    owedToYou: 0,
    totalExpenses: 245.75,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    createdBy: 'friend-5',
    isArchived: false
  }
];

// Sample expenses data
export const sampleExpenses: Expense[] = [
  {
    id: 'demo-expense-1',
    groupId: 'demo-group-1',
    title: 'Hotel Payment',
    amount: 250.00,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    paidBy: 'current-user',
    category: 'accommodation',
    splitType: 'equal',
    participants: ['current-user', 'friend-1', 'friend-2'],
    shares: {
      'current-user': 83.33,
      'friend-1': 83.33,
      'friend-2': 83.34
    },
    notes: 'Two nights at Marriott',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'demo-expense-2',
    groupId: 'demo-group-1',
    title: 'Dinner',
    amount: 120.50,
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    paidBy: 'friend-1',
    category: 'food',
    splitType: 'equal',
    participants: ['current-user', 'friend-1', 'friend-2'],
    shares: {
      'current-user': 40.17,
      'friend-1': 40.17,
      'friend-2': 40.16
    },
    notes: 'Seafood restaurant',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  }
];

// Sample friends data
export const sampleFriends: Friend[] = [
  {
    id: 'friend-1',
    userId: 'friend-1',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    photoURL: null,
    owedByYou: 120.50,
    owedToYou: 0,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'friend-2',
    userId: 'friend-2',
    name: 'Jamie Smith',
    email: 'jamie@example.com',
    photoURL: null,
    owedByYou: 0,
    owedToYou: 83.34,
    createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'friend-3',
    userId: 'friend-3',
    name: 'Taylor Rodriguez',
    email: 'taylor@example.com',
    photoURL: null,
    owedByYou: 0,
    owedToYou: 45.25,
    createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'friend-4',
    userId: 'friend-4',
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    photoURL: null,
    owedByYou: 0,
    owedToYou: 40.00,
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'friend-5',
    userId: 'friend-5',
    name: 'Casey Williams',
    email: 'casey@example.com',
    photoURL: null,
    owedByYou: 45.30,
    owedToYou: 0,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  }
];

// Function to check if demo data is enabled
export const isDemoDataEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(DEMO_DATA_ENABLED_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking demo data status:', error);
    return false;
  }
};

// Function to enable demo data
export const enableDemoData = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(DEMO_DATA_ENABLED_KEY, 'true');
  } catch (error) {
    console.error('Error enabling demo data:', error);
  }
};

// Function to disable demo data
export const disableDemoData = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(DEMO_DATA_ENABLED_KEY, 'false');
  } catch (error) {
    console.error('Error disabling demo data:', error);
  }
};
