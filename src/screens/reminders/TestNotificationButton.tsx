import React from 'react';
import { IconButton, Icon, useToast } from 'native-base';
import { Ionicons } from '@expo/vector-icons';

interface TestNotificationButtonProps {
  theme: any;
}

const TestNotificationButton = ({ theme }: TestNotificationButtonProps) => {
  const toast = useToast();

  const handlePress = async () => {
    try {
      // Import test function on demand
      const { sendTestNotification } = require('../../utils/notificiationHelper');
      const id = await sendTestNotification();
      
      if (id) {
        toast.show({
          title: "Test Notification Sent",
          description: "Check your notification center",
          placement: "top",
          backgroundColor: theme.primary
        });
      } else {
        toast.show({
          title: "Failed to send notification",
          description: "See console for details",
          placement: "top",
          backgroundColor: theme.error
        });
      }
    } catch (e) {
      console.error("Error sending test notification:", e);
      toast.show({
        title: "Error",
        description: "Failed to import notification module",
        placement: "top",
        backgroundColor: theme.error
      });
    }
  };

  return (
    <IconButton
      onPress={handlePress}
      icon={<Icon as={Ionicons} name="notifications" color={theme.text} size="sm" />}
      borderRadius="full"
      bg={`${theme.primary}15`}
      _pressed={{ bg: `${theme.primary}30` }}
      size="sm"
    />
  );
};

export default TestNotificationButton;
