import { NextResponse } from 'next/server';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile';

// Initialize API with env variables
const instance = new ILovePDFApi(
  process.env.ILOVEPDF_PUBLIC_KEY,
  process.env.ILOVEPDF_SECRET_KEY
);

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file'); // File object
    const taskType = formData.get('task'); // e.g., 'compress_pdf'

    if (!file || !taskType) {
      return NextResponse.json({ error: 'Missing file or task' }, { status: 400 });
    }

    // Convert Next.js FormData File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a new task based on the requested tool
    // Note: You must map 'merge_pdf' -> 'merge', 'compress_image' -> 'compressimage'
    // This is a simplified mapper:
    let apiToolName = taskType.split('_')[0]; // simple heuristic
    if (taskType.includes('image') && apiToolName === 'compress') apiToolName = 'compressimage';
    if (taskType.includes('image') && apiToolName === 'resize') apiToolName = 'resizeimage';

    const task = instance.newTask(apiToolName);

    // Start Task
    await task.start();

    // Add File (using buffer)
    const iLoveFile = new ILovePDFFile(buffer);
    await task.addFile(iLoveFile);

    // Process
    await task.process();

    // Get Download Link (We send the link to frontend instead of downloading stream to save server bandwidth)
    const downloadData = await task.download(); 
    // Note: The Node SDK 'download()' typically returns buffer. 
    // Ideally, with REST, you get a URL. 
    // For this scaffold, we assume we return a public URL or stream the buffer back.
    // To keep it simple for this snippet, let's assume we return the buffer directly 
    // or you can upload this buffer to Firebase Storage and return that URL.
    
    // For specific iLoveAPI usage, often you want 'task.download()' which fetches the file.
    // We will simulate a response here as if we are serving the processed file.
    
    // In a real production app, you would upload `downloadData` to Firebase Storage here
    // and return the Firebase URL to the user.
    
    return new NextResponse(downloadData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf', // Dynamic based on output
        'Content-Disposition': `attachment; filename="processed_${file.name}"`,
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}