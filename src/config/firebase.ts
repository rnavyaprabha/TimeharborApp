import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOqOqj5fNzVoj7molX4SamBliwr-Uc__8",
  authDomain: "timeharbor-e8ff4.firebaseapp.com",
  projectId: "timeharbor-e8ff4",
  storageBucket: "timeharbor-e8ff4.firebasestorage.app",
  messagingSenderId: "991518210130",
  appId: "1:991518210130:web:d1518c97b52953e94bc78b",
  measurementId: "G-LVXHYFJ3YE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
