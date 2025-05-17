import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Box, 
  Text, 
  VStack, 
  HStack, 
  Button, 
  Icon, 
  useColorMode, 
  Spinner, 
  Heading,
  Image,
  ScrollView,
  useToast,
  Select,
  CheckIcon,
  FormControl,
  Input
} from 'native-base';
import { Camera } from 'expo-camera';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth, db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

type ReceiptItem = {
  name: string;
  price: number;
  quantity: number;
};

type ReceiptData = {
  vendor: string;
  date: string;
  total: number;
  items: ReceiptItem[];
  tax: number;
  imageUrl: string;
  category: string;
};

const ScanReceiptScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const cameraRef = useRef<Camera>(null);

  React.useEffect(() => {
    (async () => {
      // Request camera permission
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
      
      // Pre-load categories for quick assignment
      if (auth.currentUser) {
        try {
          const categoriesSnapshot = await getDocs(
            collection(db, 'categories')
          );
          
          const categoriesData = categoriesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setCategories(categoriesData);
        } catch (error) {
          console.error('Error loading categories:', error);
        }
      }
    })();
  }, []);
  
  // Adding categories state and edit functionality
  const [categories, setCategories] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
        processReceipt(photo.uri);
      } catch (error) {
        console.error('Error taking picture:', error);
        toast.show({
          title: "Error",
          description: "Failed to capture image",
          status: "error"
        });
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setCapturedImage(result.assets[0].uri);
      processReceipt(result.assets[0].uri);
    }
  };

  // Enhanced receipt processing with better error handling
  const processReceipt = async (imageUri: string) => {
    setIsProcessing(true);
    
    try {
      // Optimize image before upload
      const manipResult = await manipulateAsync(
        imageUri,
        [{ resize: { width: 1000 } }],
        { format: SaveFormat.JPEG, compress: 0.8 }
      );
      
      // Upload to Firebase Storage
      const response = await fetch(manipResult.uri);
      const blob = await response.blob();
      const fileName = `receipts/${auth.currentUser?.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Check if we can access OCR API (for pro users)
      let ocrResult: any = null;
      
      try {
        // Check if user is premium
        const userQuery = query(
          collection(db, 'users'), 
          where('uid', '==', auth.currentUser?.uid),
          where('isPremium', '==', true)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          // For pro users, attempt to call OCR API
          const apiKey = Constants.expoConfig?.extra?.ocrApiKey || '';
          
          if (apiKey) {
            // Convert image to base64
            const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            
            // Call OCR API (example implementation)
            const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': apiKey,
              },
              body: `base64Image=${base64}&language=eng&isOverlayRequired=false&filetype=jpg`,
            });
            
            if (ocrResponse.ok) {
              ocrResult = await ocrResponse.json();
            }
          }
        }
      } catch (ocrError) {
        console.error('OCR processing error:', ocrError);
        // Continue with mock data if OCR fails
      }
      
      // Now generate receipt data (either from OCR or mock)
      let detectedData: ReceiptData;
      
      if (ocrResult && ocrResult.ParsedResults?.length > 0) {
        // Parse OCR result to extract receipt information
        const parsedText = ocrResult.ParsedResults[0].ParsedText;
        
        // This would need a complex parsing algorithm in real app
        // For now we'll still use mock data with an improved delay
        setTimeout(() => {
          const mockData: ReceiptData = getMockReceiptData(downloadURL);
          setReceiptData(mockData);
          setSelectedCategory(mockData.category);
          setIsProcessing(false);
        }, 1500);
      } else {
        // Use mock data with simulated processing delay
        setTimeout(() => {
          const mockData: ReceiptData = getMockReceiptData(downloadURL);
          setReceiptData(mockData);
          setSelectedCategory(mockData.category);
          setIsProcessing(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.show({
        title: "Error",
        description: "Failed to process the receipt",
        status: "error"
      });
      setIsProcessing(false);
    }
  };
  
  // Generate more realistic mock receipt data
  const getMockReceiptData = (imageUrl: string): ReceiptData => {
    // Get random vendor
    const vendors = ["Grocery Mart", "Food World", "Super Bazaar", "Fresh Mart", "Daily Needs"];
    const vendor = vendors[Math.floor(Math.random() * vendors.length)];
    
    // Generate random items
    const groceryItems = [
      { name: "Milk", price: 68.00, baseQuantity: 1 },
      { name: "Bread", price: 45.00, baseQuantity: 1 },
      { name: "Eggs (12)", price: 120.00, baseQuantity: 1 },
      { name: "Rice 5kg", price: 350.00, baseQuantity: 1 },
      { name: "Flour 1kg", price: 45.00, baseQuantity: 1 },
      { name: "Vegetables", price: 155.00, baseQuantity: 1 },
      { name: "Fruits", price: 220.00, baseQuantity: 1 },
      { name: "Chicken", price: 280.00, baseQuantity: 1 },
      { name: "Fish", price: 350.00, baseQuantity: 1 },
      { name: "Yogurt", price: 55.00, baseQuantity: 1 },
      { name: "Chocolate", price: 85.00, baseQuantity: 1 },
      { name: "Biscuits", price: 40.00, baseQuantity: 1 },
      { name: "Soft Drink", price: 65.00, baseQuantity: 1 },
    ];
    
    // Select 4-8 random items
    const numItems = 4 + Math.floor(Math.random() * 5);
    const selectedItems: ReceiptItem[] = [];
    
    for (let i = 0; i < numItems; i++) {
      const randomIndex = Math.floor(Math.random() * groceryItems.length);
      const item = groceryItems[randomIndex];
      
      // Random quantity between 1-3
      const quantity = Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 1;
      
      selectedItems.push({
        name: item.name,
        price: item.price,
        quantity: quantity
      });
      
      // Remove selected item to avoid duplicates
      groceryItems.splice(randomIndex, 1);
    }
    
    // Calculate total and tax
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const total = subtotal + tax;
    
    return {
      vendor,
      date: new Date().toISOString().split('T')[0],
      total,
      items: selectedItems,
      tax,
      imageUrl,
      category: "groceries" // Default category
    };
  };
  
  // Modified save transaction function to use selected category
  const saveTransaction = async () => {
    if (!receiptData || !auth.currentUser) return;
    
    try {
      // Save to Firestore with the selected category
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'transactions'), {
        vendor: receiptData.vendor,
        title: receiptData.vendor, // For consistency with other transactions
        date: receiptData.date,
        amount: -receiptData.total, // Negative for expense
        category: selectedCategory || receiptData.category,
        items: receiptData.items,
        tax: receiptData.tax,
        receiptUrl: receiptData.imageUrl,
        type: 'expense',
        paymentMethod: 'card', // Default payment method
        createdAt: serverTimestamp(),
      });
      
      toast.show({
        title: "Success",
        description: "Transaction saved successfully",
        status: "success"
      });
      
      navigation.goBack();
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.show({
        title: "Error",
        description: "Failed to save transaction",
        status: "error"
      });
    }
  };
  
  const splitWithFriends = () => {
    if (!receiptData) return;
    
    navigation.navigate('AddExpense', {
      initialData: {
        title: receiptData.vendor,
        amount: receiptData.total,
        date: receiptData.date,
        category: receiptData.category,
        receiptUrl: receiptData.imageUrl,
        items: receiptData.items
      }
    });
  };
  
  const retryScanning = () => {
    setCapturedImage(null);
    setReceiptData(null);
  };

  if (hasPermission === null) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <Spinner size="lg" color="primary.500" />
        <Text mt={4}>Requesting camera permission...</Text>
      </Box>
    );
  }

  if (hasPermission === false) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <Icon as={MaterialIcons} name="no-photography" size="6xl" color="gray.400" mb={4} />
        <Heading size="md">Camera Permission Required</Heading>
        <Text textAlign="center" mt={2} mb={6}>
          We need camera access to scan receipts for expense tracking.
        </Text>
        <Button 
          onPress={() => Camera.requestCameraPermissionsAsync()}
          colorScheme="primary"
        >
          Grant Permission
        </Button>
        <Button 
          onPress={pickImage} 
          variant="ghost" 
          mt={4}
        >
          Select from Gallery
        </Button>
      </Box>
    );
  }

  if (capturedImage) {
    return (
      <Box flex={1} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <ScrollView>
          <Box p={5}>
            <HStack justifyContent="space-between" alignItems="center" mb={5}>
              <Heading size="lg">Receipt Details</Heading>
              <Button variant="ghost" onPress={retryScanning}>
                <Icon as={Ionicons} name="refresh" size="md" color="primary.500" />
              </Button>
            </HStack>
            
            {isProcessing ? (
              <Box alignItems="center" justifyContent="center" py={10}>
                <Spinner size="lg" color="primary.500" mb={4} />
                <Text fontSize="md" fontWeight="medium">Analyzing Receipt...</Text>
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} mt={2}>
                  This may take a few seconds
                </Text>
              </Box>
            ) : receiptData ? (
              <VStack space={4}>
                <Box 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                  borderRadius="lg"
                  p={4}
                  shadow={2}
                >
                  <HStack justifyContent="space-between" mb={2}>
                    <VStack>
                      <Text fontSize="lg" fontWeight="bold">{receiptData.vendor}</Text>
                      <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                        {receiptData.date}
                      </Text>
                    </VStack>
                    <Text fontSize="lg" fontWeight="bold">₹{receiptData.total.toFixed(2)}</Text>
                  </HStack>
                </Box>
                
                {/* Added category selector */}
                <Box 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                  borderRadius="lg"
                  p={4}
                  shadow={2}
                >
                  <FormControl>
                    <FormControl.Label>Category</FormControl.Label>
                    <Select
                      selectedValue={selectedCategory}
                      minWidth="200"
                      accessibilityLabel="Choose Category"
                      placeholder="Choose Category"
                      _selectedItem={{
                        bg: "primary.100",
                        endIcon: <CheckIcon size="5" />
                      }}
                      mt={1}
                      onValueChange={itemValue => setSelectedCategory(itemValue)}
                    >
                      <Select.Item label="Food & Dining" value="food" />
                      <Select.Item label="Groceries" value="groceries" />
                      <Select.Item label="Shopping" value="shopping" />
                      <Select.Item label="Entertainment" value="entertainment" />
                      <Select.Item label="Transportation" value="transportation" />
                      <Select.Item label="Utilities" value="utilities" />
                      <Select.Item label="Healthcare" value="healthcare" />
                      <Select.Item label="Education" value="education" />
                      <Select.Item label="Personal Care" value="personal_care" />
                      <Select.Item label="Other" value="other" />
                    </Select>
                  </FormControl>
                </Box>
                
                <Box 
                  bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                  borderRadius="lg"
                  p={4}
                  shadow={2}
                >
                  <HStack justifyContent="space-between" mb={3}>
                    <Text fontSize="md" fontWeight="medium">Items</Text>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      leftIcon={<Icon as={Ionicons} name={isEditing ? "checkmark" : "create-outline"} />}
                      onPress={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? "Done" : "Edit"}
                    </Button>
                  </HStack>
                  
                  {receiptData.items.map((item, index) => (
                    <HStack 
                      key={index} 
                      justifyContent="space-between" 
                      py={2}
                      borderBottomWidth={index < receiptData.items.length - 1 ? 1 : 0}
                      borderBottomColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}
                    >
                      <HStack space={2} flex={1}>
                        {isEditing ? (
                          <>
                            <Input 
                              w="40px" 
                              value={item.quantity.toString()} 
                              keyboardType="numeric"
                              onChangeText={(val) => {
                                const newItems = [...receiptData.items];
                                newItems[index].quantity = parseInt(val) || 1;
                                setReceiptData({...receiptData, items: newItems});
                              }}
                            />
                            <Text>x</Text>
                            <Input 
                              flex={1}
                              value={item.name}
                              onChangeText={(val) => {
                                const newItems = [...receiptData.items];
                                newItems[index].name = val;
                                setReceiptData({...receiptData, items: newItems});
                              }}
                            />
                          </>
                        ) : (
                          <>
                            <Text>{item.quantity}x</Text>
                            <Text>{item.name}</Text>
                          </>
                        )}
                      </HStack>
                      <Text>₹{(item.price * item.quantity).toFixed(2)}</Text>
                    </HStack>
                  ))}
                  
                  <HStack justifyContent="space-between" mt={3} py={2} borderTopWidth={1} borderTopColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}>
                    <Text>Tax</Text>
                    <Text>₹{receiptData.tax.toFixed(2)}</Text>
                  </HStack>
                  
                  <HStack justifyContent="space-between" mt={1} py={2} borderTopWidth={1} borderTopColor={colorMode === 'dark' ? 'border.dark' : 'border.light'}>
                    <Text fontWeight="bold">Total</Text>
                    <Text fontWeight="bold">₹{receiptData.total.toFixed(2)}</Text>
                  </HStack>
                </Box>
                
                <Box>
                  <Text fontSize="sm" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'} mb={2}>
                    Receipt Image
                  </Text>
                  <Image 
                    source={{ uri: capturedImage }} 
                    alt="Receipt" 
                    height={200} 
                    width="100%" 
                    resizeMode="cover"
                    borderRadius="lg"
                  />
                </Box>
                
                <HStack space={4} mt={4}>
                  <Button 
                    flex={1}
                    leftIcon={<Icon as={Ionicons} name="save-outline" />}
                    onPress={saveTransaction}
                    colorScheme="primary"
                  >
                    Save Transaction
                  </Button>
                  <Button 
                    flex={1}
                    leftIcon={<Icon as={Ionicons} name="people-outline" />}
                    onPress={splitWithFriends}
                    variant="outline"
                  >
                    Split with Friends
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <Box alignItems="center" justifyContent="center" py={10}>
                <Icon as={Ionicons} name="alert-circle-outline" size="6xl" color="red.500" mb={4} />
                <Heading size="md">Processing Failed</Heading>
                <Text textAlign="center" mt={2} mb={6} color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                  We couldn't read the receipt details. Please try again with a clearer image.
                </Text>
                <Button onPress={retryScanning}>Try Again</Button>
              </Box>
            )}
          </Box>
        </ScrollView>
      </Box>
    );
  }

  return (
    <Box flex={1}>
      <Camera 
        style={StyleSheet.absoluteFill} 
        ref={cameraRef}
      >
        <Box 
          flex={1} 
          bg="rgba(0,0,0,0.3)"
          justifyContent="space-between"
        >
          {/* Viewfinder */}
          <Box flex={1} justifyContent="center" alignItems="center">
            <Box 
              width="80%" 
              height="50%"
              borderWidth={2}
              borderColor="white"
              borderStyle="dashed"
              borderRadius={10}
            />
            <Text color="white" mt={2}>Position receipt within frame</Text>
          </Box>
          
          {/* Bottom controls */}
          <Box p={5}>
            <HStack justifyContent="space-around" alignItems="center">
              <Button 
                variant="unstyled"
                onPress={pickImage}
                _pressed={{ opacity: 0.5 }}
              >
                <Icon as={Ionicons} name="image-outline" size="xl" color="white" />
                <Text color="white" fontSize="xs" mt={1}>Gallery</Text>
              </Button>
              
              <TouchableOpacity onPress={takePicture}>
                <Box 
                  width={70} 
                  height={70} 
                  borderRadius={35} 
                  bg="white" 
                  justifyContent="center" 
                  alignItems="center" 
                >
                  <Box 
                    width={60} 
                    height={60} 
                    borderRadius={30} 
                    bg="primary.500" 
                  />
                </Box>
              </TouchableOpacity>
              
              <Button 
                variant="unstyled"
                onPress={() => navigation.goBack()}
                _pressed={{ opacity: 0.5 }}
              >
                <Icon as={Ionicons} name="close-outline" size="xl" color="white" />
                <Text color="white" fontSize="xs" mt={1}>Cancel</Text>
              </Button>
            </HStack>
          </Box>
        </Box>
      </Camera>
    </Box>
  );
};

export default ScanReceiptScreen;
