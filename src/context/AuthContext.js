'use client';
import { useContext, createContext, useState, useEffect } from "react";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "../lib/firebase";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 1. Google Sign In Function
  const googleSignIn = async () => {
    console.log("🔥 Context: Starting Google Sign In...");
    const provider = new GoogleAuthProvider();
    
    try {
      // Attempt Popup Login
      await signInWithPopup(auth, provider);
      console.log("✅ Context: Sign In Successful!");
    } catch (error) {
      // Log full error if it fails
      console.error("❌ Context Error:", error.code, error.message);
      throw error; // Throw it so the button knows it failed
    }
  };

  // 2. Log Out Function
  const logOut = () => {
    signOut(auth);
  };

  // 3. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("👤 Context: User state changed:", currentUser?.email || "No User");
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, googleSignIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};