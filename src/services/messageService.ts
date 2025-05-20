/**
 * Message Service - Handles real-time communication in groups
 */
import { auth, db } from './firebase';
import { 
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  writeBatch
} from 'firebase/firestore';

// Types
export type Message = {
  id?: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: any;
  isExpense?: boolean;
  expenseId?: string;
  expenseDetails?: {
    title: string;
    amount: number;
    participants: number;
  };
  hasMedia?: boolean;
  mediaUrl?: string;
  mediaType?: 'image' | 'location';
  read?: { [userId: string]: boolean };
  readBy?: string[]; // Array of user IDs who have read the message
  deliveredTo?: string[]; // Array of user IDs the message was delivered to
};

export type MessageListener = (messages: Message[]) => void;

/**
 * Get messages for a group
 */
export const getGroupMessages = async (groupId: string, messageLimit = 50): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    const messagesQuery = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(messageLimit)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
    
    // Return in chronological order
    return messages.reverse();
  } catch (error) {
    console.error('Error getting group messages:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time message updates
 */
export const subscribeToGroupMessages = (
  groupId: string, 
  callback: MessageListener,
  messageLimit = 50
): (() => void) => {
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  const messagesQuery = query(
    messagesRef,
    orderBy('timestamp', 'desc'),
    limit(messageLimit)
  );
  
  const unsubscribe = onSnapshot(messagesQuery, (querySnapshot: QuerySnapshot<DocumentData>) => {
    const messages = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Message));
    
    // Return in chronological order
    callback(messages.reverse());
  }, (error) => {
    console.error('Error subscribing to messages:', error);
  });
  
  return unsubscribe;
};

/**
 * Send a message to a group
 */
export const sendMessage = async (
  groupId: string, 
  text: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'location',
  expenseDetails?: Message['expenseDetails'],
  expenseId?: string
): Promise<string> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    
    const messagesRef = collection(db, 'groups', groupId, 'messages');
    
    // Get current user info
    const userQuery = query(
      collection(db, 'users'),
      where('uid', '==', auth.currentUser.uid)
    );
    const userSnapshot = await getDocs(userQuery);
    
    let senderName = auth.currentUser.displayName || 'User';
    let senderAvatar = auth.currentUser.photoURL || undefined;
    
    // Update with user data from database if available
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      senderName = userData.name || senderName;
      senderAvatar = userData.avatar || senderAvatar;
    }
    
    // Get group members for read receipts
    const groupMembersRef = collection(db, 'groups', groupId, 'members');
    const membersSnapshot = await getDocs(groupMembersRef);
    const memberIds = membersSnapshot.docs.map(doc => doc.id);
    
    // Create read status object
    const readStatus: { [userId: string]: boolean } = {};
    readStatus[auth.currentUser.uid] = true; // Sender has read the message
    
    const newMessage: Omit<Message, 'id'> = {
      text,
      senderId: auth.currentUser.uid,
      senderName,
      senderAvatar,
      timestamp: serverTimestamp(),
      hasMedia: !!mediaUrl,
      mediaUrl,
      mediaType,
      isExpense: !!expenseDetails,
      expenseDetails,
      expenseId,
      read: readStatus, 
      readBy: [auth.currentUser.uid], // Initialize with sender
      deliveredTo: [] // Will be updated when clients receive the message
    };
    
    const docRef = await addDoc(messagesRef, newMessage);
    
    // Update the group's lastMessage field
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      lastMessage: {
        text: text.length > 50 ? text.substring(0, 50) + '...' : text,
        timestamp: serverTimestamp(),
        senderId: auth.currentUser.uid,
        senderName
      }
    });
    
    // Trigger push notifications for all members except the sender
    sendPushNotifications(
      groupId, 
      memberIds.filter(id => id !== auth.currentUser?.uid),
      senderName,
      text
    );
    
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Mark messages as read by the current user
 */
