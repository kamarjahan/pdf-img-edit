'use client';
import { useState } from 'react';
import { UploadCloud, Loader2, CheckCircle } from 'lucide-react';

export default function ToolProcessor({ params }) {
  const { slug } = params;
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, done, error
  const [downloadUrl, setDownloadUrl] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('task', slug); // e.g., 'compress_pdf'

    try {
      // Call our Next.js API route
      const res = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (data.download_url) {
        setDownloadUrl(data.download_url);
        setStatus('done');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="glass-card w-full max-w-md p-8 rounded-2xl text-center space-y-6">
        
        <h2 className="text-2xl font-bold capitalize">{slug.replace('_', ' ')}</h2>
        
        {status === 'idle' && (
          <div className="border-2 border-dashed border-gray-600 rounded-xl p-10 hover:border-brand-500 transition-colors relative">
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-300 font-medium">Click to Upload File</p>
            {file && <p className="text-brand-500 mt-2 text-sm">{file.name}</p>}
          </div>
        )}

        {status === 'uploading' && (
          <div className="py-10">
             <Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto" />
             <p className="mt-4 text-gray-300">Processing with iLoveAPI...</p>
          </div>
        )}

        {status === 'done' && (
          <div className="py-6 animate-fade-in-up">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Success!</h3>
            <a 
              href={downloadUrl} 
              target="_blank"
              className="inline-block bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-brand-500/25 transition-all"
            >
              Download File
            </a>
            <button 
              onClick={() => { setStatus('idle'); setFile(null); }}
              className="block w-full mt-4 text-sm text-gray-400 hover:text-white"
            >
              Process another file
            </button>
          </div>
        )}

        {status === 'idle' && file && (
          <button 
            onClick={processFile}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Start Processing
          </button>
        )}
      </div>
    </div>
  );
}