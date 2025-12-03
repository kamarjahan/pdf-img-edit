'use client';
import { useState, use } from 'react';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, FileText, Lock, Type, Plus, X, Scissors, BarChart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function ToolProcessor({ params }) {
  const { slug } = use(params);
  const { user } = useAuth();
  
  // State
  const [files, setFiles] = useState([]); 
  const [password, setPassword] = useState('');
  const [watermarkText, setWatermarkText] = useState('');
  const [splitRanges, setSplitRanges] = useState(''); 
  const [compressionLevel, setCompressionLevel] = useState('recommended'); // NEW: Compression Level
  const [status, setStatus] = useState('idle');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Tool Flags
  const isMergeTool = slug === 'merge_pdf';
  const isProtectTool = slug === 'protect_pdf';
  const isWatermarkTool = slug === 'watermark_pdf';
  const isSplitTool = slug === 'split_pdf';
  const isCompressTool = slug === 'compress_pdf'; // NEW FLAG

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      if (isMergeTool) {
        setFiles(prev => [...prev, ...Array.from(e.target.files)]);
      } else {
        setFiles([e.target.files[0]]);
      }
      setErrorMessage('');
      setStatus('idle');
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processFile = async () => {
    if (files.length === 0) return;

    // Validation
    if (isMergeTool && files.length < 2) {
      setErrorMessage('Please select at least 2 PDF files to merge.');
      return;
    }
    if (isProtectTool && !password) {
      setErrorMessage('Please enter a password.');
      return;
    }
    if (isWatermarkTool && !watermarkText) {
      setErrorMessage('Please enter watermark text.');
      return;
    }
    if (isSplitTool && !splitRanges) {
      setErrorMessage('Please enter page ranges (e.g., 1-5).');
      return;
    }

    setStatus('uploading');
    setErrorMessage('');

    const formData = new FormData();
    formData.append('task', slug);
    
    files.forEach((file) => {
      formData.append('files', file); 
    });

    // Append Parameters
    if (password) formData.append('password', password);
    if (watermarkText) formData.append('watermark_text', watermarkText);
    if (splitRanges) formData.append('split_ranges', splitRanges);
    if (isCompressTool) formData.append('compression_level', compressionLevel); // Send Level

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

        // Determine extension
        const isZip = slug === 'split_pdf' || slug === 'pdf_to_jpg';
        const ext = isZip ? 'zip' : 'pdf';

        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_${slug}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        if (user) {
           await addDoc(collection(db, "history"), {
              userId: user.uid,
              toolType: slug,
              fileName: files[0].name,
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
            
            {/* UPLOAD AREA */}
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 hover:border-brand-500 hover:bg-white/5 transition-all relative group cursor-pointer">
              <input 
                type="file" 
                multiple={isMergeTool} 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              />
              <div className="space-y-4 pointer-events-none">
                <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  {isMergeTool ? <Plus className="w-7 h-7 text-brand-500" /> : <UploadCloud className="w-7 h-7 text-brand-500" />}
                </div>
                <p className="text-gray-200 font-medium">
                  {isMergeTool ? 'Add PDF Files' : 'Click to Upload File'}
                </p>
              </div>
            </div>

            {/* FILE LIST */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {files.map((file, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-lg flex items-center gap-3 border border-white/10 text-left animate-fade-in-up">
                    <FileText className="w-5 h-5 text-blue-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-white">{file.name}</p>
                    </div>
                    {isMergeTool && (
                        <button onClick={() => removeFile(idx)} className="text-gray-500 hover:text-red-400 p-1">
                        <X className="w-4 h-4" />
                        </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* COMPRESS LEVEL SELECTOR (New) */}
            {isCompressTool && files.length > 0 && (
               <div className="text-left animate-fade-in-up">
                 <label className="text-sm text-gray-400 mb-1 block">Compression Level</label>
                 <div className="relative">
                   <BarChart className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                   <select 
                     value={compressionLevel}
                     onChange={(e) => setCompressionLevel(e.target.value)}
                     className="w-full bg-black/30 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-brand-500 focus:outline-none appearance-none cursor-pointer"
                   >
                     <option value="extreme">Extreme (Low Quality)</option>
                     <option value="recommended">Recommended (Good Quality)</option>
                     <option value="low">Low (High Quality)</option>
                   </select>
                 </div>
               </div>
            )}

            {/* SPLIT INPUT */}
            {isSplitTool && files.length > 0 && (
              <div className="text-left animate-fade-in-up">
                <label className="text-sm text-gray-400 mb-1 block">Page Ranges</label>
                <div className="relative">
                  <Scissors className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="e.g. 1-5, 8-10" 
                    value={splitRanges}
                    onChange={(e) => setSplitRanges(e.target.value)}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* PROTECT & WATERMARK INPUTS (Kept same) */}
            {isProtectTool && files.length > 0 && (
              <div className="text-left animate-fade-in-up">
                <label className="text-sm text-gray-400 mb-1 block">Set Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input type="password" placeholder="Enter password..." value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-brand-500 focus:outline-none" />
                </div>
              </div>
            )}

            {isWatermarkTool && files.length > 0 && (
              <div className="text-left animate-fade-in-up">
                <label className="text-sm text-gray-400 mb-1 block">Watermark Text</label>
                <div className="relative">
                  <Type className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input type="text" placeholder="e.g. CONFIDENTIAL" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-brand-500 focus:outline-none" />
                </div>
              </div>
            )}

            {errorMessage && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded">{errorMessage}</p>}

            {files.length > 0 && (
              <button onClick={processFile} className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all shadow-lg mt-4">
                {isMergeTool ? `Merge ${files.length} Files` : isCompressTool ? 'Compress PDF' : 'Start Processing'}
              </button>
            )}
          </div>
        )}

        {/* LOADING & SUCCESS STATES */}
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
            <a href={downloadUrl} download="result" className="block w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl mt-6 transition-all">
              Download File
            </a>
            <button onClick={() => { setStatus('idle'); setFiles([]); }} className="mt-6 text-sm text-gray-400 hover:text-white underline">Process another file</button>
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