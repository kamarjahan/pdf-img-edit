'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, googleSignIn, logOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    // 1. ADD THIS LINE
    console.log("🟢 BUTTON CLICKED! Starting sign in..."); 
    
    try {
      setLoading(true);
      await googleSignIn();
    } catch (error) {
      console.error("🔴 SIGN IN ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 glass-card bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              ProTool
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/pdf" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">PDF Tools</Link>
            <Link href="/image" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Image Tools</Link>
            
            {/* AUTH SECTION */}
            <div className="border-l border-white/10 pl-6 ml-2">
              {user ? (
                <div className="flex items-center gap-3 animate-fade-in-up">
                  {/* User Info (Hidden on very small screens) */}
                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-medium text-white">{user.displayName}</p>
                    <p className="text-xs text-gray-400">Basic Plan</p>
                  </div>

                  {/* Profile Picture */}
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-9 h-9 rounded-full border-2 border-brand-500 shadow-sm"
                  />
                  
                  {/* Sign Out Button */}
                  <button 
                    onClick={logOut} 
                    className="text-xs bg-white/10 hover:bg-red-500/20 text-gray-300 hover:text-red-400 px-3 py-1.5 rounded-md transition-all ml-2"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
  onClick={handleSignIn}
  disabled={loading}
  // Added 'relative' and 'z-50' to force it to be clickable
  className="relative z-50 bg-white text-black hover:bg-gray-200 px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-white/10 transition-all flex items-center gap-2"
>
  {loading ? 'Signing in...' : 'Sign in with Google'}
</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}