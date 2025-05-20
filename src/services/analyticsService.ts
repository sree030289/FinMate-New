/**
 * Advanced Analytics Service for FinMate
 * Provides spending analysis, predictions, and insights
 */

import { auth, db } from './firebase';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  Timestamp
} from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

// Types
export type SpendingData = {
  month: string;
  year: number;
  actual: number;
  predicted?: number;
};

export type CategorySpending = {
  category: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
};

export type Insight = {
  id: string;
  title: string;
  description: string;
  category?: string;
  icon: string;
  severity: 'info' | 'warning' | 'alert' | 'success';
  action?: string;
};

// Date range for analytics
export type DateRange = {
  startDate: Date;
  endDate: Date;
  label: string;
};

// Export format options
export type ExportFormat = 'csv' | 'json' | 'pdf';

// Predefined date ranges
export const DATE_RANGES = {
  LAST_30_DAYS: {
    label: 'Last 30 Days',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  },
  LAST_3_MONTHS: {
    label: 'Last 3 Months',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    endDate: new Date()
  },
  LAST_6_MONTHS: {
    label: 'Last 6 Months',
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    endDate: new Date()
  },
  LAST_12_MONTHS: {
    label: 'Last Year',
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
    endDate: new Date()
  },
  YEAR_TO_DATE: {
    label: 'Year to Date',
    startDate: new Date(new Date().getFullYear(), 0, 1), // January 1st of current year
    endDate: new Date()
  }
};

/**
 * Get historical spending data with date range support
 */
