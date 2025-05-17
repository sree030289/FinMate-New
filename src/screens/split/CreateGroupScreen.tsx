import React, { useState } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  FormControl,
  Input,
  useColorMode,
  ScrollView,
  Avatar,
  IconButton,
  Pressable,
  useToast,
  Center,
  Checkbox
} from 'native-base';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

// Mock data for friends
const friends = [
  { id: '1', name: 'Rahul Sharma', avatar: 'https://randomuser.me/api/portraits/men/32.jpg', selected: false },
  { id: '2', name: 'Priya Patel', avatar: 'https://randomuser.me/api/portraits/women/44.jpg', selected: false },
  { id: '3', name: 'Amit Kumar', avatar: 'https://randomuser.me/api/portraits/men/22.jpg', selected: false },
  { id: '4', name: 'Neha Singh', avatar: 'https://randomuser.me/api/portraits/women/17.jpg', selected: false },
  { id: '5', name: 'Raj Malhotra', avatar: 'https://randomuser.me/api/portraits/men/53.jpg', selected: false },
];

const groupTypes = [
  { id: 'trip', name: 'Trip', icon: 'airplane-outline' },
  { id: 'home', name: 'Home', icon: 'home-outline' },
  { id: 'couple', name: 'Couple', icon: 'heart-outline' },
  { id: 'other', name: 'Other', icon: 'list-outline' },
];

const CreateGroupScreen = () => {
  const navigation = useNavigation();
  const { colorMode } = useColorMode();
  const toast = useToast();

  const [groupName, setGroupName] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [groupImage, setGroupImage] = useState(null);
  const [friendsList, setFriendsList] = useState(friends);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      setGroupImage(result.assets[0].uri);
    }
  };

  const toggleFriendSelection = (id) => {
    setFriendsList(
      friendsList.map(friend =>
        friend.id === id ? { ...friend, selected: !friend.selected } : friend
      )
    );
  };

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast.show({
        title: "Group name required",
        description: "Please enter a name for your group",
        status: "warning"
      });
      return;
    }

    if (!selectedType) {
      toast.show({
        title: "Group type required",
        description: "Please select a type for your group",
        status: "warning"
      });
      return;
    }

    const selectedFriends = friendsList.filter(friend => friend.selected);
    if (selectedFriends.length === 0) {
      toast.show({
        title: "No members selected",
        description: "Please select at least one person to add to the group",
        status: "warning"
      });
      return;
    }

    setIsLoading(true);

    // Simulate group creation
    setTimeout(() => {
      setIsLoading(false);

      toast.show({
        title: "Group Created",
        description: `${groupName} group has been created successfully`,
        status: "success"
      });

      // Navigate to the group detail screen
      navigation.navigate('GroupDetail', {
        groupId: Date.now().toString(),
        groupName: groupName,
      });
    }, 1000);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Box flex={1} p={5} bg={colorMode === 'dark' ? 'background.dark' : 'background.light'}>
        <VStack space={6}>
          <Heading size="lg">Create a Group</Heading>

          <VStack space={4} alignItems="center">
            <Pressable onPress={pickImage}>
              <Box position="relative">
                <Avatar
                  bg="primary.500"
                  size="2xl"
                  source={groupImage ? { uri: groupImage } : null}
                >
                  {!groupImage && <Icon as={Ionicons} name="people" size="xl" color="white" />}
                </Avatar>
                <Box
                  position="absolute"
                  bottom={0}
                  right={0}
                  bg="primary.500"
                  borderRadius="full"
                  p={2}
                >
                  <Icon as={Ionicons} name="camera" size="sm" color="white" />
                </Box>
              </Box>
            </Pressable>
            <Text fontSize="sm" color={colorMode === 'dark' ? 'secondaryText.dark' : 'secondaryText.light'}>
              Tap to add a group photo
            </Text>
          </VStack>

          <FormControl isRequired>
            <FormControl.Label>Group Name</FormControl.Label>
            <Input
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
              size="lg"
            />
          </FormControl>

          <FormControl isRequired>
            <FormControl.Label>Group Type</FormControl.Label>
            <HStack space={3} flexWrap="wrap">
              {groupTypes.map(type => (
                <Pressable
                  key={type.id}
                  onPress={() => setSelectedType(type.id)}
                  mb={3}
                >
                  <VStack
                    alignItems="center"
                    bg={selectedType === type.id
                      ? 'primary.500'
                      : colorMode === 'dark' ? 'card.dark' : 'card.light'}
                    p={4}
                    borderRadius="lg"
                    minW="80px"
                  >
                    <Icon
                      as={Ionicons}
                      name={type.icon}
                      size="md"
                      color={selectedType === type.id ? 'white' : 'primary.500'}
                    />
                    <Text
                      mt={2}
                      color={selectedType === type.id ? 'white' : (colorMode === 'dark' ? 'text.dark' : 'text.light')}
                    >
                      {type.name}
                    </Text>
                  </VStack>
                </Pressable>
              ))}
            </HStack>
          </FormControl>

          <FormControl isRequired>
            <FormControl.Label>Add People</FormControl.Label>
            <VStack
              bg={colorMode === 'dark' ? 'card.dark' : 'card.light'}
              borderRadius="lg"
              p={4}
              space={3}
              mb={3}
            >
              {friendsList.map(friend => (
                <HStack key={friend.id} justifyContent="space-between" alignItems="center">
                  <HStack space={3} alignItems="center">
                    <Avatar source={{ uri: friend.avatar }} size="sm">
                      {friend.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Text>{friend.name}</Text>
                  </HStack>
                  <Checkbox
                    value={friend.id}
                    isChecked={friend.selected}
                    onChange={() => toggleFriendSelection(friend.id)}
                    accessibilityLabel={`Select ${friend.name}`}
                  />
                </HStack>
              ))}
            </VStack>
          </FormControl>

          <Button
            size="lg"
            onPress={handleCreateGroup}
            isLoading={isLoading}
            leftIcon={<Icon as={Ionicons} name="people" size="sm" />}
            mt={4}
          >
            Create Group
          </Button>
        </VStack>
      </Box>
    </KeyboardAwareScrollView>
  );
};

export default CreateGroupScreen;
