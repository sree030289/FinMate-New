import { collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, DocumentData, WhereFilterOp, Timestamp, writeBatch } from 'firebase/firestore';
import { auth, db, storage } from './firebase';
import { handleError } from '../utils/errorHandler';
import { User, Transaction, Category, Reminder, Group, GroupMember, Expense, Friend, FriendRequest, QRCodeData } from '../types';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

// Type for query constraints
type QueryConstraint = {
  field: string;
  operator: WhereFilterOp;
  value: any;
};

/**
 * User-related operations
 */
export const userService = {
  /**
   * Get current user profile from Firestore
   */
  getCurrentUserProfile: async (): Promise<User | null> => {
    try {
      if (!auth.currentUser) return null;
      
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        return null;
      }
      
      return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
      throw handleError(error, 'userService.getCurrentUserProfile');
    }
  },
  
  /**
   * Create or update user profile
   */
  updateUserProfile: async (userData: Partial<User>): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Check if user document exists
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        // Create new user profile
        await setDoc(userRef, {
          ...userData,
          id: auth.currentUser.uid,
          createdAt: serverTimestamp(),
          isPremium: false // Default to free tier
        });
      } else {
        // Update existing profile
        await updateDoc(userRef, {
          ...userData,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      throw handleError(error, 'userService.updateUserProfile');
    }
  }
};

/**
 * Transaction-related operations
 */
