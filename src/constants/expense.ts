// src/constants/expense.ts

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'restaurant' },
  { id: 'transportation', name: 'Transportation', icon: 'car' },
  { id: 'entertainment', name: 'Entertainment', icon: 'film' },
  { id: 'shopping', name: 'Shopping', icon: 'cart' },
  { id: 'housing', name: 'Housing', icon: 'home' },
  { id: 'travel', name: 'Travel', icon: 'airplane' },
  { id: 'utilities', name: 'Utilities', icon: 'flash' },
  { id: 'healthcare', name: 'Healthcare', icon: 'medical' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

export const GROUP_TYPES = [
  { id: 'trip', name: 'Trip', icon: 'airplane-outline' },
  { id: 'home', name: 'Home', icon: 'home-outline' },
  { id: 'couple', name: 'Couple', icon: 'heart-outline' },
  { id: 'other', name: 'Other', icon: 'list-outline' },
];

export const PAYMENT_METHODS = [
  {
    id: 'upi',
    title: 'UPI',
    icon: 'phone-portrait-outline',
    description: 'Direct bank transfer using UPI',
    providers: [
      { id: 'gpay', name: 'Google Pay', icon: 'logo-google' },
      { id: 'phonepe', name: 'PhonePe', icon: 'phone-portrait' },
      { id: 'paytm', name: 'Paytm', icon: 'wallet' }
    ]
  },
  {
    id: 'bank',
    title: 'Bank Transfer',
    icon: 'card-outline',
    description: 'Transfer directly to bank account',
    requiresAccountDetails: true
  },
  {
    id: 'cash',
    title: 'Cash',
    icon: 'cash-outline',
    description: 'Record a cash payment'
  }
];

export const ACTIVITY_TYPES = {
  EXPENSE_ADDED: 'expense_added',
  EXPENSE_EDITED: 'expense_edited',
  EXPENSE_DELETED: 'expense_deleted',
  PAYMENT_MADE: 'payment_made',
  PAYMENT_RECEIVED: 'payment_received',
  GROUP_CREATED: 'group_created',
  GROUP_JOINED: 'group_joined',
  FRIEND_ADDED: 'friend_added',
  SETTLEMENT_COMPLETED: 'settlement_completed'
};

export const SPLIT_TYPES = {
  EQUAL: 'equal',
  CUSTOM: 'custom',
  PERCENTAGE: 'percentage',
  SHARES: 'shares'
};