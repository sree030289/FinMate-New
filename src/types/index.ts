// User-related types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  createdAt: Date;
  isPremium: boolean;
}

// Transaction-related types
export interface Transaction {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  paymentMethod?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: Date;
}

// Category types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  budget?: number;
}

// Reminder-related types
export interface Reminder {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  paid: boolean;
  recurring: boolean;
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  notificationTime?: string;
  icon: string;
  notes?: string;
}

// Split expense-related types
export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  members: GroupMember[];
  avatar?: string;
  totalExpenses: number;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
  joinedAt: Date;
  isAdmin: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  paidBy: string;
  groupId?: string;
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  splits: ExpenseSplit[];
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
}

export interface ExpenseSplit {
  userId: string;
  name: string;
  amount: number;
  paid: boolean;
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  balance: number;
}

// Receipt scanning types
export interface ScanResultType {
  vendor: string;
  date: string;
  total: number;
  items: {
    name: string;
    price: number;
    quantity: number;
  }[];
  tax: number;
  imageUrl: string;
}

// Settings types
export interface NotificationSettings {
  reminderNotifications: boolean;
  dueDateAlerts: boolean;
  paymentConfirmations: boolean;
  newExpenses: boolean;
  friendRequests: boolean;
  marketingNotifications: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: string[];
  isActive: boolean;
}
