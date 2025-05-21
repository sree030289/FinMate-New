import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import SimpleInput from '../../components/SimpleInput';
import { Button } from 'native-base';
import theme from '../../theme/theme';

/**
 * This is an example screen showing how to replace various NativeBase inputs
 * with our new SimpleInput component to avoid casting issues
 */
const InputReplacementExample = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    amount: '',
    password: '',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log('Form submitted:', formData);
    // Handle form submission
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Updated Input Fields</Text>
      <Text style={styles.subtitle}>
        These input fields use the new SimpleInput component to prevent casting issues
      </Text>
      
      {/* Replace NativeBase Input with SimpleInput */}
      <SimpleInput
        label="Full Name"
        value={formData.name}
        onChangeText={(value) => handleChange('name', value)}
        placeholder="Enter your full name"
        leftIcon="person" 
      />
      
      {/* Email input with validation */}
      <SimpleInput
        label="Email"
        value={formData.email}
        onChangeText={(value) => handleChange('email', value)}
        placeholder="email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        leftIcon="email"
      />
      
      {/* Numeric input for phone */}
      <SimpleInput
        label="Phone Number"
        value={formData.phone}
        onChangeText={(value) => handleChange('phone', value)}
        placeholder="(123) 456-7890"
        keyboardType="phone-pad"
        leftIcon="phone"
      />
      
      {/* Numeric input for amount */}
      <SimpleInput
        label="Amount"
        value={formData.amount}
        onChangeText={(value) => handleChange('amount', value)}
        placeholder="0.00"
        isNumeric={true}
        leftIcon="attach-money"
      />
      
      {/* Password input with toggle visibility */}
      <SimpleInput
        label="Password"
        value={formData.password}
        onChangeText={(value) => handleChange('password', value)}
        placeholder="Enter password"
        isPassword={true}
        leftIcon="lock"
      />
      
      {/* Multiline text area for notes */}
      <SimpleInput
        label="Notes"
        value={formData.notes}
        onChangeText={(value) => handleChange('notes', value)}
        placeholder="Additional notes..."
        multiline={true}
        numberOfLines={4}
        textAlignVertical="top"
        inputStyle={styles.textArea}
      />
      
      <Button 
        onPress={handleSubmit}
        size="lg"
        colorScheme="primary"
        mt={4}
      >
        Submit Form
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.light,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.text.dark,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: theme.colors.text.muted,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
});

export default InputReplacementExample;
