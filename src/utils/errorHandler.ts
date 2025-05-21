import { FirebaseError } from 'firebase/app';

type ErrorHandler = {
  message: string;
  code?: string;
  stack?: string;
};

/**
 * Handles Firebase authentication errors and returns user-friendly messages
 */
export const handleFirebaseAuthError = (error: FirebaseError): ErrorHandler => {
  const errorMessage: ErrorHandler = { 
    message: 'An unknown error occurred'
  };

  if (error.code) {
    errorMessage.code = error.code;
  }
  
  switch (error.code) {
    // Authentication errors
    case 'auth/email-already-in-use':
      errorMessage.message = 'This email is already associated with an account';
      break;
    case 'auth/invalid-email':
      errorMessage.message = 'The email address is not valid';
      break;
    case 'auth/user-disabled':
      errorMessage.message = 'This account has been disabled';
      break;
    case 'auth/user-not-found':
      errorMessage.message = 'No account found with this email';
      break;
    case 'auth/wrong-password':
      errorMessage.message = 'Incorrect password';
      break;
    case 'auth/weak-password':
      errorMessage.message = 'Password should be at least 6 characters';
      break;
    case 'auth/requires-recent-login':
      errorMessage.message = 'Please log in again to perform this sensitive operation';
      break;
    case 'auth/too-many-requests':
      errorMessage.message = 'Too many unsuccessful login attempts. Please try again later.';
      break;
    case 'auth/network-request-failed':
      errorMessage.message = 'Network error. Please check your connection.';
      break;
      
    // Firestore errors
    case 'permission-denied':
      errorMessage.message = 'You do not have permission to access this data';
      break;
    case 'not-found':
      errorMessage.message = 'The requested document was not found';
      break;
    case 'already-exists':
      errorMessage.message = 'The document already exists';
      break;
    case 'resource-exhausted':
      errorMessage.message = 'System resources have been exhausted. Please try again later.';
      break;
    case 'cancelled':
      errorMessage.message = 'The operation was cancelled';
      break;
    case 'data-loss':
      errorMessage.message = 'Unrecoverable data loss or corruption';
      break;
    case 'unknown':
      errorMessage.message = 'Unknown error occurred';
      break;
    case 'invalid-argument':
      errorMessage.message = 'Invalid argument provided';
      break;
    case 'deadline-exceeded':
      errorMessage.message = 'Operation timed out';
      break;
    case 'failed-precondition':
      errorMessage.message = 'Operation couldn\'t be performed in current system state. Try restarting the app.';
      break;
    case 'aborted':
      errorMessage.message = 'The operation was aborted';
      break;
    case 'out-of-range':
      errorMessage.message = 'Operation attempted outside of valid range';
      break;
    case 'unimplemented':
      errorMessage.message = 'Operation is not implemented or not supported';
      break;
    case 'internal':
      errorMessage.message = 'Internal system error. Please try again.';
      break;
    case 'unavailable':
      errorMessage.message = 'Service unavailable. Please check your connection and try again.';
      break;
    case 'unauthenticated':
      errorMessage.message = 'User is not authenticated. Please log in.';
      break;
    default:
      if (error.message) {
        errorMessage.message = error.message;
      }
  }
  
  return errorMessage;
};

/**
 * Handles Firestore database errors and returns user-friendly messages
 */
export const handleFirestoreError = (error: FirebaseError): ErrorHandler => {
  const errorMessage: ErrorHandler = {
    title: 'Database Error',
    message: 'There was an error accessing the database.',
    status: 'error',
  };

  switch (error.code) {
    case 'permission-denied':
      errorMessage.message = 'You do not have permission to perform this action.';
      break;
    case 'not-found':
      errorMessage.message = 'The requested document was not found.';
      break;
    case 'failed-precondition':
      // Check if it's specifically an index error
      if (error.message.includes('index')) {
        errorMessage.title = 'Database Setup Required';
        errorMessage.message = 'The app needs additional setup. Please try again in a few minutes.';
      } else {
        errorMessage.message = 'The operation was rejected because the system is not in the required state.';
      }
      break;
    case 'resource-exhausted':
      errorMessage.message = 'Quota exceeded. Please try again later.';
      break;
    default:
      errorMessage.message = error.message || 'An unknown database error occurred.';
  }

  return errorMessage;
};

/**
 * Handles API call errors (including timeout)
 */
export const handleAPIError = (error: any): ErrorHandler => {
  const errorMessage: ErrorHandler = {
    message: 'An API error occurred'
  };

  if (error.code) {
    errorMessage.code = error.code;
  }
  
  // Handle React Native string to double casting error
  if (error.message && error.message.includes('java.lang.String cannot be cast to java.lang.Double')) {
    console.warn('String to Double casting error detected - this likely means a numeric style property is using a string value');
    return {
      message: 'UI rendering error detected. Please restart the app.',
      code: 'react-native-casting-error',
      stack: error.stack
    };
  }

  if (error.response) {
    // The request was made and the server responded with a non-2xx status
    switch (error.response.status) {
      case 400:
        errorMessage.message = 'Bad request. Please check your input';
        break;
      case 401:
        errorMessage.message = 'Unauthorized. Please log in again';
        break;
      case 403:
        errorMessage.message = 'Forbidden. You don\'t have permission';
        break;
      case 404:
        errorMessage.message = 'Resource not found';
        break;
      case 429:
        errorMessage.message = 'Too many requests. Please try again later';
        break;
      case 500:
        errorMessage.message = 'Server error. Please try again later';
        break;
      default:
        errorMessage.message = `Server returned error: ${error.response.status}`;
    }
  } else if (error.request) {
    // The request was made but no response was received
    errorMessage.message = 'No response from server. Please check your network';
  } else if (error.code === 'ECONNABORTED') {
    errorMessage.message = 'Request timeout. Please try again';
  } else {
    // Something happened in setting up the request
    errorMessage.message = error.message || 'An unknown error occurred';
  }

  return errorMessage;
};

/**
 * Logs errors to the console and (optionally) to a monitoring service
 */
export const logError = (error: any, context: string = 'general'): void => {
  console.error(`[${context.toUpperCase()}] Error:`, error);
  
  // In a production app, you would send these errors to a logging service
  // Example: Sentry, Firebase Crashlytics, etc.
  
  // if (Constants.expoConfig?.extra?.enableErrorLogging) {
  //   Sentry.captureException(error, {
  //     tags: { context }
  //   });
  // }
};

/**
 * Generic error handler that classifies and processes errors appropriately
 */
export const handleError = (error: any, context: string = 'general'): ErrorHandler => {
  logError(error, context);
  
  // Classify the error and handle accordingly
  if (error.code?.startsWith('auth/')) {
    return handleFirebaseAuthError(error as FirebaseError);
  } else if (error.name === 'FirebaseError') {
    return handleFirestoreError(error as FirebaseError);
  } else {
    return handleAPIError(error);
  }
};
