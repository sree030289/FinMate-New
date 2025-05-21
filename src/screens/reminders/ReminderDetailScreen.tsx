import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  useColorMode,
  Divider,
  Badge,
  Pressable,
  AlertDialog,
  useToast,
  IToastProps
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { reminderService } from '../../services/firestoreService';
import { Reminder } from '../../types';
import { NavigationProps } from '../../types/navigation';
import { sendTestNotification } from '../../utils/notificiationHelper';

const getRecurrenceText = (type?: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
  switch (type) {
    case 'daily': return 'Every day';
    case 'weekly': return 'Every week';
    case 'monthly': return 'Every month';
    case 'yearly': return 'Every year';
    default: return 'Monthly'; // Default to monthly if no type specified
  }
};

interface ReminderDetailScreenParams {
  reminder: Reminder;
}

const ReminderDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NavigationProps>();
  const { colorMode } = useColorMode();
  const toast = useToast();
  const { reminder } = route.params as ReminderDetailScreenParams;
  
  const [isPaid, setIsPaid] = useState(reminder.paid);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = React.useRef(null);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const markAsPaid = async () => {
    try {
      await reminderService.updateReminder(reminder.id, { paid: true });
      setIsPaid(true);
      toast.show({
        title: "Marked as Paid",
        description: `${reminder.title} has been marked as paid`
      } as IToastProps);
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Failed to update reminder status"
      } as IToastProps);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      await reminderService.deleteReminder(reminder.id);
      
      toast.show({
        title: "Reminder Deleted",
        description: "The reminder has been deleted successfully"
      } as IToastProps);
      
      navigation.goBack();
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Failed to delete reminder"
      } as IToastProps);
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  // Handle editing the reminder
  const handleEditReminder = () => {
    navigation.navigate('AddReminder', { reminderToEdit: reminder });
  };

  // Calculate days left
  const daysLeft = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(reminder.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  const getDaysLeftText = () => {
    const days = daysLeft();
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Due today';
    return `Due in ${days} ${days === 1 ? 'day' : 'days'}`;
  };

  return (
    <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      {/* Header with payment status */}
      <Box 
        bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
        borderRadius="lg"
        p={5}
        shadow={1}
        mb={5}
      >
        <HStack justifyContent="space-between">
          <VStack>
            <Heading size="md">{reminder.title}</Heading>
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              {reminder.category}
            </Text>
          </VStack>
          
          <Badge
            colorScheme={isPaid ? 'green' : daysLeft() < 0 ? 'red' : daysLeft() <= 2 ? 'orange' : 'blue'}
            variant="solid"
            rounded="md"
            px={2}
          >
            {isPaid ? 'Paid' : getDaysLeftText()}
          </Badge>
        </HStack>
        
        <HStack justifyContent="space-between" alignItems="center" mt={6}>
          <Text fontSize="3xl" fontWeight="bold">₹{reminder.amount.toLocaleString()}</Text>
          <VStack alignItems="flex-end">
            <Text fontSize="sm" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Due Date</Text>
            <HStack alignItems="center" space={1}>
              <Icon as={Ionicons} name="calendar" size="xs" color="primary.500" />
              <Text fontWeight="medium">{formatDate(reminder.dueDate)}</Text>
            </HStack>
          </VStack>
        </HStack>
      </Box>
      
      {/* Reminder details */}
      <Box 
        bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
        borderRadius="lg"
        p={5}
        shadow={1}
        mb={5}
      >
        <Heading size="sm" mb={3}>Reminder Details</Heading>
        
        <VStack space={3} divider={<Divider />}>
          <HStack justifyContent="space-between">
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Category</Text>
            <HStack space={2} alignItems="center">
              <Icon 
                as={Ionicons} 
                name={reminder.icon || 'calendar-outline'} 
                color="primary.500"
                size="sm"
              />
              <Text>{reminder.category}</Text>
            </HStack>
          </HStack>
          
          <HStack justifyContent="space-between">
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Status</Text>
            <Text color={isPaid ? 'green.500' : 'red.500'} fontWeight="medium">
              {isPaid ? 'Paid' : 'Unpaid'}
            </Text>
          </HStack>
          
          <HStack justifyContent="space-between">
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Recurring</Text>
            <HStack space={2} alignItems="center">
              {reminder.recurring && (
                <Icon as={Ionicons} name="repeat" size="xs" color="primary.500" />
              )}
              <Text>{reminder.recurring ? getRecurrenceText(reminder.recurrenceType) : 'No'}</Text>
            </HStack>
          </HStack>
          
          <HStack justifyContent="space-between">
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Reminder</Text>
            <Text>
              {reminder.notificationTime === 'same_day' ? 'On due date' : 
              reminder.notificationTime === 'day_before' ? '1 day before' :
              reminder.notificationTime === 'three_days_before' ? '3 days before' :
              reminder.notificationTime === 'week_before' ? '1 week before' : 
              '1 day before'}
            </Text>
          </HStack>
          
          {reminder.notes && (
            <>
              <Box>
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Notes</Text>
                <Text mt={1}>{reminder.notes}</Text>
              </Box>
            </>
          )}
        </VStack>
      </Box>
      
      {/* Action buttons */}
      <HStack space={4} mt={4}>
        {!isPaid ? (
          <Button 
            flex={1}
            leftIcon={<Icon as={Ionicons} name="checkmark-circle-outline" size="sm" />}
            onPress={markAsPaid}
            colorScheme="green"
          >
            Mark as Paid
          </Button>
        ) : (
          <Button 
            flex={1}
            leftIcon={<Icon as={Ionicons} name="create-outline" size="sm" />}
            onPress={handleEditReminder}
            variant="outline"
          >
            Edit
          </Button>
        )}
        
        <Button 
          flex={1}
          leftIcon={<Icon as={Ionicons} name="trash-outline" size="sm" />}
          colorScheme="red"
          variant="outline"
          onPress={() => setShowDeleteAlert(true)}
        >
          Delete
        </Button>
      </HStack>
      
      {/* Always show Edit button for unpaid reminders */}
      {!isPaid && (
        <Button
          mt={4}
          leftIcon={<Icon as={Ionicons} name="create-outline" size="sm" />}
          onPress={handleEditReminder}
          variant="outline"
        >
          Edit Reminder
        </Button>
      )}
      
      {/* Scheduled recurrence */}
      {reminder.recurring && (
        <Box 
          mt={8}
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
          borderRadius="lg"
          p={5}
          shadow={1}
        >
          <HStack justifyContent="space-between" alignItems="center" mb={3}>
            <Heading size="sm">Upcoming Schedule</Heading>
            <Badge colorScheme="primary" variant="outline">
              {getRecurrenceText(reminder.recurrenceType)}
            </Badge>
          </HStack>
          
          <VStack space={4}>
            {[1, 2, 3].map((month) => {
              const date = new Date(reminder.dueDate);
              
              // Adjust the date based on recurrence type
              if (reminder.recurrenceType === 'daily') {
                date.setDate(date.getDate() + month);
              } else if (reminder.recurrenceType === 'weekly') {
                date.setDate(date.getDate() + (month * 7));
              } else if (reminder.recurrenceType === 'yearly') {
                date.setFullYear(date.getFullYear() + month);
              } else {
                // Default to monthly
                date.setMonth(date.getMonth() + month);
              }
              
              return (
                <HStack key={month} justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Icon as={Ionicons} name="calendar-outline" color="primary.500" />
                    <Text>{formatDate(date.toISOString())}</Text>
                  </HStack>
                  <Text fontWeight="medium">₹{reminder.amount.toLocaleString()}</Text>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      )}
      
      {/* Delete Confirmation */}
      <AlertDialog
        leastDestructiveRef={cancelRef}
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
      >
        <AlertDialog.Content>
          <AlertDialog.CloseButton />
          <AlertDialog.Header>Delete Reminder</AlertDialog.Header>
          <AlertDialog.Body>
            Are you sure you want to delete this reminder? This action cannot be undone.
            {reminder.recurring && (
              <Text color="red.500" mt={2}>
                This will also delete all future recurring reminders.
              </Text>
            )}
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button.Group space={2}>
              <Button 
                variant="unstyled" 
                colorScheme="coolGray" 
                onPress={() => setShowDeleteAlert(false)} 
                ref={cancelRef}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="danger" 
                onPress={handleDelete}
                isLoading={isDeleting}
              >
                Delete
              </Button>
              <Button 
  onPress={() => {
    sendTestNotification();
    toast.show({
      title: "Test Notification",
      description: "A test notification will appear in 2 seconds",
      placement: "top",
    });
  }}
>
  Test Notification
</Button>
            </Button.Group>
          </AlertDialog.Footer>
        </AlertDialog.Content>
      </AlertDialog>
    </Box>
  );
};

export default ReminderDetailScreen;