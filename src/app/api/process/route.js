import { NextResponse } from 'next/server';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req) {
  let tempFiles = [];

  try {
    const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
    const secretKey = process.env.ILOVEPDF_SECRET_KEY;

    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: 'Missing API Keys' }, { status: 500 });
    }

    const instance = new ILovePDFApi(publicKey, secretKey);

    const formData = await req.formData();
    const taskType = formData.get('task');
    const password = formData.get('password');
    const watermarkText = formData.get('watermark_text');
    const splitRanges = formData.get('split_ranges');
    const compressionLevel = formData.get('compression_level'); // NEW: Get Level
    const files = formData.getAll('files'); 

    if (!files || files.length === 0 || !taskType) {
      return NextResponse.json({ error: 'Missing file or task' }, { status: 400 });
    }

    // Map Tool Name
    let apiToolName = taskType.split('_')[0]; 
    if (taskType.includes('image') && apiToolName === 'compress') apiToolName = 'compressimage';
    if (taskType.includes('image') && apiToolName === 'resize') apiToolName = 'resizeimage';
    if (taskType === 'pdf_to_jpg') apiToolName = 'pdfjpg';
    if (taskType === 'word_to_pdf') apiToolName = 'officepdf';
    
    // Start Task
    const task = instance.newTask(apiToolName);
    await task.start();

    // PROCESS FILES
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const tempDir = os.tmpdir();
      const safeName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${file.name.replace(/\s/g, '_')}`;
      const tempFilePath = path.join(tempDir, safeName);
      
      fs.writeFileSync(tempFilePath, buffer);
      tempFiles.push(tempFilePath); 

      // Add to Task
      const iLoveFile = new ILovePDFFile(tempFilePath);
      await task.addFile(iLoveFile);
    }

    // PROCESS PARAMETERS
    const processParams = {};
    
    // 1. Protect Logic
    if (apiToolName === 'protect') {
        if (!password) throw new Error("Password is required");
        processParams.password = password;
    }
    
    // 2. Watermark Logic
    if (apiToolName === 'watermark') {
        if (!watermarkText) throw new Error("Watermark text is required");
        processParams.mode = 'text';
        processParams.text = watermarkText;
    }

    // 3. Split Logic
    if (apiToolName === 'split') {
        if (!splitRanges) throw new Error("Split ranges required");
        processParams.split_mode = 'ranges';
        processParams.ranges = splitRanges;
    }

    // 4. Compress Logic (NEW)
    if (apiToolName === 'compress') {
        // Defaults to 'recommended' if not provided
        processParams.compression_level = compressionLevel || 'recommended'; 
    }

    // Execute Process
    await task.process(processParams);

    const downloadData = await task.download();

    // Determine content type based on output
    const isZipOutput = (apiToolName === 'split' || apiToolName === 'pdfjpg');
    
    return new NextResponse(downloadData, {
      status: 200,
      headers: {
        'Content-Type': isZipOutput ? 'application/zip' : 'application/pdf',
        'Content-Disposition': `attachment; filename="processed_result.${isZipOutput ? 'zip' : 'pdf'}"`,
      },
    });

  } catch (error) {
    console.error('API ERROR:', error);
    return NextResponse.json({ error: error.message || 'Processing failed.' }, { status: 500 });
  } finally {
    // Cleanup
    tempFiles.forEach(path => {
      if (fs.existsSync(path)) fs.unlinkSync(path);
    });
  }
}