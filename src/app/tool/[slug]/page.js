'use client';
import { useState, use } from 'react';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, FileText, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function ToolProcessor({ params }) {
  const { slug } = use(params);
  const { user } = useAuth();
  
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState(''); // NEW: Password state
  const [status, setStatus] = useState('idle');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isProtectTool = slug === 'protect_pdf'; // Check if tool needs password

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage('');
      setStatus('idle');
    }
  };

  const processFile = async () => {
    if (!file) return;
    if (isProtectTool && !password) {
      setErrorMessage('Please enter a password to protect the PDF.');
      return;
    }

    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('task', slug);
    if (password) formData.append('password', password); // Send password if exists

    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        setStatus('done');

        // Auto Download
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_${file.name}`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // Save History
        if (user) {
           await addDoc(collection(db, "history"), {
              userId: user.uid,
              toolType: slug,
              fileName: file.name,
              timestamp: new Date(),
              status: 'success'
            });
        }
      } else {
        const data = await res.json();
        setStatus('error');
        setErrorMessage(data.error || 'Processing failed.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-lg p-8 rounded-2xl text-center space-y-6 relative">
        <h2 className="text-3xl font-bold capitalize bg-gradient-to-br from-white to-gray-400 bg-clip-text text-transparent">
          {slug.replace(/_/g, ' ')}
        </h2>

        {status === 'idle' && (
          <div className="animate-fade-in-up space-y-6">
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-10 hover:border-brand-500 hover:bg-white/5 transition-all relative group cursor-pointer">
              <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
              <div className="space-y-4 pointer-events-none">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8 text-brand-500" />
                </div>
                <p className="text-gray-200 font-medium">Click to Upload File</p>
              </div>
            </div>

            {file && (
              <div className="p-4 bg-white/5 rounded-lg flex items-center gap-3 border border-white/10 text-left">
                <FileText className="w-8 h-8 text-blue-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white">{file.name}</p>
                </div>
              </div>
            )}

            {/* PASSWORD INPUT (Only for Protect PDF) */}
            {isProtectTool && file && (
              <div className="text-left animate-fade-in-up">
                <label className="text-sm text-gray-400 mb-1 block">Set Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input 
                    type="password" 
                    placeholder="Enter password..." 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-brand-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded">{errorMessage}</p>
            )}

            {file && (
              <button onClick={processFile} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all shadow-lg mt-4">
                {isProtectTool ? 'Protect PDF' : 'Start Processing'}
              </button>
            )}
          </div>
        )}

        {status === 'uploading' && (
          <div className="py-12 animate-pulse-slow">
             <Loader2 className="w-16 h-16 text-brand-500 animate-spin mx-auto mb-4" />
             <h3 className="text-xl font-semibold text-white">Processing...</h3>
          </div>
        )}

        {status === 'done' && (
          <div className="py-8 animate-fade-in-up">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
            <a href={downloadUrl} download={`processed_${file?.name}`} className="block w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl mt-6 transition-all">
              Download Again
            </a>
            <button onClick={() => { setStatus('idle'); setFile(null); setPassword(''); }} className="mt-6 text-sm text-gray-400 hover:text-white underline">
              Process another file
            </button>
          </div>
        )}
        
        {status === 'error' && (
           <div className="py-8">
             <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
             <p className="text-white mb-4">{errorMessage}</p>
             <button onClick={() => setStatus('idle')} className="bg-white/10 px-6 py-2 rounded-lg text-white">Try Again</button>
           </div>
        )}
      </div>
    </div>
  );
}