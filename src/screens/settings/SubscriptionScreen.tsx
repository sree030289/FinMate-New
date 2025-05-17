import React, { useState } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  Button,
  Icon,
  useColorMode,
  Stack,
  Divider,
  Pressable,
  Center,
  useToast,
  Badge
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';

const features = {
  free: [
    { name: 'Basic expense tracking', included: true },
    { name: 'Manual expense entry', included: true },
    { name: 'Limited bill reminders (up to 5)', included: true },
    { name: 'Basic split expenses', included: true },
    { name: 'Limited OCR receipt scanning (5/month)', included: true },
    { name: 'Limited transaction history (3 months)', included: true },
    { name: 'Basic budget tracking', included: true },
    { name: 'AI expense analysis', included: false },
    { name: 'Unlimited reminders', included: false },
    { name: 'Bank account integration', included: false },
    { name: 'Advanced data export', included: false },
    { name: 'Priority customer support', included: false },
  ],
  premium: [
    { name: 'Basic expense tracking', included: true },
    { name: 'Manual expense entry', included: true },
    { name: 'Unlimited bill reminders', included: true },
    { name: 'Advanced split expenses', included: true },
    { name: 'Unlimited OCR receipt scanning', included: true },
    { name: 'Unlimited transaction history', included: true },
    { name: 'Advanced budget tracking', included: true },
    { name: 'AI expense analysis', included: true },
    { name: 'Unlimited reminders', included: true },
    { name: 'Bank account integration', included: true },
    { name: 'Advanced data export', included: true },
    { name: 'Priority customer support', included: true },
  ]
};

