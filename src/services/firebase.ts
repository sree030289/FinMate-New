// Copy this to src/services/firebase.ts

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtKKNld9WzD5YsIPUQGlqVbLObaRzwvyE",
  authDomain: "finmate-729ca.firebaseapp.com",
  projectId: "finmate-729ca",
  storageBucket: "finmate-729ca.appspot.com", // Fixed storage bucket URL
  messagingSenderId: "394481474931",
  appId: "1:394481474931:web:8a7481df9a39e2723cf906",
  measurementId: "G-LQX0G3GYV8"
};

// Initialize Firebase - with check to prevent duplicate initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence (optional but recommended)
// This allows your app to work offline
try {
  const { enableIndexedDbPersistence } = require('firebase/firestore');
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one tab at a time
      console.warn('Firestore persistence couldn\'t be enabled: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // The current browser doesn't support persistence
      console.warn('Firestore persistence not supported in this environment');
    }
  });
} catch (error) {
  console.warn('Firestore persistence setup failed:', error);
}

export { 
  auth, 
  db, 
  storage,
  onAuthStateChanged
};