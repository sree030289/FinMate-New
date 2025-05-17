import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  FormControl,
  Input,
  Button,
  HStack,
  Text,
  Pressable,
  Icon,
  useColorMode,
  Center,
  Image,
  useToast,
  ScrollView
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const SignupScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { colorMode } = useColorMode();
  const navigation = useNavigation();
  const toast = useToast();

  // Form validation
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email address is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      await updateProfile(user, {
        displayName: name
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        displayName: name,
        email: email,
        createdAt: serverTimestamp(),
        isPremium: false,
        // Default preferences and settings
        preferences: {
          theme: 'system',
          notifications: true,
          defaultCurrency: 'INR'
        }
      });
      
      // Auth state listener in MainNavigator will handle navigation
      toast.show({
        title: "Account created",
        description: "Welcome to FinMate!",
        status: "success"
      });
    } catch (error: any) {
      let errorMessage = "Failed to create account";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email address is already in use";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak";
      }
      
      toast.show({
        title: "Signup Failed",
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
          <Center mt={5} mb={6}>
            <Image
              source={require('../../../assets/finmate-logo.png')}
              alt="FinMate Logo"
              size="lg"
              fallbackSource={{
                uri: "https://placeholder.pics/svg/150x150/00B1F9-FFFFFF/FinMate"
              }}
            />
          </Center>
          
          <VStack space={4} alignItems="center" mb={5}>
            <Heading size="xl">Create Account</Heading>
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Sign up to track your finances with FinMate
            </Text>
          </VStack>
          
          <VStack space={4}>
            <FormControl isInvalid={!!errors.name}>
              <FormControl.Label>Full Name</FormControl.Label>
              <Input
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                InputLeftElement={
                  <Icon as={Ionicons} name="person-outline" size={5} ml={2} color="muted.400" />
                }
              />
              <FormControl.ErrorMessage>{errors.name}</FormControl.ErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.email}>
              <FormControl.Label>Email</FormControl.Label>
              <Input
                placeholder="Enter your email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                InputLeftElement={
                  <Icon as={Ionicons} name="mail-outline" size={5} ml={2} color="muted.400" />
                }
              />
              <FormControl.ErrorMessage>{errors.email}</FormControl.ErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.password}>
              <FormControl.Label>Password</FormControl.Label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                onChangeText={setPassword}
                InputLeftElement={
                  <Icon as={Ionicons} name="lock-closed-outline" size={5} ml={2} color="muted.400" />
                }
                InputRightElement={
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Icon
                      as={Ionicons}
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={5}
                      mr={2}
                      color="muted.400"
                    />
                  </Pressable>
                }
              />
              <FormControl.HelperText>
                Password must be at least 6 characters.
              </FormControl.HelperText>
              <FormControl.ErrorMessage>{errors.password}</FormControl.ErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.confirmPassword}>
              <FormControl.Label>Confirm Password</FormControl.Label>
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                InputLeftElement={
                  <Icon as={Ionicons} name="lock-closed-outline" size={5} ml={2} color="muted.400" />
                }
                InputRightElement={
                  <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Icon
                      as={Ionicons}
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                      size={5}
                      mr={2}
                      color="muted.400"
                    />
                  </Pressable>
                }
              />
              <FormControl.ErrorMessage>{errors.confirmPassword}</FormControl.ErrorMessage>
            </FormControl>
            
            <Button
              mt={4}
              size="lg"
              colorScheme="primary"
              isLoading={isLoading}
              onPress={handleSignup}
            >
              Sign Up
            </Button>
            
            <HStack mt={4} justifyContent="center">
              <Text color={colorMode === 'dark' ? 'text.dark' : 'text.light'}>
                Already have an account?{' '}
              </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text color="primary.500" fontWeight="medium">Sign In</Text>
              </Pressable>
            </HStack>
            
            <Text fontSize="xs" textAlign="center" mt={6} color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
          </VStack>
        </ScrollView>
      </Box>
    </KeyboardAwareScrollView>
  );
};

export default SignupScreen;