const SubscriptionScreen = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free'); // 'free' or 'premium'

  const handleUpgrade = () => {
    setIsLoading(true);
    
    // Simulate payment process
    setTimeout(() => {
      setIsLoading(false);
      setCurrentPlan('premium');
      
      toast.show({
        title: "Subscription Activated",
        description: `You've successfully upgraded to Premium! Enjoy all features.`,
        status: "success",
        duration: 3000
      });
    }, 2000);
  };

  const handleCancel = () => {
    setIsLoading(true);
    
    // Simulate cancellation
    setTimeout(() => {
      setIsLoading(false);
      setCurrentPlan('free');
      
      toast.show({
        title: "Subscription Cancelled",
        description: "Your premium features will be available until the end of your billing period.",
        status: "info",
        duration: 3000
      });
    }, 1500);
  };

  return (
    <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      <VStack space={6}>
        <Heading size="lg">Subscription</Heading>

        {/* Current Plan Status */}
        <Box 
          bg={currentPlan === 'premium' ? 
            (colorMode === 'dark' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(250, 204, 21, 0.1)') : 
            (colorMode === 'dark' ? 'card.dark' : 'card.light')} 
          p={5} 
          borderRadius="lg"
          borderWidth={currentPlan === 'premium' ? 1 : 0}
          borderColor={currentPlan === 'premium' ? 'amber.500' : 'transparent'}
          shadow={1}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <VStack>
              <HStack space={2} alignItems="center">
                <Heading size="md">
                  {currentPlan === 'premium' ? 'Premium' : 'Free Plan'}
                </Heading>
                {currentPlan === 'premium' && (
                  <Icon as={Ionicons} name="star" size="sm" color="amber.500" />
                )}
              </HStack>
              <Text mt={1} color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                {currentPlan === 'premium' ? 
                  'Your subscription is active' : 
                  'Limited features available'}
              </Text>
            </VStack>
            
            {currentPlan === 'premium' && (
              <Badge colorScheme="success" variant="subtle">
                Active
              </Badge>
            )}
          </HStack>
          
          {currentPlan === 'premium' && (
            <VStack mt={4} space={2}>
              <Divider />
              <HStack justifyContent="space-between" alignItems="center" mt={2}>
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                  Next billing date
                </Text>
                <Text fontWeight="medium">June 15, 2023</Text>
              </HStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                  Plan
                </Text>
                <Text fontWeight="medium">Premium Monthly</Text>
              </HStack>
              <HStack justifyContent="space-between" alignItems="center">
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                  Amount
                </Text>
                <Text fontWeight="medium">₹299/month</Text>
              </HStack>
              
              <Button 
                mt={3}
                variant="outline"
                colorScheme="red"
                onPress={handleCancel}
                isLoading={isLoading}
              >
                Cancel Subscription
              </Button>
            </VStack>
          )}
        </Box>

        {currentPlan === 'free' && (
          <>
            {/* Plan selection */}
            <Box>
              <Heading size="md" mb={4}>Choose a Plan</Heading>
              
              <HStack space={4}>
                <Pressable 
                  flex={1} 
                  onPress={() => setSelectedPlan('monthly')}
                  borderWidth={2}
                  borderColor={selectedPlan === 'monthly' ? 'primary.500' : (colorMode === 'dark' ? 'border.dark' : 'border.light')}
                  borderRadius="lg"
                  p={4}
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                >
                  <VStack>
                    <Text fontWeight="bold">Monthly</Text>
                    <Text fontSize="xl" fontWeight="bold" color="primary.500" mt={2}>₹299</Text>
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>per month</Text>
                    
                    {selectedPlan === 'monthly' && (
                      <Center 
                        bg="primary.500" 
                        position="absolute" 
                        top={-2} 
                        right={-2}
                        w={6}
                        h={6}
                        borderRadius="full"
                      >
                        <Icon as={Ionicons} name="checkmark" color="white" size="sm" />
                      </Center>
                    )}
                  </VStack>
                </Pressable>
                
                <Pressable 
                  flex={1} 
                  onPress={() => setSelectedPlan('yearly')}
                  borderWidth={2}
                  borderColor={selectedPlan === 'yearly' ? 'primary.500' : (colorMode === 'dark' ? 'border.dark' : 'border.light')}
                  borderRadius="lg"
                  p={4}
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                >
                  <VStack>
                    <HStack alignItems="center" space={2}>
                      <Text fontWeight="bold">Yearly</Text>
                      <Badge colorScheme="green" variant="subtle">
                        <Text fontSize="2xs">SAVE 20%</Text>
                      </Badge>
                    </HStack>
                    <Text fontSize="xl" fontWeight="bold" color="primary.500" mt={2}>₹2,899</Text>
                    <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>per year</Text>
                    
                    {selectedPlan === 'yearly' && (
                      <Center 
                        bg="primary.500" 
                        position="absolute" 
                        top={-2} 
                        right={-2}
                        w={6}
                        h={6}
                        borderRadius="full"
                      >
                        <Icon as={Ionicons} name="checkmark" color="white" size="sm" />
                      </Center>
                    )}
                  </VStack>
                </Pressable>
              </HStack>
              
              <Button
                mt={6}
                onPress={handleUpgrade}
                isLoading={isLoading}
                leftIcon={<Icon as={Ionicons} name="star" size="sm" />}
              >
                Upgrade to Premium
              </Button>
            </Box>
          </>
        )}

        {/* Feature comparison */}
        <Box>
          <Heading size="md" mb={4}>Features</Heading>
          
          <HStack mb={4}>
            <Box flex={2}></Box>
            <Box flex={1} alignItems="center">
              <Text fontWeight="bold">Free</Text>
            </Box>
            <Box flex={1} alignItems="center">
              <Text fontWeight="bold">Premium</Text>
            </Box>
          </HStack>
          
          <VStack space={4} divider={<Divider />}>
            {features.premium.map((feature, index) => (
              <HStack key={index} alignItems="center">
                <Box flex={2}>
                  <Text>{feature.name}</Text>
                </Box>
                <Box flex={1} alignItems="center">
                  {features.free[index].included ? (
                    <Icon as={Ionicons} name="checkmark-circle" color="green.500" size="sm" />
                  ) : (
                    <Icon as={Ionicons} name="close-circle" color="red.500" size="sm" />
                  )}
                </Box>
                <Box flex={1} alignItems="center">
                  <Icon as={Ionicons} name="checkmark-circle" color="green.500" size="sm" />
                </Box>
              </HStack>
            ))}
          </VStack>
        </Box>
        
        {/* FAQ */}
        <Box>
          <Heading size="md" mb={4}>Frequently Asked Questions</Heading>
          
          <VStack space={4} divider={<Divider />}>
            <Box>
              <Text fontWeight="bold" mb={1}>How will I be billed?</Text>
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                You'll be charged once a month or once a year, depending on your subscription plan.
              </Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" mb={1}>Can I cancel anytime?</Text>
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.
              </Text>
            </Box>
            
            <Box>
              <Text fontWeight="bold" mb={1}>Is there a refund policy?</Text>
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                We offer a 7-day money-back guarantee if you're not satisfied with our premium features.
              </Text>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default SubscriptionScreen;
