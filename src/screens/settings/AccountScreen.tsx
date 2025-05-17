import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Icon,
  useColorMode,
  FormControl,
  Input,
  Avatar,
  IconButton,
  useToast,
  Divider,
  Modal,
  Pressable
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { auth, updateProfile } from '../../services/firebase';
import * as ImagePicker from 'expo-image-picker';

const AccountScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  // Mock user data - in a real app, this would come from auth context
  const [user, setUser] = useState({
    displayName: 'Sreeram Vennapusa',
    email: 'sreeram@example.com',
    photoURL: 'https://randomuser.me/api/portraits/men/1.jpg',
    phone: '+91 98765 43210',
    joinedDate: 'May 2023'
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    setFormData({
      displayName: user.displayName,
      phone: user.phone,
    });
  }, [user]);
  
  const handleUpdateProfile = async () => {
    // Validate input
    if (!formData.displayName.trim()) {
      toast.show({
        title: "Error",
        description: "Name cannot be empty",
        variant: "solid",
        bgColor: "error.600"
      });
      return;
    }
    
    setIsUpdating(true);
    
    // In a real app, update profile in Firebase
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setUser({
        ...user,
        displayName: formData.displayName,
        phone: formData.phone,
      });
      
      setIsEditing(false);
      
      toast.show({
        title: "Success",
        description: "Profile updated successfully",
        variant: "solid",
        bgColor: "success.600"
      });
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Failed to update profile",
        variant: "solid",
        bgColor: "error.600"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleChangePassword = async () => {
    if (!password || password.length < 6) {
      toast.show({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "solid",
        bgColor: "error.600"
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.show({
        title: "Success",
        description: "Password changed successfully",
        variant: "solid",
        bgColor: "success.600"
      });
      setShowModal(false);
      setPassword('');
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Failed to change password",
        variant: "solid",
        bgColor: "error.600"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    setIsUpdating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.show({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
        variant: "solid",
        bgColor: "info.600"
      });
      
      // In a real app, navigate to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' as never }],
      });
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Failed to delete account",
        variant: "solid",
        bgColor: "error.600"
      });
    } finally {
      setIsUpdating(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets[0].uri) {
      // In a real app, upload image to storage and update profile
      setUser({
        ...user,
        photoURL: result.assets[0].uri,
      });
      
      toast.show({
        title: "Success",
        description: "Profile picture updated",
        variant: "solid",
        bgColor: "success.600"
      });
    }
  };
  
  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <VStack space={5}>
          {/* Profile Picture */}
          <Box alignItems="center" mb={4}>
            <Pressable onPress={pickImage} position="relative">
              <Avatar 
                size="2xl" 
                source={{ uri: user.photoURL }}
                bg="primary.500"
                borderWidth={4}
                borderColor={colorMode === 'dark' ? 'background.dark' : 'background.light'}
              >
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box 
                position="absolute" 
                bottom={0} 
                right={0} 
                bg="primary.500" 
                p={2} 
                borderRadius="full"
                borderWidth={3}
                borderColor={colorMode === 'dark' ? 'background.dark' : 'background.light'}
              >
                <Icon as={Ionicons} name="camera" size="sm" color="white" />
              </Box>
            </Pressable>
            
            <Text mt={4} fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Member since {user.joinedDate}
            </Text>
          </Box>
          
          {/* Profile Info */}
          <Box bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} p={5} borderRadius="lg" shadow={1}>
            <HStack justifyContent="space-between" alignItems="center" mb={4}>
              <Text fontSize="lg" fontWeight="bold">Profile Information</Text>
              {!isEditing ? (
                <Button 
                  variant="ghost"
                  leftIcon={<Icon as={Ionicons} name="pencil-outline" size="sm" />}
                  onPress={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              ) : (
                <HStack space={2}>
                  <Button 
                    variant="ghost" 
                    onPress={() => {
                      setIsEditing(false);
                      setFormData({
                        displayName: user.displayName,
                        phone: user.phone,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    leftIcon={<Icon as={Ionicons} name="save-outline" size="sm" />}
                    onPress={handleUpdateProfile}
                    isLoading={isUpdating}
                  >
                    Save
                  </Button>
                </HStack>
              )}
            </HStack>
            
            <VStack space={4}>
              {isEditing ? (
                <>
                  <FormControl>
                    <FormControl.Label>Full Name</FormControl.Label>
                    <Input 
                      value={formData.displayName}
                      onChangeText={(value) => setFormData({...formData, displayName: value})}
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormControl.Label>Phone Number</FormControl.Label>
                    <Input 
                      value={formData.phone}
                      onChangeText={(value) => setFormData({...formData, phone: value})}
                      keyboardType="phone-pad"
                    />
                  </FormControl>
                </>
              ) : (
                <>
                  <VStack space={1}>
                    <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Full Name</Text>
                    <Text fontSize="md">{user.displayName}</Text>
                  </VStack>
                  
                  <VStack space={1}>
                    <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Email Address</Text>
                    <Text fontSize="md">{user.email}</Text>
                  </VStack>
                  
                  <VStack space={1}>
                    <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Phone Number</Text>
                    <Text fontSize="md">{user.phone}</Text>
                  </VStack>
                </>
              )}
            </VStack>
          </Box>
          
          {/* Security */}
          <Box bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} p={5} borderRadius="lg" shadow={1}>
            <Text fontSize="lg" fontWeight="bold" mb={4}>Security</Text>
            
            <VStack space={4}>
              <Pressable 
                onPress={() => setShowModal(true)}
                _pressed={{ opacity: 0.7 }}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Icon as={Ionicons} name="key-outline" size="md" color="primary.500" />
                    <Text>Change Password</Text>
                  </HStack>
                  <Icon as={Ionicons} name="chevron-forward" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} />
                </HStack>
              </Pressable>
              
              <Divider />
              
              <Pressable 
                onPress={() => {
                  toast.show({
                    title: "Two-Factor Authentication",
                    description: "This feature will be available soon",
                    variant: "solid",
                    bgColor: "info.600"
                  });
                }}
                _pressed={{ opacity: 0.7 }}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Icon as={Ionicons} name="shield-checkmark-outline" size="md" color="primary.500" />
                    <Text>Two-Factor Authentication</Text>
                  </HStack>
                  <Icon as={Ionicons} name="chevron-forward" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} />
                </HStack>
              </Pressable>
              
              <Divider />
              
              <Pressable 
                onPress={() => navigation.navigate('APISettings')}
                _pressed={{ opacity: 0.7 }}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Icon as={Ionicons} name="key-outline" size="md" color="primary.500" />
                    <Text>API Settings</Text>
                  </HStack>
                  <Icon as={Ionicons} name="chevron-forward" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} />
                </HStack>
              </Pressable>
            </VStack>
          </Box>
          
          {/* Danger Zone */}
          <Box 
            bg={colorMode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'} 
            p={5} 
            borderRadius="lg" 
            borderWidth={1}
            borderColor="red.500"
          >
            <Text fontSize="lg" fontWeight="bold" mb={4} color="red.500">Danger Zone</Text>
            
            <Text mb={4} color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Deleting your account will permanently remove all your data. This action cannot be undone.
            </Text>
            
            <Button 
              colorScheme="danger" 
              leftIcon={<Icon as={Ionicons} name="trash-outline" size="sm" />}
              onPress={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </Button>
          </Box>
        </VStack>
      </Box>
      
      {/* Change Password Modal */}
      <Modal isOpen={showModal} onClose={() => {
        setShowModal(false);
        setPassword('');
      }}>
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Change Password</Modal.Header>
          <Modal.Body>
            <FormControl>
              <FormControl.Label>Current Password</FormControl.Label>
              <Input type="password" placeholder="Enter current password" />
            </FormControl>
            
            <FormControl mt={4}>
              <FormControl.Label>New Password</FormControl.Label>
              <Input 
                type="password" 
                placeholder="Enter new password"
                value={password}
                onChangeText={setPassword}
              />
              <FormControl.HelperText>
                Password must be at least 6 characters
              </FormControl.HelperText>
            </FormControl>
            
            <FormControl mt={4}>
              <FormControl.Label>Confirm New Password</FormControl.Label>
              <Input type="password" placeholder="Confirm new password" />
            </FormControl>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => {
                setShowModal(false);
                setPassword('');
              }}>
                Cancel
              </Button>
              <Button 
                onPress={handleChangePassword}
                isLoading={isUpdating}
              >
                Change Password
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
      
      {/* Delete Account Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Delete Account</Modal.Header>
          <Modal.Body>
            <VStack space={3}>
              <Icon 
                as={Ionicons} 
                name="warning" 
                size="4xl" 
                color="red.500" 
                alignSelf="center"
                mb={2}
              />
              
              <Text fontWeight="bold">Are you sure you want to delete your account?</Text>
              
              <Text>
                This will permanently delete your account and all associated data. 
                You won't be able to recover your information after this action.
              </Text>
              
              <Box bg="red.50" p={3} borderRadius="md" mt={2}>
                <Text color="red.500">
                  To confirm, please type "DELETE" below:
                </Text>
                <Input mt={2} placeholder="Type DELETE to confirm" />
              </Box>
            </VStack>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button 
                variant="ghost" 
                onPress={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="danger"
                onPress={handleDeleteAccount}
                isLoading={isUpdating}
              >
                Delete Account
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </KeyboardAwareScrollView>
  );
};

export default AccountScreen;
