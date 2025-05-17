import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  Heading,
  VStack,
  HStack,
  FormControl,
  Input,
  Button,
  useColorMode,
  Icon,
  useToast,
  Divider,
  IconButton,
  Link,
  Pressable
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { storeAPIKey, getAPIKey, isAPIKeySet } from '../../services/ocrService';

// Use a safer import pattern for optional dependencies
let Clipboard;
try {
  Clipboard = require('expo-clipboard');
} catch (error) {
  console.warn('expo-clipboard not available, clipboard functionality will be disabled');
  // Provide fallback implementation
  Clipboard = {
    setStringAsync: async () => {
      console.warn('Clipboard functionality not available');
      return false;
    },
    getStringAsync: async () => {
      console.warn('Clipboard functionality not available');
      return '';
    }
  };
}

const APISettingsScreen = () => {
  const { colorMode } = useColorMode();
  const toast = useToast();

  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    checkForExistingKey();
  }, []);

  const checkForExistingKey = async () => {
    setIsLoading(true);
    try {
      const exists = await isAPIKeySet();
      setHasExistingKey(exists);
      
      if (exists) {
        const key = await getAPIKey();
        if (key) {
          // Mask the key except for the last 4 characters
          const maskedKey = key.substring(0, key.length - 4).replace(/./g, '•') + 
                           key.substring(key.length - 4);
          setApiKey(maskedKey);
        }
      }
    } catch (error) {
      console.error('Error checking API key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveKey = async () => {
    if (!apiKey.trim()) {
      toast.show({
        title: "Error",
        description: "Please enter an API key",
        status: "error"
      });
      return;
    }

    setIsLoading(true);
    try {
      await storeAPIKey(apiKey);
      
      toast.show({
        title: "Success",
        description: "API key saved successfully",
        status: "success"
      });
      
      setHasExistingKey(true);
      setShowKey(false);
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.show({
        title: "Error",
        description: "Failed to save API key",
        status: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setApiKey(text);
        toast.show({
          title: "Pasted",
          description: "Text pasted from clipboard",
          status: "info"
        });
      }
    } catch (error) {
      console.error('Failed to paste:', error);
      toast.show({
        title: "Error",
        description: "Could not access clipboard",
        status: "error"
      });
    }
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <VStack space={6}>
          <Box>
            <Heading size="lg" mb={2}>OCR API Settings</Heading>
            <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              OCR (Optical Character Recognition) allows the app to extract text from receipt images.
              You need an API key to use this feature.
            </Text>
          </Box>

          <Box 
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
            p={5} 
            borderRadius="lg"
            shadow={1}
          >
            <VStack space={4}>
              <FormControl>
                <FormControl.Label>OCR.space API Key</FormControl.Label>
                <Input
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder={hasExistingKey ? "API key is stored securely" : "Enter your API key"}
                  type={showKey ? "text" : "password"}
                  InputRightElement={
                    <HStack space={1} mr={2}>
                      {hasExistingKey && (
                        <IconButton
                          icon={<Icon as={Ionicons} name={showKey ? "eye-off" : "eye"} />}
                          borderRadius="full"
                          variant="ghost"
                          onPress={() => setShowKey(!showKey)}
                        />
                      )}
                      <IconButton
                        icon={<Icon as={Ionicons} name="clipboard-outline" />}
                        borderRadius="full"
                        variant="ghost"
                        onPress={handlePaste}
                      />
                    </HStack>
                  }
                />
                <FormControl.HelperText>
                  {hasExistingKey ? 
                    "You have already set an API key. Enter a new one to replace it." : 
                    "Get a free API key from OCR.space"}
                </FormControl.HelperText>
              </FormControl>

              <Button
                onPress={handleSaveKey}
                isLoading={isLoading}
                leftIcon={<Icon as={Ionicons} name="save-outline" />}
                mb={2}
              >
                Save API Key
              </Button>
            </VStack>
          </Box>

          <Divider my={2} />

          <VStack space={4}>
            <Heading size="md">How to get an API key</Heading>
            
            <VStack space={4} bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} p={4} borderRadius="md">
              <HStack alignItems="center" space={2}>
                <Box 
                  bg="primary.500" 
                  borderRadius="full" 
                  w={6} 
                  h={6}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontWeight="bold">1</Text>
                </Box>
                <Text flex={1}>
                  Visit <Link href="https://ocr.space/ocrapi" isExternal>OCR.space</Link> and create an account
                </Text>
              </HStack>

              <HStack alignItems="center" space={2}>
                <Box 
                  bg="primary.500" 
                  borderRadius="full" 
                  w={6} 
                  h={6}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontWeight="bold">2</Text>
                </Box>
                <Text flex={1}>
                  Register for a free API key (allows 500 requests per day)
                </Text>
              </HStack>

              <HStack alignItems="center" space={2}>
                <Box 
                  bg="primary.500" 
                  borderRadius="full" 
                  w={6} 
                  h={6}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontWeight="bold">3</Text>
                </Box>
                <Text flex={1}>
                  Copy the API key and paste it in the field above
                </Text>
              </HStack>

              <HStack alignItems="center" space={2}>
                <Box 
                  bg="primary.500" 
                  borderRadius="full" 
                  w={6} 
                  h={6}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontWeight="bold">4</Text>
                </Box>
                <Text flex={1}>
                  Your key will be stored securely on your device
                </Text>
              </HStack>
            </VStack>

            <Button
              variant="outline"
              leftIcon={<Icon as={Ionicons} name="open-outline" />}
              onPress={() => {
                toast.show({
                  title: "Opening website",
                  description: "Redirecting to OCR.space",
                  status: "info"
                });
              }}
            >
              Get API Key
            </Button>
          </VStack>
        </VStack>
      </Box>
    </KeyboardAwareScrollView>
  );
};

export default APISettingsScreen;
