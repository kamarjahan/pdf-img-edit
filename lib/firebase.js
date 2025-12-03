import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCPwGQlBM48qkUlKzTeYzwvfSlOy5YqI6k",
    authDomain: "impdeditor.firebaseapp.com",
    projectId: "impdeditor",
    storageBucket: "impdeditor.firebasestorage.app",
    messagingSenderId: "133557046894",
    appId: "1:133557046894:web:c69e70657ab21f3014e07f",
    measurementId: "G-5Y7R2S7HV1"
  
};

// Singleton pattern to prevent multiple initializations
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);