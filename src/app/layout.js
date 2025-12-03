import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { AuthContextProvider } from '../context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ProTool | PDF & Image Utilities',
  description: 'Powered by iLoveAPI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="fixed top-0 w-full z-50 border-b border-white/10 glass-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="text-xl font-bold bg-gradient-to-r from-brand-500 to-blue-500 bg-clip-text text-transparent">
                  ProTool
                </Link>
              </div>
              <div className="flex space-x-4">
                <Link href="/pdf" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">PDF Tools</Link>
                <Link href="/image" className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors">Image Tools</Link>
                {/* Auth Button Placeholder */}
                <button className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-brand-500/20">
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </nav>
        <main className="pt-20 min-h-screen px-4">
          {children}
        </main>
      </body>
    </html>
  );
}