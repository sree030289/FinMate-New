import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const passwordRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    // Check if device supports biometric authentication
    const checkBiometricSupport = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(compatible && enrolled);
      
      // Try biometric login if supported
      if (compatible && enrolled) {
        promptBiometricAuth();
      }
    };
    
    checkBiometricSupport();
  }, []);
  
  const promptBiometricAuth = async () => {
    try {
      // Check if any user has biometric login enabled
      const userIds = await getSavedUserIds();
      if (userIds.length === 0) return;
      
      // Get the most recent user's ID
      const userId = userIds[0]; 
      
      const biometricEnabled = await AsyncStorage.getItem(`biometric_enabled_${userId}`);
      if (biometricEnabled !== 'true') return;
      
      const savedEmail = await AsyncStorage.getItem(`email_${userId}`);
      if (!savedEmail) return;
      
      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login with biometrics',
        fallbackLabel: 'Use password',
      });
      
      if (result.success) {
        // Biometric auth successful, retrieve saved email
        setEmail(savedEmail);
        
        // Attempt login with empty password - the backend will verify using the auth token
        try {
          setIsLoading(true);
          
          // Since we don't store passwords, we need to get it from the user or use a token-based approach
          // This is a simplification - in a real app you'd need a more secure approach
          Alert.alert(
            'Biometric Login', 
            'Please enter your password to complete biometric login setup',
            [
              {
                text: 'Enter Password',
                onPress: () => {
                  setIsLoading(false);
                  // Focus on password field for user to enter
                  passwordRef.current.focus();
                }
              }
            ]
          );
        } catch (error) {
          setIsLoading(false);
          console.error('Biometric login error:', error);
        }
      }
    } catch (error) {
      console.error('Error with biometric auth:', error);
    }
  };
  
  const getSavedUserIds = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys
        .filter(key => key.startsWith('biometric_enabled_'))
        .map(key => key.replace('biometric_enabled_', ''));
    } catch (e) {
      console.error('Error getting saved user IDs:', e);
      return [];
    }
  };

  const validateEmail = (text) => {
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    if (text.length === 0) {
      setEmailError('Email is required');
      return false;
    } else if (!reg.test(text)) {
      setEmailError('Please enter a valid email');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const validatePassword = (text) => {
    if (text.length === 0) {
      setPasswordError('Password is required');
      return false;
    } else if (text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (isEmailValid && isPasswordValid) {
      try {
        setIsLoading(true);
        
        // Attempt to sign in with Firebase Authentication
        await signInWithEmailAndPassword(auth, email, password);
        
        // Reset login attempts on successful login
        setLoginAttempts(0);
        
        // Success - the MainNavigator will detect the auth state change
        console.log('Login successful');
      } catch (error) {
        // Increment failed login attempts
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        // If 3+ failed attempts and biometrics available, suggest biometric login
        if (newAttempts >= 3 && biometricSupported) {
          Alert.alert(
            'Multiple Failed Attempts', 
            'Would you like to try biometric authentication?',
            [
              { 
                text: 'Cancel', 
                style: 'cancel' 
              },
              { 
                text: 'Use Biometrics', 
                onPress: promptBiometricAuth 
              }
            ]
          );
        } else {
          // Standard error handling
          let errorMessage = 'Login failed. Please check your credentials.';
          
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'Invalid email or password';
          } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed login attempts. Please try again later.';
          }
          
          Alert.alert('Error', errorMessage);
          console.error('Login error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.headerText}>Welcome Back</Text>
              <Text style={styles.subHeaderText}>Sign in to continue</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Icon name="email-outline" size={20} color="#00C805" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    validateEmail(text);
                  }}
                  onSubmitEditing={() => passwordRef.current.focus()}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              <View style={styles.inputContainer}>
                <Icon name="lock-outline" size={20} color="#00C805" style={styles.inputIcon} />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    validatePassword(text);
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity onPress={toggleShowPassword} style={styles.passwordIcon}>
                  <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#00C805" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

              <TouchableOpacity 
                style={styles.forgotPasswordContainer}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.loginButtonText}>LOG IN</Text>
                )}
              </TouchableOpacity>
            </View>

            {biometricSupported && (
              <TouchableOpacity 
                style={styles.biometricButton}
                onPress={promptBiometricAuth}
              >
                <Icon 
                  name={Platform.OS === 'ios' ? 'face-recognition' : 'fingerprint'} 
                  size={24} 
                  color="#00C805" 
                />
                <Text style={styles.biometricText}>
                  Login with {Platform.OS === 'ios' ? 'Face ID/Touch ID' : 'Fingerprint'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signUpText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subHeaderText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  formContainer: {
    width: '100%',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 4,
    height: 55,
    marginVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#111111',
  },
  inputIcon: {
    marginRight: 10,
  },
  passwordIcon: {
    position: 'absolute',
    right: 15,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 5,
    marginTop: 2,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginVertical: 15,
  },
  forgotPasswordText: {
    color: '#00C805',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#00C805',
    borderRadius: 4,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  biometricText: {
    color: '#00C805',
    fontSize: 14,
    marginLeft: 8,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  signUpText: {
    fontSize: 14,
    color: '#00C805',
    fontWeight: '600',
  },
});

export default LoginScreen;
