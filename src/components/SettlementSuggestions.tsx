import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  Spinner,
  useColorMode,
  Avatar,
  Divider,
  Badge,
  useToast
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { IToastProps } from 'native-base/lib/typescript/components/composites/Toast/types';
import { splitExpenseService } from '../services/firestoreService';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

interface SettlementSuggestionsProps {
  groupId: string;
  onSettlementRecorded: () => void;
}

const SettlementSuggestions: React.FC<SettlementSuggestionsProps> = ({ 
  groupId,
  onSettlementRecorded 
}) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [suggestions, setSuggestions] = useState<{ 
    from: string; 
    to: string; 
    amount: number;
    fromName?: string;
    toName?: string; 
  }[]>([]);
  const [recordingSettlement, setRecordingSettlement] = useState(false);
  const [memberMap, setMemberMap] = useState<{[key: string]: { name: string; avatar?: string }}>({});
  
  // Fetch settlement suggestions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get all group members first to display names
        const groupDoc = await splitExpenseService.getGroupById(groupId);
        
        if (!groupDoc || !groupDoc.members) {
          throw new Error('Group not found or has no members');
        }
        
        // Create a map of member IDs to names and avatars
        const memberMapping: {[key: string]: { name: string; avatar?: string }} = {};
        groupDoc.members.forEach(member => {
          memberMapping[member.id] = { 
            name: member.name,
            avatar: member.avatar
          };
        });
        
        setMemberMap(memberMapping);
        
        // Get settlement suggestions
        const settlementSuggestions = await splitExpenseService.getSettlementSuggestions(groupId);
        
        // Enrich with names from our map
        const enrichedSuggestions = settlementSuggestions.map(suggestion => ({
          ...suggestion,
          fromName: memberMapping[suggestion.from]?.name,
          toName: memberMapping[suggestion.to]?.name
        }));
        
        setSuggestions(enrichedSuggestions);
      } catch (error) {
        setError({ 
          message: error instanceof Error ? error.message : 'Failed to load settlement suggestions' 
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [groupId]);
  
  // Handle recording a settlement
  const handleRecordSettlement = async (fromId: string, toId: string, amount: number) => {
    try {
      setRecordingSettlement(true);
      
      await splitExpenseService.recordSettlement(groupId, fromId, toId, amount);
      
      toast.show({
        title: "Settlement Recorded",
        description: `₹${amount.toLocaleString()} payment has been recorded`
      } as IToastProps);
      
      // Remove this suggestion from the list
      setSuggestions(prevSuggestions => 
        prevSuggestions.filter(s => !(s.from === fromId && s.to === toId))
      );
      
      // Notify parent component
      onSettlementRecorded();
    } catch (error) {
      toast.show({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to record settlement'
      } as IToastProps);
    } finally {
      setRecordingSettlement(false);
    }
  };
  
  if (isLoading) {
    return <LoadingState message="Calculating optimal settlements..." />;
  }
  
  if (error) {
    return <ErrorState error={error} />;
  }
  
  if (suggestions.length === 0) {
    return (
      <Box 
        p={5} 
        bg={colorMode === 'dark' ? 'card.dark' : 'card.light'} 
        borderRadius="lg"
        alignItems="center"
        mb={4}
      >
        <Icon as={Ionicons} name="checkmark-circle" size="4xl" color="green.500" mb={2} />
        <Text textAlign="center" fontSize="md" fontWeight="medium">
          Everyone is settled up!
        </Text>
        <Text textAlign="center" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
          There are no outstanding balances in this group
        </Text>
      </Box>
    );
  }
  
  return (
    <Box mb={4}>
      <Heading size="md" mb={2}>Suggested Settlements</Heading>
      <Text mb={4} color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
        These are the most efficient ways to settle balances
      </Text>
      
      <VStack space={3} divider={<Divider />}>
        {suggestions.map((suggestion, index) => (
          <Box 
            key={index}
            p={4} 
            bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
            borderRadius="lg"
          >
            <HStack justifyContent="space-between" alignItems="center">
              <HStack space={3} alignItems="center">
                <Avatar size="md" bg="primary.500">
                  {suggestion.fromName?.charAt(0).toUpperCase() || '?'}
                </Avatar>
                <Icon as={Ionicons} name="arrow-forward" />
                <Avatar size="md" bg="primary.500">
                  {suggestion.toName?.charAt(0).toUpperCase() || '?'}
                </Avatar>
              </HStack>
              
              <VStack>
                <Text fontWeight="bold">₹{suggestion.amount.toLocaleString()}</Text>
                <Badge colorScheme="green" rounded="sm">Suggested</Badge>
              </VStack>
            </HStack>
            
            <HStack mt={2} justifyContent="space-between">
              <Text>{suggestion.fromName} pays {suggestion.toName}</Text>
              <Button
                size="sm"
                leftIcon={<Icon as={Ionicons} name="checkmark-circle-outline" size="sm" />}
                isLoading={recordingSettlement}
                onPress={() => handleRecordSettlement(suggestion.from, suggestion.to, suggestion.amount)}
              >
                Record
              </Button>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default SettlementSuggestions;
