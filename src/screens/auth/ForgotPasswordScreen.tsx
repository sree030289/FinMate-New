import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  Text,
  HStack,
  Icon,
  useColorMode,
  Center,
  Image,
  useToast,
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const { colorMode } = useColorMode();
  const navigation = useNavigation();
  const toast = useToast();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      toast.show({
        title: "Error",
        description: "Please enter your email address",
        status: "error"
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setIsEmailSent(true);
      toast.show({
        title: "Success",
        description: "Password reset email sent. Check your inbox.",
        status: "success",
        duration: 5000
      });
    } catch (error: any) {
      let errorMessage = "Failed to send password reset email";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format";
      }
      
      toast.show({
        title: "Error",
        description: errorMessage,
        status: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <Center mt={10} mb={8}>
          <Image
            source={require('../../../assets/finmate-logo.png')}
            alt="FinMate Logo"
            size="xl"
            fallbackSource={{
              uri: "https://via.placeholder.com/150?text=FinMate"
            }}
          />
        </Center>
        
        <VStack space={4} alignItems="center" mb={8}>
          <Heading size="xl">Forgot Password</Heading>
          <Text 
            textAlign="center" 
            color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}
          >
            Enter your email address and we'll send you a link to reset your password
          </Text>
        </VStack>
        
        {!isEmailSent ? (
          <VStack space={5}>
            <FormControl>
              <FormControl.Label>Email</FormControl.Label>
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                InputLeftElement={
                  <Icon as={Ionicons} name="mail-outline" size={5} ml={2} color="muted.400" />
                }
              />
            </FormControl>
            
            <Button
              mt={2}
              isLoading={isLoading}
              onPress={handleResetPassword}
              leftIcon={<Icon as={Ionicons} name="send-outline" size="sm" />}
            >
              Send Reset Link
            </Button>
          </VStack>
        ) : (
          <VStack space={5} alignItems="center">
            <Box 
              p={4} 
              borderRadius="full" 
              bg={colorMode === 'dark' ? 'primary.700' : 'primary.100'}
            >
              <Icon as={Ionicons} name="checkmark-circle" size="4xl" color="primary.500" />
            </Box>
            
            <Heading size="md" textAlign="center">Check Your Email</Heading>
            
            <Text textAlign="center" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              We've sent a password reset link to {email}
            </Text>
            
            <Button 
              mt={6} 
              variant="outline" 
              onPress={() => navigation.navigate('Login')}
              leftIcon={<Icon as={Ionicons} name="arrow-back" size="sm" />}
            >
              Back to Login
            </Button>
          </VStack>
        )}
        
        <HStack mt={10} justifyContent="center">
          <Text color={colorMode === 'dark' ? 'text.dark' : 'text.light'}>
            Remember your password?{' '}
          </Text>
          <Text color="primary.500" fontWeight="medium" onPress={() => navigation.navigate('Login')}>
            Sign In
          </Text>
        </HStack>
      </Box>
    </KeyboardAwareScrollView>
  );
};

export default ForgotPasswordScreen;
