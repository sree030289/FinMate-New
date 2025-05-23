// Minimal notification helper - no Expo dependencies
// This removes all notification functionality temporarily

export async function setupNotifications() {
  console.log('Notifications temporarily disabled');
  return true; // Return true to prevent app from failing
}

export async function sendTestNotification() {
  console.log('Test notification disabled - would show notification here');
  alert('Test notification would appear here!');
  return 'mock-notification-id';
}

export async function scheduleReminderNotification(reminder: any) {
  console.log('Reminder notification disabled for:', reminder.title);
  return 'mock-notification-id';
}

export async function cancelReminderNotification(notificationId: string) {
  console.log('Notification cancellation disabled for:', notificationId);
}

export async function scheduleLocalNotification(title: string, body: string, data: any = {}, trigger: any = {}) {
  console.log('Local notification disabled:', title, body);
  return 'mock-notification-id';
}

export async function cancelAllNotifications() {
  console.log('Cancel all notifications disabled');
}

export async function getAllScheduledNotifications() {
  console.log('Get scheduled notifications disabled');
  return [];
}