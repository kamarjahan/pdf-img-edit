import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { AuthContextProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ProTool | PDF & Image Utilities',
  description: 'Powered by iLoveAPI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 2. WRAP THE ENTIRE APP WITH THE PROVIDER */}
        <AuthContextProvider>
          <Navbar />
          <main className="pt-20 min-h-screen px-4">
            {children}
          </main>
        </AuthContextProvider>
      </body>
    </html>
  );
}