export const transactionService = {
  /**
   * Get user transactions with optional filtering
   */
  getTransactions: async (constraints?: QueryConstraint[], sortBy: string = 'date', descending: boolean = true, limitCount?: number): Promise<Transaction[]> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const transactionsRef = collection(db, 'users', auth.currentUser.uid, 'transactions');
      let queryConstraints = [];
      
      // Add where clauses if constraints are provided
      if (constraints) {
        constraints.forEach(constraint => {
          queryConstraints.push(where(constraint.field, constraint.operator, constraint.value));
        });
      }
      
      // Add ordering
      queryConstraints.push(orderBy(sortBy, descending ? 'desc' : 'asc'));
      
      // Add limit if provided
      if (limitCount) {
        queryConstraints.push(limit(limitCount));
      }
      
      const q = query(transactionsRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert timestamps to dates
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
        
        return {
          id: doc.id,
          ...data,
          date,
          createdAt
        } as Transaction;
      });
    } catch (error) {
      throw handleError(error, 'transactionService.getTransactions');
    }
  },
  
  /**
   * Get a single transaction by ID
   */
  getTransactionById: async (transactionId: string): Promise<Transaction | null> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const transactionRef = doc(db, 'users', auth.currentUser.uid, 'transactions', transactionId);
      const transactionDoc = await getDoc(transactionRef);
      
      if (!transactionDoc.exists()) {
        return null;
      }
      
      const data = transactionDoc.data();
      
      // Convert timestamps to dates
      const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
      
      return {
        id: transactionDoc.id,
        ...data,
        date,
        createdAt
      } as Transaction;
    } catch (error) {
      throw handleError(error, 'transactionService.getTransactionById');
    }
  },
  
  /**
   * Create a new transaction
   */
  addTransaction: async (transactionData: Partial<Transaction>): Promise<string> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const transactionsRef = collection(db, 'users', auth.currentUser.uid, 'transactions');
      
      const docRef = await addDoc(transactionsRef, {
        ...transactionData,
        createdAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      throw handleError(error, 'transactionService.addTransaction');
    }
  },
  
  /**
   * Update an existing transaction
   */
  updateTransaction: async (transactionId: string, transactionData: Partial<Transaction>): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const transactionRef = doc(db, 'users', auth.currentUser.uid, 'transactions', transactionId);
      
      await updateDoc(transactionRef, {
        ...transactionData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw handleError(error, 'transactionService.updateTransaction');
    }
  },
  
  /**
   * Delete a transaction
   */
  deleteTransaction: async (transactionId: string): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const transactionRef = doc(db, 'users', auth.currentUser.uid, 'transactions', transactionId);
      
      await deleteDoc(transactionRef);
    } catch (error) {
      throw handleError(error, 'transactionService.deleteTransaction');
    }
  },
  
  /**
   * Upload a receipt image and get its URL
   */
  uploadReceiptImage: async (uri: string): Promise<string> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Convert URI to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create a reference to the file location
      const fileName = `receipts/${auth.currentUser.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      // Upload the file
      await uploadBytes(storageRef, blob);
      
      // Get and return the download URL
      return await getDownloadURL(storageRef);
    } catch (error) {
      throw handleError(error, 'transactionService.uploadReceiptImage');
    }
  }
};

/**
 * Category-related operations
 */
export const categoryService = {
  /**
   * Get all categories for user
   */
  getCategories: async (): Promise<Category[]> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const categoriesRef = collection(db, 'users', auth.currentUser.uid, 'categories');
      const q = query(categoriesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Category));
    } catch (error) {
      throw handleError(error, 'categoryService.getCategories');
    }
  },
  
  /**
   * Create a new category
   */
  addCategory: async (categoryData: Partial<Category>): Promise<string> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const categoriesRef = collection(db, 'users', auth.currentUser.uid, 'categories');
      
      const docRef = await addDoc(categoriesRef, categoryData);
      
      return docRef.id;
    } catch (error) {
      throw handleError(error, 'categoryService.addCategory');
    }
  },
  
  /**
   * Update a category
   */
  updateCategory: async (categoryId: string, categoryData: Partial<Category>): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const categoryRef = doc(db, 'users', auth.currentUser.uid, 'categories', categoryId);
      
      await updateDoc(categoryRef, categoryData);
    } catch (error) {
      throw handleError(error, 'categoryService.updateCategory');
    }
  },
  
  /**
   * Delete a category
   */
  deleteCategory: async (categoryId: string): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const categoryRef = doc(db, 'users', auth.currentUser.uid, 'categories', categoryId);
      
      await deleteDoc(categoryRef);
    } catch (error) {
      throw handleError(error, 'categoryService.deleteCategory');
    }
  }
};

/**
 * Reminders-related operations
 */
export const reminderService = {
  /**
   * Get all reminders for user
   */
  getReminders: async (constraints?: QueryConstraint[]): Promise<Reminder[]> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const remindersRef = collection(db, 'users', auth.currentUser.uid, 'reminders');
      let queryConstraints = [];
      
      // Add where clauses if constraints are provided
      if (constraints) {
        constraints.forEach(constraint => {
          queryConstraints.push(where(constraint.field, constraint.operator, constraint.value));
        });
      }
      
      // Add ordering by due date
      queryConstraints.push(orderBy('dueDate', 'asc'));
      
      const q = query(remindersRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert timestamps to dates
        const dueDate = data.dueDate instanceof Timestamp ? data.dueDate.toDate().toISOString() : data.dueDate;
        
        return {
          id: doc.id,
          ...data,
          dueDate
        } as Reminder;
      });
    } catch (error) {
      throw handleError(error, 'reminderService.getReminders');
    }
  },
  
  /**
   * Add a new reminder
   */
  addReminder: async (reminderData: Partial<Reminder>): Promise<string> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const remindersRef = collection(db, 'users', auth.currentUser.uid, 'reminders');
      
      const docRef = await addDoc(remindersRef, {
        ...reminderData,
        createdAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      throw handleError(error, 'reminderService.addReminder');
    }
  },
  
  /**
   * Update a reminder
   */
  updateReminder: async (reminderId: string, reminderData: Partial<Reminder>): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const reminderRef = doc(db, 'users', auth.currentUser.uid, 'reminders', reminderId);
      
      await updateDoc(reminderRef, {
        ...reminderData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw handleError(error, 'reminderService.updateReminder');
    }
  },
  
  /**
   * Delete a reminder
   */
  deleteReminder: async (reminderId: string): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const reminderRef = doc(db, 'users', auth.currentUser.uid, 'reminders', reminderId);
      
      await deleteDoc(reminderRef);
    } catch (error) {
      throw handleError(error, 'reminderService.deleteReminder');
    }
  }
};

/**
 * Split expenses and groups operations
 */
export const splitExpenseService = {
  /**
   * Get all groups
   */
  getGroups: async (): Promise<Group[]> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // First get all groups where user is a member
      const groupsRef = collection(db, 'groups');
      const q = query(
        groupsRef, 
        where('members', 'array-contains', auth.currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert timestamps to dates
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
        
        return {
          id: doc.id,
          ...data,
          createdAt
        } as Group;
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getGroups');
    }
  },
  
  /**
   * Get group details by ID
   */
  getGroupById: async (groupId: string): Promise<Group | null> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        return null;
      }
      
      const data = groupDoc.data();
      
      // Convert timestamps to dates
      const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
      
      return {
        id: groupDoc.id,
        ...data,
        createdAt
      } as Group;
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getGroupById');
    }
  },
  
  /**
   * Create a new group
   */
  createGroup: async (groupData: Partial<Group>): Promise<string> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const groupsRef = collection(db, 'groups');
      
      const docRef = await addDoc(groupsRef, {
        ...groupData,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        members: [auth.currentUser.uid, ...(groupData.members?.map(m => m.id) || [])]
      });
      
      return docRef.id;
    } catch (error) {
      throw handleError(error, 'splitExpenseService.createGroup');
    }
  },
  
  /**
   * Update a group
   */
  updateGroup: async (groupId: string, groupData: Partial<Group>): Promise<void> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      
      await updateDoc(groupRef, {
        ...groupData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.updateGroup');
    }
  },
  
  /**
   * Get expenses for a group
   */
  getExpensesByGroup: async (groupId: string): Promise<Expense[]> => {
    try {
      const expensesRef = collection(db, 'groups', groupId, 'expenses');
      const q = query(expensesRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert timestamps to dates
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
        
        return {
          id: doc.id,
          ...data,
          date,
          createdAt
        } as Expense;
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getExpensesByGroup');
    }
  },
  
  /**
   * Add an expense to a group
   */
  addExpenseToGroup: async (groupId: string, expenseData: Partial<Expense>): Promise<string> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const expensesRef = collection(db, 'groups', groupId, 'expenses');
      
      const docRef = await addDoc(expensesRef, {
        ...expenseData,
        paidBy: auth.currentUser.uid,
        groupId,
        createdAt: serverTimestamp()
      });
      
      // Update group's totalExpenses
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (groupDoc.exists()) {
        const groupData = groupDoc.data();
        const currentTotal = groupData.totalExpenses || 0;
        const expenseAmount = expenseData.amount || 0;
        
        await updateDoc(groupRef, {
          totalExpenses: currentTotal + expenseAmount,
          updatedAt: serverTimestamp()
        });
      }
      
      return docRef.id;
    } catch (error) {
      throw handleError(error, 'splitExpenseService.addExpenseToGroup');
    }
  },
  
  /**
   * Get all friends
   */
  getFriends: async (): Promise<Friend[]> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const friendsRef = collection(db, 'users', auth.currentUser.uid, 'friends');
      const querySnapshot = await getDocs(friendsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Friend));
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getFriends');
    }
  },
  
  /**
   * Add a friend
   */
  addFriend: async (friendData: Partial<Friend>): Promise<string> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const friendsRef = collection(db, 'users', auth.currentUser.uid, 'friends');
      
      const docRef = await addDoc(friendsRef, {
        ...friendData,
        balance: 0,
        status: 'active',
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      throw handleError(error, 'splitExpenseService.addFriend');
    }
  },

  /**
   * Send a friend request
   */
  sendFriendRequest: async (recipientEmail: string): Promise<string> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // First check if the user exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', recipientEmail.toLowerCase()));
      const userSnapshot = await getDocs(q);
      
      if (userSnapshot.empty) {
        throw new Error('User not found with this email address');
      }
      
      // Check if this is not ourselves
      const recipientData = userSnapshot.docs[0].data();
      const recipientId = userSnapshot.docs[0].id;
      
      if (recipientId === auth.currentUser.uid) {
        throw new Error('You cannot send a friend request to yourself');
      }
      
      // Get current user data
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      
      if (!currentUserDoc.exists()) {
        throw new Error('Your user profile not found');
      }
      
      const currentUserData = currentUserDoc.data();
      
      // Check if request already exists
      const friendRequestsRef = collection(db, 'friendRequests');
      const existingQuery = query(
        friendRequestsRef,
        where('sender.id', '==', auth.currentUser.uid),
        where('recipient.id', '==', recipientId),
        where('status', '==', 'pending')
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        throw new Error('A friend request to this user already exists');
      }
      
      // Also check if the recipient already sent a request to the current user
      const reverseQuery = query(
        friendRequestsRef,
        where('sender.id', '==', recipientId),
        where('recipient.id', '==', auth.currentUser.uid),
        where('status', '==', 'pending')
      );
      
      const reverseSnapshot = await getDocs(reverseQuery);
      
      if (!reverseSnapshot.empty) {
        throw new Error('This user has already sent you a friend request');
      }
      
      // Create the friend request
      const requestData = {
        sender: {
          id: auth.currentUser.uid,
          name: currentUserData.displayName || '',
          email: currentUserData.email || '',
          avatar: currentUserData.photoURL || ''
        },
        recipient: {
          id: recipientId,
          email: recipientData.email || ''
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(friendRequestsRef, requestData);
      return docRef.id;
    } catch (error) {
      throw handleError(error, 'splitExpenseService.sendFriendRequest');
    }
  },
  
  /**
   * Get pending friend requests for current user
   */
  getPendingFriendRequests: async (): Promise<FriendRequest[]> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const friendRequestsRef = collection(db, 'friendRequests');
      const q = query(
        friendRequestsRef,
        where('recipient.id', '==', auth.currentUser.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert timestamps to dates
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
        const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt;
        
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        } as FriendRequest;
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getPendingFriendRequests');
    }
  },
  
  /**
   * Get sent friend requests by current user
   */
  getSentFriendRequests: async (): Promise<FriendRequest[]> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const friendRequestsRef = collection(db, 'friendRequests');
      const q = query(
        friendRequestsRef,
        where('sender.id', '==', auth.currentUser.uid),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert timestamps to dates
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
        const updatedAt = data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt;
        
        return {
          id: doc.id,
          ...data,
          createdAt,
          updatedAt
        } as FriendRequest;
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getSentFriendRequests');
    }
  },
  
  /**
   * Respond to a friend request
   */
  respondToFriendRequest: async (requestId: string, accept: boolean): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Get the friend request
      const requestRef = doc(db, 'friendRequests', requestId);
      const requestDoc = await getDoc(requestRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Friend request not found');
      }
      
      const requestData = requestDoc.data();
      
      // Verify that current user is indeed the recipient
      if (requestData.recipient.id !== auth.currentUser.uid) {
        throw new Error('You are not authorized to respond to this request');
      }
      
      // Update the request status
      await updateDoc(requestRef, {
        status: accept ? 'accepted' : 'declined',
        updatedAt: serverTimestamp()
      });
      
      // If accepted, add each other as friends
      if (accept) {
        // Get the sender's user data to create a friend entry
        const senderRef = doc(db, 'users', requestData.sender.id);
        const senderDoc = await getDoc(senderRef);
        
        if (senderDoc.exists()) {
          const senderData = senderDoc.data();
          
          // Add sender to current user's friends
          const userFriendsRef = collection(db, 'users', auth.currentUser.uid, 'friends');
          await addDoc(userFriendsRef, {
            id: requestData.sender.id,
            name: requestData.sender.name || senderData.displayName || '',
            email: requestData.sender.email || senderData.email || '',
            avatar: requestData.sender.avatar || senderData.photoURL || '',
            balance: 0,
            status: 'active',
            lastActivity: serverTimestamp(),
            createdAt: serverTimestamp()
          });
          
          // Get current user data to add to sender's friends
          const currentUserRef = doc(db, 'users', auth.currentUser.uid);
          const currentUserDoc = await getDoc(currentUserRef);
          
          if (currentUserDoc.exists()) {
            const userData = currentUserDoc.data();
            
            // Add current user to sender's friends
            const senderFriendsRef = collection(db, 'users', requestData.sender.id, 'friends');
            await addDoc(senderFriendsRef, {
              id: auth.currentUser.uid,
              name: userData.displayName || '',
              email: userData.email || '',
              avatar: userData.photoURL || '',
              balance: 0,
              status: 'active',
              lastActivity: serverTimestamp(),
              createdAt: serverTimestamp()
            });
          }
        }
      }
    } catch (error) {
      throw handleError(error, 'splitExpenseService.respondToFriendRequest');
    }
  },
  
  /**
   * Generate QR code data for adding friends
   */
  generateQRCodeData: async (): Promise<QRCodeData> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Get current user data
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const userData = userDoc.data();
      
      return {
        userId: auth.currentUser.uid,
        name: userData.displayName || '',
        email: userData.email || '',
        timestamp: Date.now() // Set current timestamp
      };
    } catch (error) {
      throw handleError(error, 'splitExpenseService.generateQRCodeData');
    }
  },
  
  /**
   * Add friend via QR code data
   */
  addFriendViaQRCode: async (qrData: QRCodeData): Promise<string> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Validate QR code data
      // Check if QR code is not expired (24 hours validity)
      const isExpired = Date.now() - qrData.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        throw new Error('This QR code has expired');
      }
      
      // Check if user exists
      const userRef = doc(db, 'users', qrData.userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }
      
      // Check if not adding self
      if (qrData.userId === auth.currentUser.uid) {
        throw new Error('You cannot add yourself as a friend');
      }
      
      // Check if already friends
      const friendsRef = collection(db, 'users', auth.currentUser.uid, 'friends');
      const q = query(friendsRef, where('id', '==', qrData.userId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        throw new Error('You are already friends with this user');
      }
      
      // Get current user data
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const currentUserDoc = await getDoc(currentUserRef);
      
      if (!currentUserDoc.exists()) {
        throw new Error('Your user profile not found');
      }
      
      const currentUserData = currentUserDoc.data();
      
      // Add the scanned user as friend
      const newFriendDocRef = await addDoc(friendsRef, {
        id: qrData.userId,
        name: qrData.name,
        email: qrData.email,
        avatar: userDoc.data().photoURL || '',
        balance: 0,
        status: 'active',
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      // Add current user as friend to the scanned user's friends
      const otherFriendsRef = collection(db, 'users', qrData.userId, 'friends');
      await addDoc(otherFriendsRef, {
        id: auth.currentUser.uid,
        name: currentUserData.displayName || '',
        email: currentUserData.email || '',
        avatar: currentUserData.photoURL || '',
        balance: 0,
        status: 'active',
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      return newFriendDocRef.id;
    } catch (error) {
      throw handleError(error, 'splitExpenseService.addFriendViaQRCode');
    }
  },

  /**
   * Delete a group
   */
  deleteGroup: async (groupId: string): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // First check if the user is an admin of the group
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const groupData = groupDoc.data();
      
      // Check if current user is creator or admin
      if (groupData.createdBy !== auth.currentUser.uid) {
        throw new Error('You do not have permission to delete this group');
      }
      
      // Delete the group
      await deleteDoc(groupRef);
      
      // TODO: In a real app, you might want to delete all related expenses as well
      // This would require a batch operation to delete all expenses in the group
      
    } catch (error) {
      throw handleError(error, 'splitExpenseService.deleteGroup');
    }
  },
  
  /**
   * Archive a group
   */
  archiveGroup: async (groupId: string): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const groupRef = doc(db, 'groups', groupId);
      
      // Update the group to set it as archived
      await updateDoc(groupRef, {
        isArchived: true,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.archiveGroup');
    }
  },

  /**
   * Add a member to a group
   */
  addGroupMember: async (groupId: string, memberData: Partial<GroupMember>): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Check if the current user is an admin
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const groupData = groupDoc.data();
      const members = groupData.members || [];
      
      // Find the current user in members array to check admin status
      const groupMembersRef = collection(db, 'groups', groupId, 'members');
      const q = query(groupMembersRef, where('id', '==', auth.currentUser.uid));
      const memberSnapshot = await getDocs(q);
      
      if (memberSnapshot.empty) {
        throw new Error('You are not a member of this group');
      }
      
      const currentUserMemberData = memberSnapshot.docs[0].data();
      
      // Only admins can add members
      if (!currentUserMemberData.isAdmin && groupData.createdBy !== auth.currentUser.uid) {
        throw new Error('Only group admins can add members');
      }
      
      // Add the new member to group members subcollection
      const newMemberRef = await addDoc(groupMembersRef, {
        ...memberData,
        joinedAt: serverTimestamp(),
        isAdmin: memberData.isAdmin || false,
        balance: 0
      });
      
      // Also update the main group document with the new member ID
      await updateDoc(groupRef, {
        members: [...members, memberData.id],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.addGroupMember');
    }
  },
  
  /**
   * Remove a member from a group
   */
  removeGroupMember: async (groupId: string, memberId: string): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Check if the current user is an admin
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const groupData = groupDoc.data();
      
      // Check if the user to be removed is the group creator
      if (memberId === groupData.createdBy) {
        throw new Error('Group creator cannot be removed');
      }
      
      // Check if current user is creator or admin
      const groupMembersRef = collection(db, 'groups', groupId, 'members');
      const q = query(groupMembersRef, where('id', '==', auth.currentUser.uid));
      const memberSnapshot = await getDocs(q);
      
      if (memberSnapshot.empty) {
        throw new Error('You are not a member of this group');
      }
      
      const currentUserMemberData = memberSnapshot.docs[0].data();
      
      // Only admins can remove members
      if (!currentUserMemberData.isAdmin && groupData.createdBy !== auth.currentUser.uid) {
        throw new Error('Only group admins can remove members');
      }
      
      // Find the member to remove
      const memberQuery = query(groupMembersRef, where('id', '==', memberId));
      const memberToRemoveSnapshot = await getDocs(memberQuery);
      
      if (memberToRemoveSnapshot.empty) {
        throw new Error('Member not found in this group');
      }
      
      // Delete the member from the members subcollection
      await deleteDoc(memberToRemoveSnapshot.docs[0].ref);
      
      // Update the main group document by removing the member ID
      const updatedMembers = groupData.members.filter(id => id !== memberId);
      await updateDoc(groupRef, {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.removeGroupMember');
    }
  },
  
  /**
   * Change member role (promote/demote admin status)
   */
  changeMemberRole: async (groupId: string, memberId: string, isAdmin: boolean): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Check if the current user is an admin or creator
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const groupData = groupDoc.data();
      
      // Only the creator can change admin roles
      if (groupData.createdBy !== auth.currentUser.uid) {
        throw new Error('Only the group creator can change member roles');
      }
      
      // Find the member in the members subcollection
      const groupMembersRef = collection(db, 'groups', groupId, 'members');
      const memberQuery = query(groupMembersRef, where('id', '==', memberId));
      const memberSnapshot = await getDocs(memberQuery);
      
      if (memberSnapshot.empty) {
        throw new Error('Member not found in this group');
      }
      
      // Update the member's admin status
      await updateDoc(memberSnapshot.docs[0].ref, {
        isAdmin,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.changeMemberRole');
    }
  },

  /**
   * Get group settings
   */
  getGroupSettings: async (groupId: string): Promise<Partial<Group>> => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      const groupDoc = await getDoc(groupRef);
      
      if (!groupDoc.exists()) {
        throw new Error('Group not found');
      }
      
      const groupData = groupDoc.data();
      
      return {
        defaultCurrency: groupData.defaultCurrency || 'INR',
        defaultSplitMethod: groupData.defaultSplitMethod || 'equal',
        settlementPeriod: groupData.settlementPeriod || 'monthly'
      };
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getGroupSettings');
    }
  },
  
  /**
   * Update group settings
   */
  updateGroupSettings: async (groupId: string, settings: Partial<Group>): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      const groupRef = doc(db, 'groups', groupId);
      
      await updateDoc(groupRef, {
        ...settings,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      throw handleError(error, 'splitExpenseService.updateGroupSettings');
    }
  },
  
  /**
   * Calculate settlement suggestions for a group
   * Uses an algorithm to minimize the number of transactions needed
   */
  getSettlementSuggestions: async (groupId: string): Promise<{from: string, to: string, amount: number}[]> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Get all group members and their balances
      const groupMembersRef = collection(db, 'groups', groupId, 'members');
      const membersSnapshot = await getDocs(groupMembersRef);
      
      type BalanceMap = {[key: string]: {id: string, name: string, balance: number}};
      
      // Calculate net balances
      const balances: BalanceMap = {};
      membersSnapshot.docs.forEach(doc => {
        const member = doc.data();
        balances[member.id] = {
          id: member.id,
          name: member.name,
          balance: member.balance || 0
        };
      });
      
      // Separate users who owe money from those who are owed
      const debtors = Object.values(balances).filter(u => u.balance < 0)
        .sort((a, b) => a.balance - b.balance); // Sort ascending (most negative first)
      
      const creditors = Object.values(balances).filter(u => u.balance > 0)
        .sort((a, b) => b.balance - a.balance); // Sort descending (most positive first)
      
      // Generate simplified transactions
      const transactions: {from: string, to: string, amount: number}[] = [];
      
      // Debt simplification algorithm
      let i = 0;
      let j = 0;
      
      while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        
        // Amount to settle is the minimum of what is owed and what is due
        const amount = Math.min(Math.abs(debtor.balance), creditor.balance);
        
        if (amount > 0) {
          transactions.push({
            from: debtor.id,
            to: creditor.id,
            amount
          });
          
          // Update balances
          debtor.balance += amount;
          creditor.balance -= amount;
          
          // Move to next person if their balance is settled
          if (Math.abs(debtor.balance) < 0.01) i++;
          if (creditor.balance < 0.01) j++;
        }
      }
      
      return transactions;
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getSettlementSuggestions');
    }
  },
  
  /**
   * Record a settlement payment
   */
  recordSettlement: async (groupId: string, fromId: string, toId: string, amount: number): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user');
      
      // Start a batch to ensure all operations succeed or fail together
      const batch = writeBatch(db);
      
      // Update the balances of both members
      const groupMembersRef = collection(db, 'groups', groupId, 'members');
      
      // Get the payer (from)
      const fromQuery = query(groupMembersRef, where('id', '==', fromId));
      const fromSnapshot = await getDocs(fromQuery);
      
      if (fromSnapshot.empty) {
        throw new Error('Payer not found in this group');
      }
      
      const fromMemberRef = fromSnapshot.docs[0].ref;
      const fromMemberData = fromSnapshot.docs[0].data();
      
      // Get the payee (to)
      const toQuery = query(groupMembersRef, where('id', '==', toId));
      const toSnapshot = await getDocs(toQuery);
      
      if (toSnapshot.empty) {
        throw new Error('Recipient not found in this group');
      }
      
      const toMemberRef = toSnapshot.docs[0].ref;
      const toMemberData = toSnapshot.docs[0].data();
      
      // Update payer balance
      batch.update(fromMemberRef, {
        balance: (fromMemberData.balance || 0) + amount
      });
      
      // Update payee balance
      batch.update(toMemberRef, {
        balance: (toMemberData.balance || 0) - amount
      });
      
      // Add a record of the settlement to the settlements subcollection
      const settlementsRef = collection(db, 'groups', groupId, 'settlements');
      batch.set(doc(settlementsRef), {
        fromId,
        fromName: fromMemberData.name,
        toId,
        toName: toMemberData.name,
        amount,
        date: serverTimestamp(),
        createdBy: auth.currentUser.uid
      });
      
      // Commit the batch
      await batch.commit();
    } catch (error) {
      throw handleError(error, 'splitExpenseService.recordSettlement');
    }
  },

  /**
   * Get expenses with advanced filtering and search
   */
  getFilteredExpenses: async (
    groupId: string, 
    filters: {
      startDate?: Date;
      endDate?: Date;
      categories?: string[];
      paidBy?: string;
      minAmount?: number;
      maxAmount?: number;
      onlySettled?: boolean;
      searchQuery?: string;
    }
  ): Promise<Expense[]> => {
    try {
      // Base query - all expenses in the group
      const expensesRef = collection(db, 'groups', groupId, 'expenses');
      let queryConstraints: QueryConstraint[] = [];
      
      // Add date range filters if provided
      if (filters.startDate) {
        queryConstraints.push(where('date', '>=', filters.startDate));
      }
      
      if (filters.endDate) {
        queryConstraints.push(where('date', '<=', filters.endDate));
      }
      
      // Add paidBy filter if provided
      if (filters.paidBy) {
        queryConstraints.push(where('paidBy', '==', filters.paidBy));
      }
      
      // Add settlement filter if provided
      if (filters.onlySettled !== undefined) {
        queryConstraints.push(where('settled', '==', filters.onlySettled));
      }
      
      // Always sort by date descending
      queryConstraints.push(orderBy('date', 'desc'));
      
      // Execute the query
      const q = query(expensesRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      // Convert to Expense objects
      let expenses = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert timestamps to dates
        const date = data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date;
        const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt;
        
        return {
          id: doc.id,
          ...data,
          date,
          createdAt
        } as Expense;
      });
      
      // Apply client-side filtering for filters that can't be done in the query
      
      // Filter by amount range if specified
      if (filters.minAmount !== undefined) {
        expenses = expenses.filter(expense => expense.amount >= filters.minAmount!);
      }
      
      if (filters.maxAmount !== undefined) {
        expenses = expenses.filter(expense => expense.amount <= filters.maxAmount!);
      }
      
      // Filter by categories if specified
      if (filters.categories && filters.categories.length > 0) {
        expenses = expenses.filter(expense => 
          filters.categories!.includes(expense.category)
        );
      }
      
      // Filter by search query if specified
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        expenses = expenses.filter(expense => 
          expense.title.toLowerCase().includes(query) || 
          expense.notes?.toLowerCase().includes(query) ||
          expense.category.toLowerCase().includes(query)
        );
      }
      
      return expenses;
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getFilteredExpenses');
    }
  },
  
  /**
   * Get category spending breakdown for a group
   */
  getCategoryBreakdown: async (
    groupId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<{category: string, amount: number}[]> => {
    try {
      // Get all expenses in date range
      const expensesRef = collection(db, 'groups', groupId, 'expenses');
      let queryConstraints: QueryConstraint[] = [];
      
      if (startDate) {
        queryConstraints.push(where('date', '>=', startDate));
      }
      
      if (endDate) {
        queryConstraints.push(where('date', '<=', endDate));
      }
      
      const q = query(expensesRef, ...queryConstraints);
      const querySnapshot = await getDocs(q);
      
      // Group expenses by category
      const categoryMap: {[key: string]: number} = {};
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const category = data.category || 'other';
        const amount = data.amount || 0;
        
        categoryMap[category] = (categoryMap[category] || 0) + amount;
      });
      
      // Convert to array
      return Object.entries(categoryMap).map(([category, amount]) => ({
        category,
        amount
      }));
    } catch (error) {
      throw handleError(error, 'splitExpenseService.getCategoryBreakdown');
    }
  },
};

/**
 * Export a default object with all services
 */
export default {
  user: userService,
  transactions: transactionService,
  categories: categoryService,
  reminders: reminderService,
  splitExpense: splitExpenseService
};