export const getSpendingHistory = async (
  months = 6,
  includeIncome = false,
  customDateRange?: DateRange
): Promise<SpendingData[]> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  try {
    const result: SpendingData[] = [];
    const endDate = customDateRange ? customDateRange.endDate : new Date();
    const startDate = customDateRange 
      ? customDateRange.startDate 
      : new Date(new Date().setMonth(endDate.getMonth() - months));
    
    // Query transactions within date range
    const transactionsRef = collection(db, 'users', auth.currentUser.uid, 'transactions');
    const transactionsQuery = query(
      transactionsRef,
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0]),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(transactionsQuery);
    
    // Group by month and sum amounts
    const monthlyData: { [key: string]: number } = {};
    
    querySnapshot.forEach(doc => {
      const transaction = doc.data();
      const transactionDate = new Date(transaction.date);
      const monthYear = `${transactionDate.getFullYear()}-${transactionDate.getMonth() + 1}`;
      
      // Skip income transactions if not including income
      if (!includeIncome && transaction.amount > 0) {
        return;
      }
      
      // Add to monthly total (use absolute value for expenses)
      const amount = Math.abs(transaction.amount);
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + amount;
    });
    
    // Format result
    // If custom date range, determine the months to display
    const periodInMonths = customDateRange 
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)) 
      : months;
    
    for (let i = 0; i < periodInMonths; i++) {
      const date = new Date(endDate);
      date.setMonth(date.getMonth() - i);
      const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      result.unshift({
        month: monthNames[date.getMonth()],
        year: date.getFullYear(),
        actual: monthlyData[monthYear] || 0
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error getting spending history:', error);
    throw error;
  }
};

/**
 * Generate spending predictions based on historical data with date range support
 */
export const predictFutureSpending = async (
  months = 3,
  customDateRange?: DateRange
): Promise<SpendingData[]> => {
  try {
    // Get historical data
    const historicalData = await getSpendingHistory(6, false, customDateRange);
    
    if (historicalData.length === 0) {
      return [];
    }
    
    const result: SpendingData[] = [];
    const lastMonth = new Date();
    
    // Simple prediction model: average of last 3 months with 5% growth trend
    const lastThreeMonths = historicalData.slice(-3);
    const averageSpending = lastThreeMonths.reduce((sum, month) => sum + month.actual, 0) / lastThreeMonths.length;
    const monthlyGrowthFactor = 1.05; // 5% growth
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Generate predictions
    for (let i = 1; i <= months; i++) {
      const futureMonth = new Date();
      futureMonth.setMonth(lastMonth.getMonth() + i);
      
      result.push({
        month: monthNames[futureMonth.getMonth()],
        year: futureMonth.getFullYear(),
        predicted: Math.round(averageSpending * Math.pow(monthlyGrowthFactor, i))
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error predicting future spending:', error);
    return [];
  }
};

/**
 * Get spending breakdown by category with date range support
 */
export const getCategoryBreakdown = async (
  months = 3,
  compareWithPrevious = true,
  customDateRange?: DateRange
): Promise<CategorySpending[]> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  try {
    // Current period date range
    const endDate = customDateRange ? customDateRange.endDate : new Date();
    const startDate = customDateRange 
      ? customDateRange.startDate 
      : new Date(new Date().setMonth(endDate.getMonth() - months));
    
    // Previous period for comparison
    const periodInMs = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(prevEndDate.getTime() - periodInMs);
    
    // Query current period transactions
    const transactionsRef = collection(db, 'users', auth.currentUser.uid, 'transactions');
    const currentQuery = query(
      transactionsRef,
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0]),
      where('amount', '<', 0) // Only expenses
    );
    
    // Group by category for current period
    const currentCategories: { [category: string]: number } = {};
    let totalSpending = 0;
    
    const currentSnapshot = await getDocs(currentQuery);
    currentSnapshot.forEach(doc => {
      const transaction = doc.data();
      const category = transaction.category || 'other';
      const amount = Math.abs(transaction.amount);
      
      currentCategories[category] = (currentCategories[category] || 0) + amount;
      totalSpending += amount;
    });
    
    // If comparing with previous period
    const previousCategories: { [category: string]: number } = {};
    
    if (compareWithPrevious) {
      const previousQuery = query(
        transactionsRef,
        where('date', '>=', prevStartDate.toISOString().split('T')[0]),
        where('date', '<', startDate.toISOString().split('T')[0]),
        where('amount', '<', 0) // Only expenses
      );
      
      const prevSnapshot = await getDocs(previousQuery);
      prevSnapshot.forEach(doc => {
        const transaction = doc.data();
        const category = transaction.category || 'other';
        const amount = Math.abs(transaction.amount);
        
        previousCategories[category] = (previousCategories[category] || 0) + amount;
      });
    }
    
    // Format the result
    const result: CategorySpending[] = [];
    
    for (const [category, amount] of Object.entries(currentCategories)) {
      const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0;
      const previousAmount = previousCategories[category] || 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      let changePercentage = 0;
      
      if (compareWithPrevious && previousAmount > 0) {
        const change = amount - previousAmount;
        changePercentage = (change / previousAmount) * 100;
        
        if (changePercentage > 5) {
          trend = 'up';
        } else if (changePercentage < -5) {
          trend = 'down';
        }
      }
      
      result.push({
        category,
        amount,
        percentage,
        trend,
        changePercentage
      });
    }
    
    // Sort by amount (highest first)
    return result.sort((a, b) => b.amount - a.amount);
  } catch (error) {
    console.error('Error getting category breakdown:', error);
    return [];
  }
};

/**
 * Generate personalized financial insights
 */
export const generateInsights = async (): Promise<Insight[]> => {
  try {
    const insights: Insight[] = [];
    
    // Get data for analysis
    const recentSpending = await getSpendingHistory(3);
    const categoryBreakdown = await getCategoryBreakdown(3, true);
    
    // Insight 1: Unusual category spending
    const unusualCategories = categoryBreakdown.filter(cat => 
      cat.trend === 'up' && cat.changePercentage > 20
    );
    
    if (unusualCategories.length > 0) {
      const topUnusual = unusualCategories[0];
      
      insights.push({
        id: 'unusual_spending_' + topUnusual.category,
        title: 'Unusual Spending Pattern',
        description: `Your ${topUnusual.category} spending has increased by ${Math.round(topUnusual.changePercentage)}% compared to the previous period.`,
        category: topUnusual.category,
        icon: getCategoryIcon(topUnusual.category),
        severity: 'warning',
        action: 'Review Spending'
      });
    }
    
    // Insight 2: Good saving habits
    const savingCategories = categoryBreakdown.filter(cat => 
      cat.trend === 'down' && cat.changePercentage < -15
    );
    
    if (savingCategories.length > 0) {
      const topSaving = savingCategories[0];
      
      insights.push({
        id: 'good_saving_' + topSaving.category,
        title: 'Good Progress!',
        description: `You've reduced your ${topSaving.category} spending by ${Math.abs(Math.round(topSaving.changePercentage))}%. Keep it up!`,
        category: topSaving.category,
        icon: getCategoryIcon(topSaving.category),
        severity: 'success',
        action: 'See Details'
      });
    }
    
    // Insight 3: Monthly spending trend
    if (recentSpending.length >= 3) {
      const thisMonth = recentSpending[recentSpending.length - 1].actual;
      const lastMonth = recentSpending[recentSpending.length - 2].actual;
      const changePercent = ((thisMonth - lastMonth) / lastMonth) * 100;
      
      if (changePercent > 15) {
        insights.push({
          id: 'monthly_increase',
          title: 'Monthly Spending Increase',
          description: `Your spending this month is ${Math.round(changePercent)}% higher than last month.`,
          icon: 'trending-up',
          severity: 'alert',
          action: 'Create Budget'
        });
      } else if (changePercent < -10) {
        insights.push({
          id: 'monthly_decrease',
          title: 'Great Job Saving!',
          description: `You've spent ${Math.abs(Math.round(changePercent))}% less this month compared to last month.`,
          icon: 'trending-down',
          severity: 'success',
          action: 'See Savings'
        });
      }
    }
    
    // Insight 4: Category balance suggestion
    const topCategory = categoryBreakdown[0];
    if (topCategory && topCategory.percentage > 40) {
      insights.push({
        id: 'category_balance',
        title: 'Balance Your Spending',
        description: `${topCategory.category} makes up ${Math.round(topCategory.percentage)}% of your total expenses. Consider diversifying your budget.`,
        category: topCategory.category,
        icon: 'pie-chart',
        severity: 'info',
        action: 'Budget Tips'
      });
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    return [];
  }
};

/**
 * Export analytics data to a file in specified format
 */
export const exportAnalyticsData = async (
  format: ExportFormat = 'csv',
  customDateRange?: DateRange
): Promise<string> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  try {
    // Get all the data we want to export
    const [spendingHistory, categoryBreakdown, groupVsPersonal] = await Promise.all([
      getSpendingHistory(12, false, customDateRange),
      getCategoryBreakdown(12, false, customDateRange),
      getGroupVsPersonalSpending(12, customDateRange)
    ]);
    
    // Format the data based on the requested format
    if (format === 'json') {
      const data = {
        spendingHistory,
        categoryBreakdown,
        groupVsPersonal,
        exportDate: new Date().toISOString(),
        userId: auth.currentUser.uid,
        dateRange: customDateRange ? {
          start: customDateRange.startDate.toISOString(),
          end: customDateRange.endDate.toISOString(),
          label: customDateRange.label
        } : 'Last 12 Months'
      };
      
      return JSON.stringify(data, null, 2);
    }
    else if (format === 'csv') {
      // Create CSV header and data rows
      let csv = 'Date,Amount,Category\n';
      
      // Add spending history data
      spendingHistory.forEach(month => {
        csv += `${month.month} ${month.year},${month.actual},Total Monthly Spending\n`;
      });
      
      // Add category breakdown data
      csv += '\nCategory,Amount,Percentage\n';
      categoryBreakdown.forEach(cat => {
        csv += `${cat.category},${cat.amount},${cat.percentage.toFixed(2)}\n`;
      });
      
      // Add group vs personal data
      csv += '\nType,Amount,Percentage\n';
      csv += `Personal,${groupVsPersonal.personal},${groupVsPersonal.personalPercentage.toFixed(2)}\n`;
      csv += `Group,${groupVsPersonal.group},${groupVsPersonal.groupPercentage.toFixed(2)}\n`;
      
      return csv;
    }
    else { // PDF (simplified - in real app would use a PDF generation library)
      return JSON.stringify({
        format: 'pdf',
        content: 'PDF data would be generated here',
        data: { spendingHistory, categoryBreakdown, groupVsPersonal }
      });
    }
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw error;
  }
};

/**
 * Get group vs. personal spending comparison with date range support
 */
export const getGroupVsPersonalSpending = async (
  months = 3,
  customDateRange?: DateRange
): Promise<{ personal: number, group: number, personalPercentage: number, groupPercentage: number }> => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  try {
    const endDate = customDateRange ? customDateRange.endDate : new Date();
    const startDate = customDateRange 
      ? customDateRange.startDate 
      : new Date(new Date().setMonth(endDate.getMonth() - months));
    
    // Query all expenses in the period
    const transactionsRef = collection(db, 'users', auth.currentUser.uid, 'transactions');
    const expensesQuery = query(
      transactionsRef,
      where('date', '>=', startDate.toISOString().split('T')[0]),
      where('date', '<=', endDate.toISOString().split('T')[0]),
      where('amount', '<', 0) // Only expenses
    );
    
    const querySnapshot = await getDocs(expensesQuery);
    
    let personalTotal = 0;
    let groupTotal = 0;
    
    querySnapshot.forEach(doc => {
      const transaction = doc.data();
      const amount = Math.abs(transaction.amount);
      
      if (transaction.isGroupExpense) {
        groupTotal += amount;
      } else {
        personalTotal += amount;
      }
    });
    
    const total = personalTotal + groupTotal;
    
    return {
      personal: personalTotal,
      group: groupTotal,
      personalPercentage: total > 0 ? (personalTotal / total) * 100 : 50,
      groupPercentage: total > 0 ? (groupTotal / total) * 100 : 50
    };
  } catch (error) {
    console.error('Error getting group vs personal spending:', error);
    return {
      personal: 0,
      group: 0,
      personalPercentage: 50,
      groupPercentage: 50
    };
  }
};

// Helper function to get icon name for a category
export const getCategoryIcon = (category: string): string => {
  const icons: {[key: string]: string} = {
    food: 'restaurant',
    groceries: 'cart',
    shopping: 'bag',
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

export default {
  getSpendingHistory,
  predictFutureSpending,
  getCategoryBreakdown,
  generateInsights,
  getGroupVsPersonalSpending,
  DATE_RANGES,
  exportAnalyticsData
};
