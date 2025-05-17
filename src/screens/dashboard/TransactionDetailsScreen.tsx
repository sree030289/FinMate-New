import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  ScrollView,
  useColorMode,
  Button,
  Heading,
  Divider,
  Pressable,
  Avatar,
  useToast,
  Badge,
  Modal
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';

const TransactionDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const toast = useToast();

  const { transaction } = route.params || {
    transaction: {
      id: '1',
      title: 'Dinner at Restaurant',
      amount: 3600.00,
      date: '2023-06-08T19:30:00',
      type: 'expense',
      category: 'Food & Dining',
      icon: 'restaurant',
      paymentMethod: 'Credit Card',
      description: 'Dinner with friends at Mountain View Restaurant',
      tags: ['Food', 'Friends'],
      location: 'Mountain View Restaurant, Mumbai',
      attachments: [
        'https://example.com/receipt.jpg'
      ],
      participants: [
        { id: 'me', name: 'You', share: 900.00 },
        { id: '2', name: 'Priya Patel', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', share: 900.00 },
        { id: '3', name: 'Amit Kumar', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', share: 900.00 },
        { id: '5', name: 'Raj Malhotra', avatar: 'https://randomuser.me/api/portraits/men/53.jpg', share: 900.00 }
      ],
      isGroupExpense: true,
      group: {
        id: '1',
        name: 'Roommates'
      }
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = () => {
    setIsLoading(true);
    // Simulate deletion
    setTimeout(() => {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      toast.show({
        title: "Transaction deleted",
        description: "The transaction has been successfully deleted",
        status: "success"
      });
      navigation.goBack();
    }, 1000);
  };

  const handleEdit = () => {
    navigation.navigate('AddTransaction', {
      transactionToEdit: transaction
    });
  };

  const handleShare = async () => {
    try {
      // In a real app, would generate a shareable receipt or link
      await Sharing.shareAsync('https://finmate.app/t/' + transaction.id);
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Could not share transaction",
        status: "error"
      });
    }
  };

  return (
    <ScrollView bg={colorMode === 'dark' ? 'background.dark' : 'background.light'} showsVerticalScrollIndicator={false}>
      <Box p={5}>
        {/* Transaction Header */}
        <Box
          bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
          p={5}
          borderRadius="lg"
          shadow={1}
          mb={5}
        >
          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <HStack space={3} alignItems="center">
              <Box
                bg={colorMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                p={3}
                borderRadius="full"
              >
                <Icon as={Ionicons} name={transaction.icon || 'receipt-outline'} color="primary.500" size="md" />
              </Box>
              <VStack>
                <Text fontWeight="bold" fontSize="lg">{transaction.title}</Text>
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>{transaction.category}</Text>
              </VStack>
            </HStack>
          </HStack>

          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="2xl" fontWeight="bold" color={transaction.type === 'expense' ? 'red.500' : 'green.500'}>
              {transaction.type === 'expense' ? '-' : '+'} ₹{transaction.amount.toFixed(2)}
            </Text>
            <Badge
              colorScheme={transaction.type === 'expense' ? 'red' : 'green'}
              variant="subtle"
              borderRadius="full"
              px={3}
              py={1}
            >
              <Text fontSize="xs">{transaction.type.toUpperCase()}</Text>
            </Badge>
          </HStack>

          <Divider my={4} />

          <VStack space={3}>
            <HStack justifyContent="space-between">
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Date & Time</Text>
              <Text>{formatDate(transaction.date)}</Text>
            </HStack>

            <HStack justifyContent="space-between">
              <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Payment Method</Text>
              <Text>{transaction.paymentMethod}</Text>
            </HStack>

            {transaction.isGroupExpense && transaction.group && (
              <HStack justifyContent="space-between">
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Group</Text>
                <Pressable onPress={() => navigation.navigate('GroupDetail', { groupId: transaction.group.id, groupName: transaction.group.name })}>
                  <Text color="primary.500">{transaction.group.name}</Text>
                </Pressable>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Description */}
        {transaction.description && (
          <Box
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={5}
            borderRadius="lg"
            shadow={1}
            mb={5}
          >
            <Heading size="sm" mb={3}>Description</Heading>
            <Text>{transaction.description}</Text>
          </Box>
        )}

        {/* Location */}
        {transaction.location && (
          <Box
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={5}
            borderRadius="lg"
            shadow={1}
            mb={5}
          >
            <HStack space={3} alignItems="center">
              <Icon as={Ionicons} name="location-outline" color="primary.500" />
              <VStack flex={1}>
                <Heading size="sm" mb={1}>Location</Heading>
                <Text>{transaction.location}</Text>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* Participants/Split */}
        {transaction.participants && transaction.participants.length > 0 && (
          <Box
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={5}
            borderRadius="lg"
            shadow={1}
            mb={5}
          >
            <Heading size="sm" mb={3}>Split Details</Heading>
            <VStack space={4} divider={<Divider />}>
              {transaction.participants.map((person, index) => (
                <HStack key={index} justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Avatar 
                      size="sm" 
                      source={person.avatar ? { uri: person.avatar } : null}
                      bg={!person.avatar ? 'primary.500' : undefined}
                    >
                      {person.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text>{person.name}</Text>
                  </HStack>
                  <Text fontWeight="bold">₹{person.share.toFixed(2)}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* Tags */}
        {transaction.tags && transaction.tags.length > 0 && (
          <Box
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={5}
            borderRadius="lg"
            shadow={1}
            mb={5}
          >
            <Heading size="sm" mb={3}>Tags</Heading>
            <HStack space={2} flexWrap="wrap">
              {transaction.tags.map((tag, index) => (
                <Badge key={index} colorScheme="primary" borderRadius="full" px={3} py={1} m={1}>
                  <Text fontSize="xs">{tag}</Text>
                </Badge>
              ))}
            </HStack>
          </Box>
        )}

        {/* Attachments */}
        {transaction.attachments && transaction.attachments.length > 0 && (
          <Box
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={5}
            borderRadius="lg"
            shadow={1}
            mb={5}
          >
            <Heading size="sm" mb={3}>Attachments</Heading>
            <VStack space={3}>
              {transaction.attachments.map((attachment, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    // View attachment
                  }}
                >
                  <HStack space={3} alignItems="center">
                    <Icon as={Ionicons} name="document-outline" color="primary.500" />
                    <Text color="primary.500">View Receipt</Text>
                  </HStack>
                </Pressable>
              ))}
            </VStack>
          </Box>
        )}

        {/* Action Buttons */}
        <HStack space={4} justifyContent="space-between" mt={6}>
          <Button
            flex={1}
            leftIcon={<Icon as={Ionicons} name="create-outline" size="sm" />}
            variant="outline"
            onPress={handleEdit}
          >
            Edit
          </Button>
          <Button
            flex={1}
            leftIcon={<Icon as={Ionicons} name="share-outline" size="sm" />}
            variant="outline"
            onPress={handleShare}
          >
            Share
          </Button>
          <Button
            flex={1}
            leftIcon={<Icon as={Ionicons} name="trash-outline" size="sm" />}
            colorScheme="danger"
            variant="outline"
            onPress={() => setShowDeleteConfirm(true)}
          >
            Delete
          </Button>
        </HStack>
      </Box>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <Modal.Content>
          <Modal.CloseButton />
          <Modal.Header>Delete Transaction</Modal.Header>
          <Modal.Body>
            <Text>Are you sure you want to delete this transaction? This action cannot be undone.</Text>
          </Modal.Body>
          <Modal.Footer>
            <Button.Group space={2}>
              <Button variant="ghost" onPress={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button colorScheme="danger" onPress={handleDelete} isLoading={isLoading}>
                Delete
              </Button>
            </Button.Group>
          </Modal.Footer>
        </Modal.Content>
      </Modal>
    </ScrollView>
  );
};

export default TransactionDetailsScreen;
