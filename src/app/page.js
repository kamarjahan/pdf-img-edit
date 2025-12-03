'use client';
import Link from 'next/link';
import { FileText, Image as ImageIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] gap-8 py-10">
      <div className="text-center space-y-4 animate-fade-in-up">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          All your file tools. <br/>
          <span className="text-brand-500">One powerful platform.</span>
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          Process PDFs and Images securely using our pro-grade API tools. 
          Works smoothly on any device.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4 mt-8">
        
        {/* PDF Card */}
        <Link href="/pdf" 
          className="group glass-card p-8 rounded-2xl hover:bg-white/5 transition-all duration-300 border border-white/5 hover:border-red-500/30 cursor-pointer animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="h-full flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-red-500/10 rounded-full group-hover:scale-110 transition-transform">
              <FileText className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white">PDF Tools</h2>
            <p className="text-sm text-gray-400">Merge, Split, Compress, and Convert PDFs instantly.</p>
          </div>
        </Link>

        {/* Image Card */}
        <Link href="/image" 
          className="group glass-card p-8 rounded-2xl hover:bg-white/5 transition-all duration-300 border border-white/5 hover:border-blue-500/30 cursor-pointer animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="h-full flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-blue-500/10 rounded-full group-hover:scale-110 transition-transform">
              <ImageIcon className="w-12 h-12 text-blue-500" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Image Tools</h2>
            <p className="text-sm text-gray-400">Resize, Crop, and Optimize images with zero quality loss.</p>
          </div>
        </Link>

      </div>
    </div>
  );
}