export const markMessagesAsRead = async (groupId: string, messageIds: string[]): Promise<void> => {
  try {
    if (!auth.currentUser || messageIds.length === 0) return;
    
    const batch = writeBatch(db);
    
    for (const messageId of messageIds) {
      const messageRef = doc(db, `groups/${groupId}/messages/${messageId}`);
      
      // Update both the legacy read field and the new readBy array
      batch.update(messageRef, {
        [`read.${auth.currentUser.uid}`]: true,
        readBy: arrayUnion(auth.currentUser.uid)
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

/**
 * Mark messages as delivered to the current user
 * Call this when messages are received by the client
 */
export const markMessagesAsDelivered = async (groupId: string, messageIds: string[]): Promise<void> => {
  try {
    if (!auth.currentUser || messageIds.length === 0) return;
    
    const batch = writeBatch(db);
    
    for (const messageId of messageIds) {
      const messageRef = doc(db, `groups/${groupId}/messages/${messageId}`);
      batch.update(messageRef, {
        deliveredTo: arrayUnion(auth.currentUser.uid)
      });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking messages as delivered:', error);
    // Non-critical error, we can fail silently
  }
};

/**
 * Get unread message count for a group or all groups
 */
export const getUnreadMessageCount = async (groupId?: string): Promise<number | { [groupId: string]: number }> => {
  try {
    if (!auth.currentUser) return groupId ? 0 : {};
    
    if (groupId) {
      // For a specific group
      const messagesRef = collection(db, 'groups', groupId, 'messages');
      const unreadQuery = query(
        messagesRef,
        where('readBy', 'array-contains', auth.currentUser.uid)
      );
      const unreadSnapshot = await getDocs(unreadQuery);
      return unreadSnapshot.size;
    } else {
      // For all groups the user is in
      const userGroupsRef = collection(db, 'users', auth.currentUser.uid, 'groups');
      const userGroupsSnapshot = await getDocs(userGroupsRef);
      
      const unreadCounts: { [groupId: string]: number } = {};
      
      for (const groupDoc of userGroupsSnapshot.docs) {
        const groupId = groupDoc.id;
        const messagesRef = collection(db, 'groups', groupId, 'messages');
        const unreadQuery = query(
          messagesRef,
          where('readBy', 'array-contains', auth.currentUser.uid)
        );
        const unreadSnapshot = await getDocs(unreadQuery);
        
        if (unreadSnapshot.size > 0) {
          unreadCounts[groupId] = unreadSnapshot.size;
        }
      }
      
      return unreadCounts;
    }
  } catch (error) {
    console.error('Error getting unread message count:', error);
    return groupId ? 0 : {};
  }
};

/**
 * Send push notifications to group members
 * This is a placeholder that would connect to a push notification service
 */
export const sendPushNotifications = async (
  groupId: string,
  userIds: string[],
  senderName: string,
  messageText: string
): Promise<void> => {
  try {
    // Get the group name
    const groupRef = doc(db, 'groups', groupId);
    const groupDoc = await getDoc(groupRef);
    const groupName = groupDoc.data()?.name || 'Group Chat';
    
    // Get FCM tokens for each user
    const tokens: string[] = [];
    
    for (const userId of userIds) {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      
      if (userData?.fcmTokens && Array.isArray(userData.fcmTokens)) {
        tokens.push(...userData.fcmTokens);
      }
    }
    
    if (tokens.length === 0) return;
    
    // In a real implementation, you would send these tokens to Firebase Cloud Messaging
    // or another push notification service
    console.log(`Would send push notification to ${tokens.length} devices:`, {
      title: groupName,
      body: `${senderName}: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`,
      data: {
        type: 'chat_message',
        groupId,
        messageText
      }
    });
    
    // For a real implementation, you would use Firebase Cloud Functions or a server
    // to send the actual push notifications
  } catch (error) {
    console.error('Error sending push notifications:', error);
    // Non-critical error, continue without notifications
  }
};

/**
 * Optimized image sharing for chat
 * Resizes and compresses images before uploading
 */
export const shareImage = async (
  groupId: string,
  imageUri: string,
  caption?: string
): Promise<string> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }
    
    // Import image manipulation utilities
    const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
    
    // Optimize image before upload
    const compressedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1200 } }],
      { format: SaveFormat.JPEG, compress: 0.7 }
    );
    
    // Upload to Firebase Storage
    const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('./firebase');
    
    // Convert to blob
    const response = await fetch(compressedImage.uri);
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    const fileName = `chats/${groupId}/${auth.currentUser.uid}/${Date.now()}.jpg`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Send message with image
    const text = caption || 'Shared an image';
    return await sendMessage(groupId, text, downloadURL, 'image');
  } catch (error) {
    console.error('Error sharing image:', error);
    throw error;
  }
};

export default {
  getGroupMessages,
  subscribeToGroupMessages,
  sendMessage,
  markMessagesAsRead,
  markMessagesAsDelivered,
  getUnreadMessageCount,
  sendPushNotifications,
  shareImage
};
