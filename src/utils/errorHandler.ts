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
      errorMessage.message = 'The password is invalid';
      break;
    case 'auth/weak-password':
      errorMessage.message = 'Password should be at least 6 characters';
      break;
    case 'auth/invalid-credential':
      errorMessage.message = 'The provided credentials are invalid';
      break;
    case 'auth/too-many-requests':
      errorMessage.message = 'Too many unsuccessful login attempts. Please try again later';
      break;
    case 'auth/network-request-failed':
      errorMessage.message = 'Network error. Please check your connection';
      break;
    default:
      errorMessage.message = error.message || 'An authentication error occurred';
  }

  return errorMessage;
};

/**
 * Handles Firestore database errors and returns user-friendly messages
 */
export const handleFirestoreError = (error: FirebaseError): ErrorHandler => {
  const errorMessage: ErrorHandler = { 
    message: 'A database error occurred'
  };
  
  if (error.code) {
    errorMessage.code = error.code;
  }

  switch (error.code) {
    case 'permission-denied':
      errorMessage.message = 'You don\'t have permission to perform this action';
      break;
    case 'unavailable':
      errorMessage.message = 'The service is currently unavailable. Please try again later';
      break;
    case 'not-found':
      errorMessage.message = 'The requested data could not be found';
      break;
    case 'failed-precondition':
      errorMessage.message = 'Operation was rejected because the system is not in a state required for the operation';
      break;
    case 'cancelled':
      errorMessage.message = 'The operation was cancelled';
      break;
    default:
      errorMessage.message = error.message || 'An error occurred while accessing the database';
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
