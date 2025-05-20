import { Platform, Linking } from 'react-native';
import { FirebaseError } from 'firebase/app';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { handleError } from '../utils/errorHandler';

export interface PaymentDetails {
  amount: number; 
  toUserId?: string;
  toName?: string;
  fromUserId?: string;
  fromName?: string;
  paymentMethod: 'upi' | 'bank' | 'cash';
  provider?: string;
  upiId?: string;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
  referenceId?: string;
  status?: 'initiated' | 'pending' | 'completed' | 'failed';
  note?: string;
  groupId?: string;
  expenseId?: string;
  isRequest?: boolean;
}

export interface PaymentVerification {
  paymentId: string;
  referenceId: string;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  timestamp: Date;
  receiptUrl?: string;
  verificationMethod: 'manual' | 'callback' | 'screenshot';
}

/**
 * Payment service for handling all payment-related operations
 */
export const paymentService = {
  /**
   * Initiate a UPI payment
   * @param details Payment details
   * @returns Promise with payment reference
   */
  initiateUpiPayment: async (details: PaymentDetails): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      // First record the payment in Firestore
      const paymentRef = await addDoc(collection(db, 'payments'), {
        amount: details.amount,
        fromUserId: auth.currentUser.uid,
        fromName: details.fromName || '',
        toUserId: details.toUserId || '',
        toName: details.toName || '',
        paymentMethod: 'upi',
        provider: details.provider || 'other',
        upiId: details.upiId || '',
        status: 'initiated',
        timestamp: serverTimestamp(),
        note: details.note || '',
        groupId: details.groupId || null,
        expenseId: details.expenseId || null,
        isRequest: details.isRequest || false
      });

      // If this is just a payment request, return here
      if (details.isRequest) {
        return { success: true, paymentId: paymentRef.id };
      }
      
      // For actual payments, try to open a UPI app
      if (Platform.OS === 'android' || Platform.OS === 'ios') {
        // Construct UPI URI based on the provider
        let upiUrl = '';
        const upiId = details.upiId || '';
        const amount = details.amount.toString();
        const note = encodeURIComponent(details.note || 'FinMate payment');
        const merchantCode = 'finmate'; // This would be your registered merchant code in a real app
        
        // We'll use the payment doc ID as transaction reference
        const txnRef = paymentRef.id;
        
        // Construct URL scheme based on UPI provider
        switch(details.provider) {
          case 'gpay':
            upiUrl = `gpay://upi/pay?pa=${upiId}&pn=${details.toName}&am=${amount}&cu=INR&tn=${note}&tr=${txnRef}`;
            break;
          case 'phonepe':
            upiUrl = `phonepe://pay?pa=${upiId}&pn=${details.toName}&am=${amount}&cu=INR&tn=${note}&tr=${txnRef}`;
            break;
          case 'paytm':
            upiUrl = `paytmmp://pay?pa=${upiId}&pn=${details.toName}&am=${amount}&cu=INR&tn=${note}&tr=${txnRef}`;
            break;
          default:
            // Generic UPI intent
            upiUrl = `upi://pay?pa=${upiId}&pn=${details.toName}&am=${amount}&cu=INR&tn=${note}&tr=${txnRef}`;
        }
        
        // Check if the app can be opened
        const canOpen = await Linking.canOpenURL(upiUrl);
        
        if (canOpen) {
          await Linking.openURL(upiUrl);
          
          // Update status to pending
          await updateDoc(doc(db, 'payments', paymentRef.id), {
            status: 'pending',
            referenceId: txnRef
          });
          
          return { success: true, paymentId: paymentRef.id };
        } else {
          // If we can't open the UPI app, update status to failed
          await updateDoc(doc(db, 'payments', paymentRef.id), {
            status: 'failed',
            failureReason: 'UPI app not installed or cannot be opened'
          });
          
          throw new Error('Could not open UPI app. Please install the app or try a different payment method.');
        }
      } else {
        throw new Error('UPI payments are only supported on mobile devices');
      }
    } catch (error) {
      if (error instanceof FirebaseError) {
        throw handleError(error, 'paymentService.initiateUpiPayment');
      }
      throw error;
    }
  },
  
  /**
   * Initiate a bank transfer
   * @param details Payment details with bank information
   * @returns Promise with payment reference
   */
  initiateBankTransfer: async (details: PaymentDetails): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      if (!details.bankDetails) {
        throw new Error('Bank details are required for bank transfers');
      }
      
      // Record the bank transfer in Firestore
      const paymentRef = await addDoc(collection(db, 'payments'), {
        amount: details.amount,
        fromUserId: auth.currentUser.uid,
        fromName: details.fromName || '',
        toUserId: details.toUserId || '',
        toName: details.toName || '',
        paymentMethod: 'bank',
        bankDetails: {
          accountNumber: details.bankDetails.accountNumber,
          ifsc: details.bankDetails.ifsc,
          accountHolderName: details.bankDetails.accountHolderName
        },
        status: details.isRequest ? 'initiated' : 'pending',
        timestamp: serverTimestamp(),
        note: details.note || '',
        groupId: details.groupId || null,
        expenseId: details.expenseId || null,
        isRequest: details.isRequest || false
      });
      
      return { success: true, paymentId: paymentRef.id };
    } catch (error) {
      if (error instanceof FirebaseError) {
        throw handleError(error, 'paymentService.initiateBankTransfer');
      }
      throw error;
    }
  },
  
  /**
   * Record a cash payment
   * @param details Payment details
   * @returns Promise with payment reference
   */
  recordCashPayment: async (details: PaymentDetails): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      // Record the cash payment in Firestore
      const paymentRef = await addDoc(collection(db, 'payments'), {
        amount: details.amount,
        fromUserId: auth.currentUser.uid,
        fromName: details.fromName || '',
        toUserId: details.toUserId || '',
        toName: details.toName || '',
        paymentMethod: 'cash',
        status: 'completed', // Cash payments are considered completed immediately
        timestamp: serverTimestamp(),
        note: details.note || '',
        groupId: details.groupId || null,
        expenseId: details.expenseId || null,
        isRequest: false // Cash payments are typically not requests
      });
      
      return { success: true, paymentId: paymentRef.id };
    } catch (error) {
      if (error instanceof FirebaseError) {
        throw handleError(error, 'paymentService.recordCashPayment');
      }
      throw error;
    }
  },
  
  /**
   * Verify a payment has been completed
   * @param paymentId The payment ID to verify
   * @param verification Verification details
   * @returns Promise with verification result
   */
  verifyPayment: async (paymentId: string, verification: PaymentVerification): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      // Get the payment document
      const paymentRef = doc(db, 'payments', paymentId);
      const paymentDoc = await getDoc(paymentRef);
      
      if (!paymentDoc.exists()) {
        throw new Error('Payment not found');
      }
      
      const paymentData = paymentDoc.data();
      
      // Verify the user has permission to verify this payment
      if (paymentData.toUserId !== auth.currentUser.uid && paymentData.fromUserId !== auth.currentUser.uid) {
        throw new Error('You do not have permission to verify this payment');
      }
      
      // Update the payment status based on verification
      await updateDoc(paymentRef, {
        status: verification.status === 'success' ? 'completed' : verification.status,
        verifiedAt: serverTimestamp(),
        verifiedBy: auth.currentUser.uid,
        transactionId: verification.transactionId || null,
        verificationMethod: verification.verificationMethod,
        receiptUrl: verification.receiptUrl || null
      });
      
      // If the payment was for a specific expense, update the expense status
      if (paymentData.expenseId) {
        try {
          // Get the expense document
          const expenseRef = doc(db, 'expenses', paymentData.expenseId);
          const expenseDoc = await getDoc(expenseRef);
          
          if (expenseDoc.exists()) {
            // Update the expense with payment information
            await updateDoc(expenseRef, {
              paymentStatus: 'paid',
              paidAt: serverTimestamp(),
              paymentId,
              paymentMethod: paymentData.paymentMethod,
              paymentVerificationMethod: verification.verificationMethod,
              lastUpdated: serverTimestamp()
            });
            
            // If there's a group involved, update group balances
            if (paymentData.groupId) {
              // This would be implemented in a production app
              // to update all relevant balances in the group
              console.log(`Group balance update needed for group ${paymentData.groupId}`);
            }
          }
        } catch (error) {
          console.error('Failed to update expense status:', error);
          // We continue despite errors updating the expense
        }
      }
      
      return { success: true };
    } catch (error) {
      if (error instanceof FirebaseError) {
        throw handleError(error, 'paymentService.verifyPayment');
      }
      throw error;
    }
  },
  
  /**
   * Get payment history for a user
   * @param userId Optional user ID, defaults to current user
   * @returns Promise with payment history
   */
  getPaymentHistory: async (userId?: string): Promise<any[]> => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      
      const targetUserId = userId || auth.currentUser.uid;
      
      // Query for payments where the user is either sender or recipient
      const paymentsRef = collection(db, 'payments');
      const sentQuery = query(
        paymentsRef,
        where('fromUserId', '==', targetUserId),
        orderBy('timestamp', 'desc')
      );
      
      const receivedQuery = query(
        paymentsRef,
        where('toUserId', '==', targetUserId),
        orderBy('timestamp', 'desc')
      );
      
      const [sentSnapshot, receivedSnapshot] = await Promise.all([
        getDocs(sentQuery),
        getDocs(receivedQuery)
      ]);
      
      // Combine sent and received payments
      const payments = [
        ...sentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as any,
          direction: 'sent'
        })),
        ...receivedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as any,
          direction: 'received'
        }))
      ];
      
      // Sort by timestamp
      payments.sort((a, b) => {
        const aTime = a.timestamp instanceof Timestamp ? a.timestamp.toDate() : new Date(0);
        const bTime = b.timestamp instanceof Timestamp ? b.timestamp.toDate() : new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      return payments;
    } catch (error) {
      if (error instanceof FirebaseError) {
        throw handleError(error, 'paymentService.getPaymentHistory');
      }
      throw error;
    }
  }
};
