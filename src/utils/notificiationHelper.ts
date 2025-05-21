import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      // Show alert even if app is in foreground
    shouldPlaySound: true,      // Play sound
    shouldSetBadge: true,       // Update app badge count
    shouldShowBanner: true,     // Show banner notification
    shouldShowList: true,       // Show in notification list
    priority: Notifications.AndroidNotificationPriority.HIGH, // For Android
  }),
});

// Request permissions for notifications - without trying to get a push token
export async function setupNotifications() {
  if (Device.isDevice) {
    // Check current permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // If permission hasn't been determined, ask for it
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    // If permission not granted, log message
    if (finalStatus !== 'granted') {
      console.log('Failed to get notification permissions!');
      return false;
    }
  } else {
    console.log('Must use physical device for notifications');
    return false;
  }

  // Set notification channel for Android
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00C805', // Robinhood green
    });
    
    // Create channels for different reminder types
    Notifications.setNotificationChannelAsync('bills', {
      name: 'Bills',
      description: 'Notifications for upcoming bill payments',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B6B', // Bills color
    });
    
    // Additional channels...
  }

  return true;
}

// Schedule a local notification (this doesn't need ExpoPushTokenManager)
export async function scheduleLocalNotification(title, body, data, trigger) {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        data: data || {},
      },
      trigger: trigger || { seconds: 5 }, // Default to 5 seconds if not specified
    });
    
    console.log('Scheduled notification:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

// Test function to send an immediate notification without requiring any token
export async function sendTestNotification() {
  try {
    // Make sure permissions are granted first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Requesting notification permissions');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('Notification permissions were denied');
        return null;
      }
    }

    // Schedule a simple local notification without push tokens
    return scheduleLocalNotification(
      'Test Notification',
      'This is a test notification from FinMate',
      { test: true },
      { seconds: 2 }
    );
  } catch (error) {
    console.error('Error in sendTestNotification:', error);
    return null;
  }
}

// Schedule a notification for a reminder
export async function scheduleReminderNotification(reminder) {
  // Calculate notification time based on dueDate and notificationTime
  const dueDate = new Date(reminder.dueDate);
  let notificationDate = new Date(dueDate);
  
  // Adjust notification time based on preference
  switch (reminder.notificationTime) {
    case 'same_day':
      // Send on same day at 9 AM
      notificationDate.setHours(9, 0, 0, 0);
      break;
    case 'day_before':
      // Send one day before at 9 AM
      notificationDate.setDate(notificationDate.getDate() - 1);
      notificationDate.setHours(9, 0, 0, 0);
      break;
    case 'three_days_before':
      // Send three days before at 9 AM
      notificationDate.setDate(notificationDate.getDate() - 3);
      notificationDate.setHours(9, 0, 0, 0);
      break;
    case 'week_before':
      // Send one week before at 9 AM
      notificationDate.setDate(notificationDate.getDate() - 7);
      notificationDate.setHours(9, 0, 0, 0);
      break;
    default:
      // Default to one day before at 9 AM
      notificationDate.setDate(notificationDate.getDate() - 1);
      notificationDate.setHours(9, 0, 0, 0);
  }
  
  // For testing, set notification to 10 seconds from now
  const now = new Date();
  now.setSeconds(now.getSeconds() + 10);
  
  // Use the now date for testing, comment this out for production use
  notificationDate = now;
  
  // Create notification content
  return scheduleLocalNotification(
    `Reminder: ${reminder.title}`,
    `₹${reminder.amount.toLocaleString()} due on ${dueDate.toLocaleDateString()}`,
    { 
      reminderId: reminder.id,
      category: reminder.category,
      amount: reminder.amount,
      dueDate: reminder.dueDate
    },
    { date: notificationDate }
  );
}

// Cancel a scheduled notification
export async function cancelReminderNotification(notificationId) {
  if (!notificationId) return;
  
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log('Canceled notification:', notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
}