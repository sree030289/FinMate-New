import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps, 
  ViewStyle,
  TextStyle,
  Platform,
  TouchableOpacity
} from 'react-native';
import theme from '../theme/theme';
import { Icon } from 'native-base';
import { MaterialIcons } from '@expo/vector-icons';

interface SimpleInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputStyle?: ViewStyle;
  errorStyle?: TextStyle;
  isNumeric?: boolean;
  outlineWidth?: number;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

const SimpleInput: React.FC<SimpleInputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputStyle,
  errorStyle,
  isNumeric = false,
  outlineWidth = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);
  
  // Handle numeric input
  const handleChangeText = (text: string) => {
    if (isNumeric) {
      // Only allow numeric input with decimal point
      const numericText = text.replace(/[^0-9.]/g, '');
      // Prevent multiple decimal points
      const parts = numericText.split('.');
      const sanitizedText = parts.length > 1 
        ? `${parts[0]}.${parts.slice(1).join('')}` 
        : numericText;
        
      if (props.onChangeText) {
        props.onChangeText(sanitizedText);
      }
    } else if (props.onChangeText) {
      props.onChangeText(text);
    }
  };

  // Toggle password visibility
  const toggleSecureEntry = () => {
    setSecureTextEntry(prev => !prev);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View style={styles.inputContainer}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Icon as={MaterialIcons} name={leftIcon} size="sm" color="gray.400" />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            {
              borderColor: error 
                ? theme.colors.error[500] 
                : isFocused 
                  ? theme.colors.primary[500] 
                  : theme.colors.gray[300],
              borderWidth: outlineWidth,
              paddingLeft: leftIcon ? 40 : 12,
              paddingRight: (rightIcon || isPassword) ? 40 : 12,
            },
            inputStyle
          ]}
          placeholderTextColor={theme.colors.gray[400]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          {...props}
          onChangeText={handleChangeText}
          keyboardType={isNumeric ? 'decimal-pad' : props.keyboardType}
        />
        {isPassword && (
          <TouchableOpacity 
            style={styles.rightIconContainer} 
            onPress={toggleSecureEntry}
            activeOpacity={0.7}
          >
            <Icon 
              as={MaterialIcons} 
              name={secureTextEntry ? 'visibility' : 'visibility-off'} 
              size="sm" 
              color="gray.500" 
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity 
            style={styles.rightIconContainer} 
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <Icon as={MaterialIcons} name={rightIcon} size="sm" color="gray.500" />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, errorStyle]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: theme.colors.text.dark,
  },
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    backgroundColor: theme.colors.white,
    height: 50,
    borderRadius: 8,
    fontSize: 16,
    color: theme.colors.text.dark,
    width: '100%',
  },
  leftIconContainer: {
    position: 'absolute',
    left: 12,
    height: '100%',
    justifyContent: 'center',
    zIndex: 1,
  },
  rightIconContainer: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    zIndex: 1,
  },
  error: {
    color: theme.colors.error[500],
    fontSize: 12,
    marginTop: 4,
  },
});

export default SimpleInput;
