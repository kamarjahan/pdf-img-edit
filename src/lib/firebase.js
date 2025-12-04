import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your exact configuration
const firebaseConfig = {
    apiKey: "AIzaSyCPwGQlBM48qkUlKzTeYzwvfSlOy5YqI6k",
    authDomain: "impdeditor.firebaseapp.com",
    projectId: "impdeditor",
    storageBucket: "impdeditor.firebasestorage.app",
    messagingSenderId: "133557046894",
    appId: "1:133557046894:web:c69e70657ab21f3014e07f",
    measurementId: "G-5Y7R2S7HV1"
};

// Initialize Firebase (Prevents "App already initialized" error)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };