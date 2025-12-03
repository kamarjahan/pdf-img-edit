'use client';
import { useState } from 'react'; // Import state
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, User } from 'lucide-react'; // Icons

export default function Navbar() {
  const { user, googleSignIn, logOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-white/10 glass-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-brand-500 to-blue-500 bg-clip-text text-transparent">
              ProTool
            </Link>
          </div>

          {/* Desktop Menu (Hidden on Mobile) */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/pdf" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">PDF Tools</Link>
            <Link href="/image" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Image Tools</Link>
            
            {user ? (
              <div className="flex items-center gap-4 border-l border-white/10 pl-4">
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-brand-500"
                />
                <button onClick={logOut} title="Sign Out">
                  <LogOut className="w-5 h-5 text-gray-400 hover:text-red-400 transition-colors" />
                </button>
              </div>
            ) : (
              <button 
                onClick={googleSignIn}
                className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg shadow-brand-500/20 transition-all hover:scale-105"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Button (Visible ONLY on Mobile) */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="text-gray-300 hover:text-white p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#0f172a] border-b border-white/10 animate-fade-in-up">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link 
              href="/pdf" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
            >
              PDF Tools
            </Link>
            <Link 
              href="/image" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-3 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-white/5"
            >
              Image Tools
            </Link>
            
            <div className="border-t border-white/10 my-2 pt-2">
              {user ? (
                <div className="flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-3">
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-medium text-white">{user.displayName}</span>
                  </div>
                  <button 
                    onClick={() => { logOut(); setIsOpen(false); }}
                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { googleSignIn(); setIsOpen(false); }}
                  className="w-full text-center bg-brand-600 text-white px-3 py-3 rounded-md text-base font-medium mt-2"
                >
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}