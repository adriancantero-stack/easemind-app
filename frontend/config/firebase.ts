import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAPNDYtqEC4Q7cgQzqeWjPZ61_SRrqrwRw",
  authDomain: "easemind-auth-firebase.firebaseapp.com",
  projectId: "easemind-auth-firebase",
  storageBucket: "easemind-auth-firebase.firebasestorage.app",
  messagingSenderId: "771193870049",
  appId: "1:771193870049:web:8eac2802119b6dfe5009a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { app, auth };
