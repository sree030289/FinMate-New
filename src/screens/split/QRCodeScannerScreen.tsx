import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
  Box,
  Heading,
  Text,
  Button,
  Icon,
  useToast,
  VStack,
  HStack,
  Spinner,
  Center,
  useColorMode
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
//import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { splitExpenseService } from '../../services/firestoreService';
import { QRCodeData } from '../../types';

const QRCodeScannerScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useNavigation<any>();
  const toast = useToast();
  const { colorMode } = useColorMode();
  const isFocused = useIsFocused();
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setLoading(true);
    setError(null);
    
    try {
      // Parse QR code data
      const qrData = JSON.parse(data) as QRCodeData;
      
      // Check if valid QR code structure
      if (!qrData.userId || !qrData.timestamp) {
        throw new Error('Invalid QR code format');
      }
      
      // Add friend via QR code
      await splitExpenseService.addFriendViaQRCode(qrData);
      
      toast.show({
        title: "Success",
        description: `${qrData.name} added as friend`
      });
      
      // Navigate back to friends screen
      navigation.navigate('Friends');
    } catch (error: any) {
      console.error('QR Scan Error:', error);
      setError(error.message || 'Failed to process QR code');
      
      toast.show({
        title: "Error",
        description: error.message || 'Failed to process QR code'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle permission states
  if (hasPermission === null) {
    return (
      <Center flex={1} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <Spinner size="lg" />
        <Text mt={2}>Requesting camera permission...</Text>
      </Center>
    );
  }
  
  if (hasPermission === false) {
    return (
      <Center flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <Icon as={Ionicons} name="camera-off" size="6xl" color="gray.400" mb={4} />
        <Heading size="md" mb={2} textAlign="center">Camera Permission Required</Heading>
        <Text textAlign="center" mb={6}>
          We need camera access to scan QR codes. Please grant permission in your device settings.
        </Text>
        <Button onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </Center>
    );
  }
  
  return (
    <Box flex={1}>
      {/* Only show camera when screen is focused */}
      {isFocused && (
        <Camera 
          style={StyleSheet.absoluteFillObject}
          // barCodeScannerSettings={{
          //   barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr]
          // }}
          // onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <Box flex={1} bg="rgba(0,0,0,0.3)" p={5}>
            {/* Header */}
            <HStack justifyContent="space-between" alignItems="center" mb={5}>
              <Button
                leftIcon={<Icon as={Ionicons} name="arrow-back" size="sm" />}
                variant="ghost"
                _text={{ color: "white" }}
                onPress={() => navigation.goBack()}
              >
                Back
              </Button>
            </HStack>
            
            {/* Scanner overlay */}
            <Center flex={1}>
              <Box
                width="250px"
                height="250px"
                borderWidth={2}
                borderColor="white"
                borderRadius="md"
                overflow="hidden"
              >
                <Box flex={1} opacity={0} />
              </Box>
              
              <Text color="white" mt={4} fontSize="lg" fontWeight="bold">
                Scan Friend's QR Code
              </Text>
              
              {error && (
                <Box bg="red.500" px={4} py={2} borderRadius="md" mt={4}>
                  <Text color="white">{error}</Text>
                </Box>
              )}
              
              {loading && (
                <HStack space={2} alignItems="center" mt={4}>
                  <Spinner color="white" />
                  <Text color="white">Processing...</Text>
                </HStack>
              )}
            </Center>
            
            {/* Bottom action */}
            <VStack space={4} mt={10}>
              {scanned && (
                <Button
                  onPress={() => setScanned(false)}
                  leftIcon={<Icon as={Ionicons} name="scan" size="sm" />}
                  isDisabled={loading}
                >
                  Scan Again
                </Button>
              )}
            </VStack>
          </Box>
        </Camera>
      )}
    </Box>
  );
};

export default QRCodeScannerScreen;
