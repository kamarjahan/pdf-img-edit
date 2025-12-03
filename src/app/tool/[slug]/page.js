'use client';
import { useState, useRef, use } from 'react';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, FileText, RotateCw, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function ToolProcessor({ params }) {
  const { slug } = use(params);
  const { user } = useAuth();
  
  // State
  const [files, setFiles] = useState([]); 
  const [previewUrl, setPreviewUrl] = useState(null); // Stable URL for cropping
  const [status, setStatus] = useState('idle');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Image Tool State
  const [showEditor, setShowEditor] = useState(false);
  const [crop, setCrop] = useState();
  const [rotation, setRotation] = useState(0);
  
  // REAL DATA to send to backend
  const [pixelCrop, setPixelCrop] = useState({ x:0, y:0, w:0, h:0 });
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [compressionLevel, setCompressionLevel] = useState('recommended');
  
  const imgRef = useRef(null);

  // Flags
  const isCropTool = slug === 'crop_image';
  const isRotateTool = slug === 'rotate_image';
  const isResizeTool = slug === 'resize_image';
  const isCompressImageTool = slug === 'compress_image';
  const isMergeTool = slug === 'merge_pdf';

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      if (isMergeTool) {
        setFiles(prev => [...prev, ...selectedFiles]);
      } else {
        const file = selectedFiles[0];
        setFiles([file]);
        
        // Create stable preview URL for crop tools
        if (slug.includes('image')) {
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
        }
        
        if (isCropTool || isRotateTool) setShowEditor(true);
      }
      setErrorMessage('');
      setStatus('idle');
    }
  };

  // Called when image loads in the editor
  const onImageLoad = (e) => {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget;
    imgRef.current = e.currentTarget;

    // 1. Set initial visual crop (50% center)
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 50 }, naturalWidth / naturalHeight, width, height),
      width,
      height
    );
    setCrop(initialCrop);

    // 2. Calculate initial pixel values immediately
    const scaleX = naturalWidth / width;
    const scaleY = naturalHeight / height;
    const pxCrop = {
      x: Math.round(initialCrop.x * scaleX),
      y: Math.round(initialCrop.y * scaleY),
      w: Math.round(initialCrop.width * scaleX),
      h: Math.round(initialCrop.height * scaleY),
    };
    setPixelCrop(pxCrop);
  };

  const onCropComplete = (crop) => {
    if (imgRef.current && crop.width && crop.height) {
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
        
        setPixelCrop({
            x: Math.round(crop.x * scaleX),
            y: Math.round(crop.y * scaleY),
            w: Math.round(crop.width * scaleX),
            h: Math.round(crop.height * scaleY),
        });
    }
  };

  const rotateImage = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const processFile = async () => {
    if (files.length === 0) return;

    setStatus('uploading');
    setErrorMessage('');
    setShowEditor(false);

    const formData = new FormData();
    formData.append('task', slug);
    files.forEach((file) => formData.append('files', file));

    // Send PRE-CALCULATED data
    if (isCropTool) {
        // Validation: If w or h is 0, backend will fail. Ensure min 1.
        formData.append('x', pixelCrop.x);
        formData.append('y', pixelCrop.y);
        formData.append('w', Math.max(1, pixelCrop.w)); 
        formData.append('h', Math.max(1, pixelCrop.h));
    }

    if (isRotateTool) formData.append('rotate_angle', rotation);
    
    if (isResizeTool) {
        if (!resizeWidth || !resizeHeight) {
            setErrorMessage("Enter width and height.");
            setStatus('idle');
            return;
        }
        formData.append('resize_w', resizeWidth);
        formData.append('resize_h', resizeHeight);
    }
    
    if (isCompressImageTool) {
        formData.append('compression_level', compressionLevel);
    }

    try {
      const res = await fetch('/api/process', { method: 'POST', body: formData });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        setStatus('done');

        // Clean up preview
        if (previewUrl) URL.revokeObjectURL(previewUrl);

        // Auto Download
        const a = document.createElement('a');
        a.href = url;
        a.download = `processed_${slug.includes('pdf') ? 'result.pdf' : 'image.jpg'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        if (user) {
            await addDoc(collection(db, "history"), {
               userId: user.uid, toolType: slug, fileName: files[0].name,
               timestamp: new Date(), status: 'success'
            });
         }
      } else {
        const data = await res.json();
        setStatus('error');
        setErrorMessage(data.error || 'Processing failed.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage('Network error.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      
      {/* POPUP EDITOR */}
      {showEditor && previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col overflow-hidden">
                <div className="p-4 flex justify-between border-b border-white/10">
                    <h3 className="text-white font-bold">Edit Image</h3>
                    <button onClick={() => setShowEditor(false)}><X className="text-white"/></button>
                </div>
                <div className="flex-1 overflow-auto p-4 flex justify-center bg-black/50">
                    {isCropTool ? (
                        <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={onCropComplete}>
                            <img src={previewUrl} onLoad={onImageLoad} className="max-h-[60vh] object-contain" />
                        </ReactCrop>
                    ) : (
                        <div style={{ transform: `rotate(${rotation}deg)`, transition: '0.3s' }}>
                            <img src={previewUrl} className="max-h-[60vh] object-contain" />
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-800 flex justify-between">
                    {isRotateTool && (
                        <button onClick={rotateImage} className="text-white flex gap-2"><RotateCw /> Rotate</button>
                    )}
                    <button onClick={processFile} className="bg-brand-600 text-white px-6 py-2 rounded-lg ml-auto">
                        Apply & Process
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* MAIN CARD */}
      <div className="glass-card w-full max-w-lg p-8 rounded-2xl text-center space-y-6">
        <h2 className="text-3xl font-bold capitalize text-white">{slug.replace(/_/g, ' ')}</h2>
        
        {status === 'idle' && (
          <div className="space-y-6">
             <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 cursor-pointer relative">
                <input type="file" multiple={isMergeTool} onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                <UploadCloud className="w-10 h-10 text-brand-500 mx-auto mb-2" />
                <p className="text-gray-300">Click to Upload</p>
             </div>

             {files.length > 0 && (
                <div className="bg-white/5 p-3 rounded flex items-center gap-3">
                    {slug.includes('image') ? <ImageIcon className="text-blue-400"/> : <FileText className="text-red-400"/>}
                    <span className="text-white text-sm truncate flex-1 text-left">{files[0].name}</span>
                    {(isCropTool || isRotateTool) && <button onClick={() => setShowEditor(true)} className="text-brand-500 text-sm">Edit</button>}
                </div>
             )}

            {isResizeTool && files.length > 0 && (
              <div className="flex gap-4">
                <input type="number" placeholder="Width" value={resizeWidth} onChange={(e) => setResizeWidth(e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded px-3 py-2 text-white" />
                <input type="number" placeholder="Height" value={resizeHeight} onChange={(e) => setResizeHeight(e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded px-3 py-2 text-white" />
              </div>
            )}

            {errorMessage && <p className="text-red-400 bg-red-900/20 p-2 rounded">{errorMessage}</p>}
            
            {files.length > 0 && !isCropTool && !isRotateTool && (
                <button onClick={processFile} className="w-full bg-white text-black font-bold py-3 rounded-xl mt-4">Start Processing</button>
            )}
          </div>
        )}

        {status === 'uploading' && (
             <div className="py-10"><Loader2 className="w-12 h-12 text-brand-500 animate-spin mx-auto"/> <p className="text-white mt-4">Processing...</p></div>
        )}

        {status === 'done' && (
            <div className="py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4"/>
                <a href={downloadUrl} download="result" className="block w-full bg-brand-600 text-white font-bold py-3 rounded-xl">Download File</a>
                <button onClick={() => { setStatus('idle'); setFiles([]); setPreviewUrl(null); }} className="mt-4 text-gray-400 underline">Start Over</button>
            </div>
        )}

        {status === 'error' && (
            <div className="py-8">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
                <p className="text-white mb-4">{errorMessage}</p>
                <button onClick={() => setStatus('idle')} className="bg-white/10 px-6 py-2 rounded text-white">Try Again</button>
            </div>
        )}
      </div>
    </div>
  );
}