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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignupScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [mobileError, setMobileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pinError, setPinError] = useState('');

  const emailRef = useRef(null);
  const mobileRef = useRef(null);
  const passwordRef = useRef(null);
  const pinRef = useRef(null);
  
  const navigation = useNavigation();

  const [biometricSupported, setBiometricSupported] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  
  useEffect(() => {
    // Check if biometric authentication is available
    const checkBiometricSupport = async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricSupported(compatible && enrolled);
    };
    
    checkBiometricSupport();
  }, []);

  const validateName = (text) => {
    if (text.length === 0) {
      setNameError('Name is required');
      return false;
    } else if (text.length < 2) {
      setNameError('Name must be at least 2 characters');
      return false;
    } else {
      setNameError('');
      return true;
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

  const validateMobile = (text) => {
    let reg = /^[0-9]{10}$/;
    if (text.length === 0) {
      setMobileError('Mobile number is required');
      return false;
    } else if (!reg.test(text)) {
      setMobileError('Please enter a valid 10-digit mobile number');
      return false;
    } else {
      setMobileError('');
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

  const validatePin = (text) => {
    let reg = /^[0-9]{4}$/;
    if (text.length === 0) {
      setPinError('PIN is required');
      return false;
    } else if (!reg.test(text)) {
      setPinError('PIN must be exactly 4 digits');
      return false;
    } else {
      setPinError('');
      return true;
    }
  };

  // Function to hash sensitive data
  const hashData = async (data) => {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return digest;
  };

  const handleSignUp = async () => {
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isMobileValid = validateMobile(mobile);
    const isPasswordValid = validatePassword(password);
    const isPinValid = validatePin(pin);

    if (isNameValid && isEmailValid && isMobileValid && isPasswordValid && isPinValid) {
      try {
        setIsLoading(true);
        
        // Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Hash the PIN before storing
        const hashedPin = await hashData(pin);
        
        // Store additional user information in Firestore
        await setDoc(doc(db, "users", user.uid), {
          name,
          email,
          mobile,
          pin: hashedPin, // Store hashed PIN
          biometricEnabled: enableBiometric, // Store biometric preference
          createdAt: new Date().toISOString()
        });
        
        // If biometrics are enabled, save credentials securely
        if (enableBiometric && biometricSupported) {
          try {
            await AsyncStorage.setItem(`biometric_enabled_${user.uid}`, 'true');
            await AsyncStorage.setItem(`email_${user.uid}`, email);
            // Note: We don't store the password, it will be entered once and then
            // biometric auth will be used for subsequent logins
          } catch (error) {
            console.error('Error saving biometric preferences:', error);
          }
        }
        
        // Mark onboarding as complete
        await AsyncStorage.setItem('onboardingComplete', 'true');
        
        Alert.alert('Success', 'Account created successfully!');
        navigation.navigate('Login');
      } catch (error) {
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'This email is already registered.';
        }
        
        Alert.alert('Error', errorMessage);
        console.error('Registration error:', error);
      } finally {
        setIsLoading(false);
      }
    }
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
              <Text style={styles.headerText}>Create Account</Text>
              <Text style={styles.subHeaderText}>Sign up to get started</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Icon name="account-outline" size={20} color="#00C805" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    validateName(text);
                  }}
                  onSubmitEditing={() => emailRef.current.focus()}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

              <View style={styles.inputContainer}>
                <Icon name="email-outline" size={20} color="#00C805" style={styles.inputIcon} />
                <TextInput
                  ref={emailRef}
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
                  onSubmitEditing={() => mobileRef.current.focus()}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

              <View style={styles.inputContainer}>
                <Icon name="phone-outline" size={20} color="#00C805" style={styles.inputIcon} />
                <TextInput
                  ref={mobileRef}
                  style={styles.input}
                  placeholder="Mobile Number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={mobile}
                  onChangeText={(text) => {
                    setMobile(text);
                    validateMobile(text);
                  }}
                  onSubmitEditing={() => passwordRef.current.focus()}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  maxLength={10}
                />
              </View>
              {mobileError ? <Text style={styles.errorText}>{mobileError}</Text> : null}

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
                  onSubmitEditing={() => pinRef.current.focus()}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.passwordIcon}
                >
                  <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="#00C805" />
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

              <View style={styles.inputContainer}>
                <Icon name="numeric" size={20} color="#00C805" style={styles.inputIcon} />
                <TextInput
                  ref={pinRef}
                  style={styles.input}
                  placeholder="4-Digit PIN"
                  placeholderTextColor="#999"
                  secureTextEntry={true}
                  keyboardType="number-pad"
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text);
                    validatePin(text);
                  }}
                  returnKeyType="done"
                  maxLength={4}
                  onSubmitEditing={handleSignUp}
                />
              </View>
              {pinError ? <Text style={styles.errorText}>{pinError}</Text> : null}

              {biometricSupported && (
                <View style={styles.biometricContainer}>
                  <Text style={styles.biometricText}>Enable {Platform.OS === 'ios' ? 'Face ID/Touch ID' : 'Fingerprint'} login</Text>
                  <Switch
                    value={enableBiometric}
                    onValueChange={(value) => setEnableBiometric(value)}
                    thumbColor={enableBiometric ? '#00C805' : '#f4f3f4'}
                    trackColor={{ false: '#767577', true: '#00C805' }}
                  />
                </View>
              )}

              <TouchableOpacity 
                style={styles.signUpButton} 
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text style={styles.signUpButtonText}>CREATE ACCOUNT</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginText}>Login</Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  headerContainer: {
    marginBottom: 30,
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
    marginBottom: 20,
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
  signUpButton: {
    backgroundColor: '#00C805',
    borderRadius: 4,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  footerText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  loginText: {
    fontSize: 14,
    color: '#00C805',
    fontWeight: '600',
  },
  biometricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  biometricText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});

export default SignupScreen;
