import { NextResponse } from 'next/server';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req) {
  let tempFilePath = null;

  try {
    const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
    const secretKey = process.env.ILOVEPDF_SECRET_KEY;

    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: 'Missing API Keys' }, { status: 500 });
    }

    const instance = new ILovePDFApi(publicKey, secretKey);

    const formData = await req.formData();
    const file = formData.get('file');
    const taskType = formData.get('task');
    const password = formData.get('password'); // GET PASSWORD

    if (!file || !taskType) {
      return NextResponse.json({ error: 'Missing file or task' }, { status: 400 });
    }

    // Map Tool Name
    let apiToolName = taskType.split('_')[0];
    if (taskType.includes('image') && apiToolName === 'compress') apiToolName = 'compressimage';
    if (taskType.includes('image') && apiToolName === 'resize') apiToolName = 'resizeimage';
    if (taskType === 'pdf_to_jpg') apiToolName = 'pdfjpg';
    if (taskType === 'word_to_pdf') apiToolName = 'officepdf';
    if (taskType === 'protect_pdf') apiToolName = 'protect'; // Explicit mapping for protect

    // Create Temp File
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempDir = os.tmpdir();
    const safeName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    tempFilePath = path.join(tempDir, safeName);
    fs.writeFileSync(tempFilePath, buffer);

    // Start Task
    const task = instance.newTask(apiToolName);
    await task.start();

    // Add File
    const iLoveFile = new ILovePDFFile(tempFilePath);
    await task.addFile(iLoveFile);

    // Process with Parameters (Password logic)
    // If it's a 'protect' task, we MUST pass the password param
    if (apiToolName === 'protect') {
        if (!password) {
            throw new Error("Password is required for Protect PDF");
        }
        await task.process({ password: password });
    } else {
        await task.process();
    }

    const downloadData = await task.download();

    return new NextResponse(downloadData, {
      status: 200,
      headers: {
        'Content-Type': taskType.includes('pdf') ? 'application/pdf' : 'application/zip',
        'Content-Disposition': `attachment; filename="processed_${file.name}"`,
      },
    });

  } catch (error) {
    console.error('API ERROR:', error);
    return NextResponse.json({ error: error.message || 'Processing failed.' }, { status: 500 });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
}