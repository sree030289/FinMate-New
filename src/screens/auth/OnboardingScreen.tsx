import React, { useState, useRef } from 'react';
import {
  Box,
  Image,
  Text,
  VStack,
  Button,
  HStack,
  Pressable,
  useColorMode,
  Center,
  ScrollView
} from 'native-base';
import { Dimensions, ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Get screen dimensions
const { width } = Dimensions.get('window');

// Onboarding data
const onboardingData = [
  {
    title: 'Track Your Finances',
    description: 'Keep track of your income and expenses with ease.',
    image: require('../../../assets/placeholder.png') // Default to placeholder image
  },
  {
    title: 'Split Expenses',
    description: 'Split bills and expenses with friends and family.',
    image: require('../../../assets/placeholder.png') // Default to placeholder image
  },
  {
    title: 'Smart Reminders',
    description: 'Never miss a payment with intelligent bill reminders.',
    image: require('../../../assets/placeholder.png') // Default to placeholder image
  }
];

const OnboardingScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef(null);
  const navigation = useNavigation();
  const { colorMode } = useColorMode();

  // Handle scroll to specific page
  const scrollTo = (index: number) => {
    setCurrentIndex(index);
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  };

  // Handle next page
  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      scrollTo(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  // Skip to login
  const handleSkip = () => {
    navigation.navigate('Login');
  };

  return (
    <Box flex={1} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
      {/* Image slider - replaced Box with ScrollView */}
      <ScrollView 
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(newIndex);
        }}
        ref={scrollRef}
        flex={1}
        width={width}
      >
        {onboardingData.map((item, index) => (
          <Center key={index} width={width} flex={1}>
            <VStack space={6} alignItems="center" px={8}>
              <Box width="80%" height="40%">
                <Image 
                  source={item.image}
                  alt={item.title}
                  size="2xl"
                  resizeMode="contain"
                  fallbackSource={require('../../../assets/placeholder.png')}
                />
              </Box>
              <Text 
                fontSize="3xl" 
                fontWeight="bold" 
                textAlign="center"
                color={colorMode === 'dark' ? 'white' : 'black'}
              >
                {item.title}
              </Text>
              <Text 
                fontSize="md" 
                textAlign="center"
                color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}
              >
                {item.description}
              </Text>
            </VStack>
          </Center>
        ))}
      </ScrollView>
      
      {/* Pagination dots */}
      <HStack space={2} justifyContent="center" mb={6}>
        {onboardingData.map((_, index) => (
          <Pressable key={index} onPress={() => scrollTo(index)}>
            <Box 
              rounded="full" 
              size={2} 
              bg={index === currentIndex ? 'primary.500' : 'gray.300'}
            />
          </Pressable>
        ))}
      </HStack>
      
      {/* Bottom buttons */}
      <Box px={8} py={8}>
        <Button
          mb={4}
          onPress={handleNext}
        >
          {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
        </Button>
        
        {currentIndex < onboardingData.length - 1 && (
          <Button variant="ghost" onPress={handleSkip}>
            Skip
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default OnboardingScreen;
