import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCf_xfKqYeFB4Zl82xG-BviZ58nqZEsYyc",
  authDomain: "timeharborapp.firebaseapp.com",
  projectId: "timeharborapp",
  storageBucket: "timeharborapp.firebasestorage.app",
  messagingSenderId: "339582251988",
  appId: "1:339582251988:web:e3aecac5e7be77aabb5c41",
  measurementId: "G-FFCRVLNRMJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
