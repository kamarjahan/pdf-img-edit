'use client';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, googleSignIn, logOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    console.log("🟢 BUTTON CLICKED");
    try {
      setLoading(true);
      await googleSignIn();
    } catch (error) {
      console.log("🔴 LOGIN FAILED IN NAVBAR:", error);
      alert("Login Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 glass-card bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-teal-400 to-blue-500 bg-clip-text text-transparent">
              ProTool
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link href="/pdf" className="text-gray-300 hover:text-white text-sm font-medium">PDF Tools</Link>
            <Link href="/image" className="text-gray-300 hover:text-white text-sm font-medium">Image Tools</Link>
            
            <div className="border-l border-white/10 pl-6 ml-2">
              {user ? (
                <div className="flex items-center gap-3">
                  <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border-2 border-brand-500" />
                  <button onClick={logOut} className="text-sm text-red-400 hover:text-red-300">Sign Out</button>
                </div>
              ) : (
                <button 
                  onClick={handleSignIn}
                  disabled={loading}
                  style={{ position: 'relative', zIndex: 1000 }} // FORCE ON TOP
                  className="bg-white text-black hover:bg-gray-200 px-5 py-2 rounded-full text-sm font-bold shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  {loading ? 'Opening Google...' : 'Sign in'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}