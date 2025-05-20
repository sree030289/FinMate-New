import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Avatar,
  FlatList,
  Pressable,
  Button,
  useColorMode,
  IconButton,
  Tabs,
  Spinner,
  useToast,
  Center,
  Divider
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProps } from '../../types/navigation';
import { splitExpenseService } from '../../services/firestoreService';
import { FriendRequest } from '../../types';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Share, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';

const FriendRequestsScreen = () => {
  const navigation = useNavigation<any>();
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  const [tabIndex, setTabIndex] = useState(0);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [qrCodeData, setQRCodeData] = useState<string>('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState({
    incoming: false,
    outgoing: false,
    qrCode: false,
    action: false
  });

  // Load requests when screen mounts
  useEffect(() => {
    fetchRequests();
    generateQRCode();
  }, []);

  // Fetch friend requests
  const fetchRequests = async () => {
    setLoading(prev => ({ ...prev, incoming: true, outgoing: true }));
    
    try {
      // Fetch incoming requests
      const incoming = await splitExpenseService.getPendingFriendRequests();
      setIncomingRequests(incoming);
    } catch (error) {
      console.error('Error fetching incoming requests:', error);
      toast.show({
        title: "Error",
        description: "Failed to load incoming requests",
        status: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, incoming: false }));
    }

    try {
      // Fetch outgoing requests
      const outgoing = await splitExpenseService.getSentFriendRequests();
      setOutgoingRequests(outgoing);
    } catch (error) {
      console.error('Error fetching outgoing requests:', error);
      toast.show({
        title: "Error",
        description: "Failed to load outgoing requests",
        status: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, outgoing: false }));
    }
  };

  // Generate QR code with current user's data
  const generateQRCode = async () => {
    setLoading(prev => ({ ...prev, qrCode: true }));
    
    try {
      const qrData = await splitExpenseService.generateQRCodeData();
      setQRCodeData(JSON.stringify(qrData));
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.show({
        title: "Error",
        description: "Failed to generate QR code",
        status: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, qrCode: false }));
    }
  };

  // Handle accept/decline friend request
  const handleRequestResponse = async (requestId: string, accept: boolean) => {
    setLoading(prev => ({ ...prev, action: true }));
    
    try {
      await splitExpenseService.respondToFriendRequest(requestId, accept);
      
      // Remove from list
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
      
      toast.show({
        title: accept ? "Friend Request Accepted" : "Friend Request Declined",
        status: accept ? "success" : "info"
      });
      
      if (accept) {
        // Refresh friends list if we accepted
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      toast.show({
        title: "Error",
        description: "Failed to process the friend request",
        status: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Send a friend request via email
  const sendFriendRequest = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.show({
        title: "Error",
        description: "Please enter a valid email address",
        status: "error"
      });
      return;
    }
    
    setLoading(prev => ({ ...prev, action: true }));
    
    try {
      await splitExpenseService.sendFriendRequest(inviteEmail);
      
      // Clear input and refresh
      setInviteEmail('');
      fetchRequests();
      
      toast.show({
        title: "Friend Request Sent",
        description: `A friend request has been sent to ${inviteEmail}`,
        status: "success"
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.show({
        title: "Error",
        description: error.message || "Failed to send friend request",
        status: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Share QR code or invitation
  const shareInvite = async () => {
    const url = Linking.createURL('invite', {
      queryParams: { data: qrCodeData }
    });
    
    try {
      await Share.share({
        message: `Join me on FinMate! Use this link to add me as a friend: ${url}`,
        url
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
      toast.show({
        title: "Error",
        description: "Failed to share invitation",
        status: "error"
      });
    }
  };

  // Copy invite link to clipboard
  const copyInviteLink = async () => {
    const url = Linking.createURL('invite', {
      queryParams: { data: qrCodeData }
    });
    
    try {
      await Clipboard.setStringAsync(url);
      toast.show({
        title: "Link Copied",
        description: "Invite link copied to clipboard",
        status: "success"
      });
    } catch (error) {
      console.error('Error copying link:', error);
      toast.show({
        title: "Error",
        description: "Failed to copy invite link",
        status: "error"
      });
    }
  };

  return (
    <Box flex={1} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'} p={5}>
      <Heading size="lg" mb={5}>Friend Requests</Heading>
      
      <Tabs
        value={tabIndex}
        onChange={setTabIndex}
        isFitted
        mb={5}
        variant="soft-rounded"
        colorScheme="primary"
      >
        <Tabs.Bar>
          <Tabs.Tab>Incoming {incomingRequests.length > 0 && `(${incomingRequests.length})`}</Tabs.Tab>
          <Tabs.Tab>Outgoing {outgoingRequests.length > 0 && `(${outgoingRequests.length})`}</Tabs.Tab>
          <Tabs.Tab>Invite</Tabs.Tab>
        </Tabs.Bar>
        
        <Tabs.Views>
          {/* Incoming Requests Tab */}
          <Tabs.View>
            {loading.incoming ? (
              <Center flex={1} p={10}>
                <Spinner size="lg" />
                <Text mt={2} color="muted.500">Loading requests...</Text>
              </Center>
            ) : (
              <FlatList
                data={incomingRequests}
                renderItem={({ item }) => (
                  <Box 
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                    p={4} 
                    borderRadius="lg"
                    mb={3}
                    shadow={1}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <HStack space={3} alignItems="center" flex={1}>
                        <Avatar 
                          size="md"
                          source={item.sender.avatar ? { uri: item.sender.avatar } : undefined}
                        >
                          {item.sender.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <VStack flex={1}>
                          <Text fontWeight="medium">{item.sender.name}</Text>
                          <Text fontSize="xs" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                            {item.sender.email}
                          </Text>
                          <Text fontSize="xs" mt={1} color={colorMode === 'dark' ? 'muted.400' : 'muted.500'}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </VStack>
                      </HStack>
                      
                      <HStack space={2} alignItems="center">
                        <IconButton
                          icon={<Icon as={Ionicons} name="close-circle-outline" />}
                          variant="ghost"
                          colorScheme="danger"
                          isDisabled={loading.action}
                          onPress={() => handleRequestResponse(item.id, false)}
                        />
                        <IconButton
                          icon={<Icon as={Ionicons} name="checkmark-circle-outline" />}
                          variant="ghost"
                          colorScheme="success"
                          isDisabled={loading.action}
                          onPress={() => handleRequestResponse(item.id, true)}
                        />
                      </HStack>
                    </HStack>
                  </Box>
                )}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                  <Box p={10} alignItems="center">
                    <Icon as={Ionicons} name="mail-outline" size="6xl" color="gray.300" />
                    <Text mt={2} color="gray.500" textAlign="center">
                      No pending friend requests
                    </Text>
                  </Box>
                }
              />
            )}
          </Tabs.View>
          
          {/* Outgoing Requests Tab */}
          <Tabs.View>
            {loading.outgoing ? (
              <Center flex={1} p={10}>
                <Spinner size="lg" />
                <Text mt={2} color="muted.500">Loading sent requests...</Text>
              </Center>
            ) : (
              <FlatList
                data={outgoingRequests}
                renderItem={({ item }) => (
                  <Box 
                    bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
                    p={4} 
                    borderRadius="lg"
                    mb={3}
                    shadow={1}
                  >
                    <HStack justifyContent="space-between" alignItems="center">
                      <VStack flex={1}>
                        <Text fontWeight="medium">Request sent to:</Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
                          {item.recipient.email}
                        </Text>
                        <Text fontSize="xs" mt={1} color={colorMode === 'dark' ? 'muted.400' : 'muted.500'}>
                          Sent on {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </VStack>
                      
                      <HStack space={2} alignItems="center">
                        <Text fontSize="sm" color="yellow.500">Pending</Text>
                      </HStack>
                    </HStack>
                  </Box>
                )}
                keyExtractor={item => item.id}
                ListEmptyComponent={
                  <Box p={10} alignItems="center">
                    <Icon as={Ionicons} name="paper-plane-outline" size="6xl" color="gray.300" />
                    <Text mt={2} color="gray.500" textAlign="center">
                      You haven't sent any friend requests
                    </Text>
                  </Box>
                }
              />
            )}
          </Tabs.View>
          
          {/* Invite Tab */}
          <Tabs.View>
            <VStack space={6}>
              <Box 
                bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
                borderRadius="lg"
                p={6}
                alignItems="center"
                justifyContent="center"
              >
                {loading.qrCode ? (
                  <Spinner size="lg" mb={4} />
                ) : (
                  <>
                    <Text fontWeight="bold" mb={4}>Scan this QR code to add me as a friend</Text>
                    <Box p={3} bg="white" borderRadius="md" mb={4}>
                      {qrCodeData && (
                        <QRCode
                          value={qrCodeData}
                          size={200}
                          color="#000000"
                          backgroundColor="#ffffff"
                        />
                      )}
                    </Box>
                  </>
                )}
                
                <HStack space={3} mt={2}>
                  <Button
                    leftIcon={<Icon as={Ionicons} name="copy-outline" size="sm" />}
                    variant="outline"
                    onPress={copyInviteLink}
                  >
                    Copy Link
                  </Button>
                  <Button
                    leftIcon={<Icon as={Ionicons} name="share-outline" size="sm" />}
                    onPress={shareInvite}
                  >
                    Share
                  </Button>
                </HStack>
                
                <Button
                  leftIcon={<Icon as={Ionicons} name="qr-code-outline" size="sm" />}
                  mt={4}
                  colorScheme="secondary"
                  onPress={() => navigation.navigate('QRCodeScanner')}
                >
                  Scan QR Code
                </Button>
              </Box>
              
              <Divider />
              
              <VStack space={4}>
                <Heading size="sm">Send Friend Request</Heading>
                <HStack space={2}>
                  <Input
                    flex={1}
                    placeholder="Enter friend's email"
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    keyboardType="email-address"
                  />
                  <Button
                    leftIcon={<Icon as={Ionicons} name="send-outline" size="sm" />}
                    onPress={sendFriendRequest}
                    isLoading={loading.action}
                    isDisabled={!inviteEmail}
                  >
                    Send
                  </Button>
                </HStack>
              </VStack>
            </VStack>
          </Tabs.View>
        </Tabs.Views>
      </Tabs>
    </Box>
  );
};

const styles = StyleSheet.create({
  qrcode: {
    alignSelf: 'center',
    margin: 20,
  }
});

export default FriendRequestsScreen;
