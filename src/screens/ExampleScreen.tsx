import React, { useState } from 'react';
import { View, Text } from 'react-native';
import SimpleInput from '../components/SimpleInput';

const ExampleScreen = () => {
  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  
  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Example Form</Text>
      
      <SimpleInput
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Enter your name"
      />
      
      <SimpleInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        isNumeric={true} // This will handle proper numeric input formatting
      />
    </View>
  );
};

export default ExampleScreen;
