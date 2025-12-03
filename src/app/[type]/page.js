'use client';
import { use } from 'react'; // FIXED: Required for Next.js 15
import { tools } from '../../lib/toolsData'; // FIXED: Relative path to avoid errors
import Link from 'next/link';
import { FileText, Image, Minimize2, Maximize, Crop, RefreshCw, Lock, Unlock, Stamp, RotateCw, Split, Merge } from 'lucide-react';

const iconMap = {
  FileText, Image, Minimize2, Maximize, Crop, RefreshCw, Lock, Unlock, Stamp, RotateCw, Split, Merge
};

export default function ToolDashboard({ params }) {
  // FIXED: Unwrap params using the 'use' hook
  const { type } = use(params); 

  const currentTools = tools[type] || [];

  return (
    <div className="max-w-7xl mx-auto py-10">
      <h1 className="text-3xl font-bold capitalize mb-8 border-l-4 border-brand-500 pl-4">
        {type} Tools
      </h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {currentTools.map((tool) => {
          const IconComponent = iconMap[tool.icon] || FileText;
          return (
            <Link key={tool.id} href={`/tool/${tool.id}`} className="glass-card p-6 rounded-xl hover:bg-white/10 transition-all flex flex-col items-center text-center gap-3 group">
              <IconComponent className="w-8 h-8 text-brand-500 group-hover:text-white transition-colors" />
              <div>
                <h3 className="font-semibold">{tool.name}</h3>
                <p className="text-xs text-gray-400">{tool.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}