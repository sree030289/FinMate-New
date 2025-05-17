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
  useToast
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// Handle missing assets with try/catch
const getLogoSource = () => {
  try {
    return require('../../../assets/finmate-logo.png');
  } catch (error) {
    console.warn('Could not load finmate-logo.png, using fallback');
    return require('../../../assets/placeholder.png'); // Make sure placeholder exists
  }
};

const getFallbackImage = () => {
  try {
    return require('../../../assets/placeholder.png');
  } catch (error) {
    console.warn("Could not load fallback image");
    return { uri: '' };
  }
};

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { colorMode } = useColorMode();
  const navigation = useNavigation();
  const toast = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.show({
        title: "Error",
        description: "Please enter both email and password",
        status: "error"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state listener in MainNavigator will handle navigation
    } catch (error: any) {
      let errorMessage = "Failed to sign in";
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Invalid email or password";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address";
      }
      
      toast.show({
        title: "Login Failed",
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
            source={(() => {
              try {
                return require('../../../assets/finmate-logo.png');
              } catch (error) {
                return getFallbackImage();
              }
            })()}
            alt="FinMate Logo"
            size="xl"
            fallbackSource={{
              uri: "https://placeholder.pics/svg/200x200/00B1F9-FFFFFF/FinMate"
            }}
          />
        </Center>
        
        <VStack space={4} alignItems="center" mb={8}>
          <Heading size="xl">Welcome Back</Heading>
          <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
            Sign in to continue to FinMate
          </Text>
        </VStack>
        
        <VStack space={4}>
          <FormControl>
            <FormControl.Label>Email</FormControl.Label>
            <Input
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              InputLeftElement={
                <Icon as={Ionicons} name="mail-outline" size={5} ml={2} color="muted.400" />
              }
            />
          </FormControl>
          
          <FormControl>
            <FormControl.Label>Password</FormControl.Label>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
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
          </FormControl>
          
          <HStack justifyContent="flex-end">
            <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
              <Text color="primary.500">Forgot Password?</Text>
            </Pressable>
          </HStack>
          
          <Button
            size="lg"
            colorScheme="primary"
            isLoading={isLoading}
            onPress={handleLogin}
            mt={4}
          >
            Sign In
          </Button>
          
          <HStack mt={6} justifyContent="center">
            <Text color={colorMode === 'dark' ? 'text.dark' : 'text.light'}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => navigation.navigate('Signup')}>
              <Text color="primary.500" fontWeight="medium">Sign Up</Text>
            </Pressable>
          </HStack>
        </VStack>
      </Box>
    </KeyboardAwareScrollView>
  );
};

export default LoginScreen;
