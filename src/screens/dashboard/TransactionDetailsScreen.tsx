import React, { useState, useEffect } from 'react';
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
  Modal,
  IToastProps,
  Image
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as Sharing from 'expo-sharing';
import { transactionService } from '../../services/firestoreService';
import { useMutation } from '../../hooks/useData';
import LoadingState from '../../components/LoadingState';
import ErrorState from '../../components/ErrorState';
import { Transaction } from '../../types';
import { RouteProps, NavigationProps } from '../../types/navigation';

const TransactionDetailsScreen = () => {
  const route = useRoute<RouteProps<'TransactionDetails'>>();
  const navigation = useNavigation<NavigationProps>();
  const { colorMode } = useColorMode();
  const toast = useToast();

  // Get the transaction from route params
  const initialTransaction = route.params?.transaction;
  
  // State variables
  const [transaction, setTransaction] = useState<Transaction | null>(initialTransaction);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialTransaction);

  // Fetch transaction details if only ID was passed
  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!initialTransaction || typeof initialTransaction === 'string') {
        try {
          setIsLoading(true);
          const transactionId = typeof initialTransaction === 'string' 
            ? initialTransaction 
            : route.params?.transaction?.id;
            
          if (transactionId) {
            const transactionData = await transactionService.getTransactionById(transactionId);
            setTransaction(transactionData);
          }
        } catch (error: any) {
          toast.show({
            title: "Error",
            description: error.message || "Failed to load transaction details"
          } as IToastProps);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchTransactionDetails();
  }, [initialTransaction, route.params]);

  // Setup delete mutation
  const { mutate: deleteTransaction, isLoading: isDeleting, error: deleteError } = useMutation(
    (transactionId: string) => transactionService.deleteTransaction(transactionId)
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    if (!transaction) return;
    
    try {
      await deleteTransaction(transaction.id);
      
      toast.show({
        title: "Transaction deleted",
        description: "The transaction has been successfully deleted"
      } as IToastProps);
      
      navigation.goBack();
    } catch (error: any) {
      toast.show({
        title: "Error",
        description: error.message || "Failed to delete transaction"
      } as IToastProps);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddTransaction', {
      transactionToEdit: transaction
    });
  };

  const handleShare = async () => {
    if (!transaction) return;
    
    try {
      // In a real app, would generate a shareable receipt or link
      await Sharing.shareAsync(`https://finmate.app/t/${transaction.id}`);
    } catch (error) {
      toast.show({
        title: "Error",
        description: "Could not share transaction"
      } as IToastProps);
    }
  };
  
  // Show loading state
  if (isLoading) {
    return <LoadingState fullScreen message="Loading transaction details..." />;
  }
  
  // Show error state
  if (deleteError && showDeleteConfirm) {
    return (
      <ErrorState 
        error={deleteError}
        onRetry={() => handleDelete()}
      />
    );
  }
  
  // If no transaction data is available
  if (!transaction) {
    return (
      <ErrorState 
        error={{ message: "Transaction not found" }}
        onRetry={() => navigation.goBack()}
        fullScreen
      />
    );
  }

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
                <Text fontWeight="bold" fontSize="lg">{transaction.title || transaction.category}</Text>
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>{transaction.category}</Text>
              </VStack>
            </HStack>
          </HStack>

          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="2xl" fontWeight="bold" color={transaction.type === 'expense' ? 'red.500' : 'green.500'}>
              {transaction.type === 'expense' ? '-' : '+'} ₹{Math.abs(transaction.amount || 0).toLocaleString('en-IN')}
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

            {transaction.paymentMethod && (
              <HStack justifyContent="space-between">
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Payment Method</Text>
                <Text>{transaction.paymentMethod}</Text>
              </HStack>
            )}

            {transaction.isGroupExpense && transaction.group && (
              <HStack justifyContent="space-between">
                <Text color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>Group</Text>
                <Pressable onPress={() => navigation.navigate('GroupDetail', { 
                  groupId: transaction.group.id, 
                  groupName: transaction.group.name 
                })}>
                  <Text color="primary.500">{transaction.group.name}</Text>
                </Pressable>
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Description */}
        {transaction.notes && (
          <Box
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={5}
            borderRadius="lg"
            shadow={1}
            mb={5}
          >
            <Heading size="sm" mb={3}>Notes</Heading>
            <Text>{transaction.notes}</Text>
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
                      source={person.avatar ? { uri: person.avatar } : undefined}
                      bg={!person.avatar ? 'primary.500' : undefined}
                    >
                      {person.name ? person.name.charAt(0).toUpperCase() : 'U'}
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

        {/* Receipt Image */}
        {transaction.receiptUrl && (
          <Box
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            p={5}
            borderRadius="lg"
            shadow={1}
            mb={5}
          >
            <Heading size="sm" mb={3}>Receipt</Heading>
            <Pressable
              onPress={() => {
                // View receipt in full screen
              }}
            >
              <Box borderRadius="md" overflow="hidden" mb={2}>
                <Image 
                  source={{ uri: transaction.receiptUrl }}
                  alt="Receipt" 
                  height={200}
                  width="100%"
                  resizeMode="cover"
                />
              </Box>
              <Text color="primary.500" textAlign="center">View Full Receipt</Text>
            </Pressable>
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
              <Button colorScheme="danger" onPress={handleDelete} isLoading={isDeleting}>
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
