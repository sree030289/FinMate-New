// Firebase configuration for FinMate app
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtKKNld9WzD5YsIPUQGlqVbLObaRzwvyE",
  authDomain: "finmate-729ca.firebaseapp.com",
  projectId: "finmate-729ca",
  storageBucket: "finmate-729ca.appspot.com",
  messagingSenderId: "394481474931",
  appId: "1:394481474931:web:8a7481df9a39e2723cf906",
  measurementId: "G-LQX0G3GYV8"
};

// Initialize Firebase - with check to prevent duplicate initialization
let app;
let auth;
let db;
let storage;

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  
  // Initialize auth and other services
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // Enable web persistence if needed
  if (Platform.OS === 'web') {
    setPersistence(auth, browserLocalPersistence)
      .catch(error => {
        console.warn('Error enabling auth persistence:', error);
      });
  }
  
  console.log('Firebase initialized successfully!');
  
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Enable offline persistence for Firestore
try {
  if (db) {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn('Firestore persistence could not be enabled: Multiple tabs open');
      } else if (err.code === 'unimplemented') {
        // The current browser doesn't support persistence
        console.warn('Firestore persistence not supported in this environment');
      }
    });
  }
} catch (error) {
  console.warn('Firestore persistence setup failed:', error);
}

console.log('Firebase auth persistence initialized for', Platform.OS);

export { 
  auth, 
  db, 
  storage,
  onAuthStateChanged
};
