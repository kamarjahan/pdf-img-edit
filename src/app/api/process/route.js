import { NextResponse } from 'next/server';
import ILovePDFApi from '@ilovepdf/ilovepdf-nodejs';
import ILovePDFFile from '@ilovepdf/ilovepdf-nodejs/ILovePDFFile';
import sharp from 'sharp'; 
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(req) {
  let tempFilePath = null;

  try {
    const formData = await req.formData();
    const taskType = formData.get('task');
    const files = formData.getAll('files');
    
    // Params
    const x = parseInt(formData.get('x')) || 0;
    const y = parseInt(formData.get('y')) || 0;
    const w = parseInt(formData.get('w'));
    const h = parseInt(formData.get('h'));
    const rotateAngle = parseInt(formData.get('rotate_angle')) || 0;
    const resizeW = parseInt(formData.get('resize_w'));
    const resizeH = parseInt(formData.get('resize_h'));
    const compressionLevel = formData.get('compression_level');
    const password = formData.get('password');
    const watermarkText = formData.get('watermark_text');
    const splitRanges = formData.get('split_ranges');

    if (!files || files.length === 0 || !taskType) {
      return NextResponse.json({ error: 'Missing file or task' }, { status: 400 });
    }

    const file = files[0];
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ---------------------------------------------------------
    // STRATEGY 1: HANDLE IMAGE TOOLS LOCALLY (FAST & FREE)
    // ---------------------------------------------------------
    const imageTools = ['crop_image', 'rotate_image', 'resize_image', 'compress_image', 'convert_image'];
    
    if (imageTools.includes(taskType)) {
      console.log(`Processing Image: ${taskType}`);
      let imagePipeline = sharp(buffer);

      if (taskType === 'crop_image') {
        // FIX: Ensure we never crash on 0 dimensions. Default to 100x100 if missing.
        const safeW = w > 0 ? w : 100;
        const safeH = h > 0 ? h : 100;
        imagePipeline = imagePipeline.extract({ left: x, top: y, width: safeW, height: safeH });
      }

      if (taskType === 'rotate_image') {
        imagePipeline = imagePipeline.rotate(rotateAngle);
      }

      if (taskType === 'resize_image') {
        if (resizeW > 0 && resizeH > 0) {
           imagePipeline = imagePipeline.resize(resizeW, resizeH);
        }
      }

      // Compression settings
      let quality = 80;
      if (compressionLevel === 'extreme') quality = 30;
      if (compressionLevel === 'low') quality = 90;

      if (file.type.includes('png') && taskType !== 'convert_image') {
         imagePipeline = imagePipeline.png({ quality });
      } else {
         imagePipeline = imagePipeline.jpeg({ quality });
      }

      const processedBuffer = await imagePipeline.toBuffer();

      return new NextResponse(processedBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Content-Disposition': `attachment; filename="processed_${file.name}"`,
        },
      });
    }

    // ---------------------------------------------------------
    // STRATEGY 2: HANDLE PDF TOOLS (USING ILOVEPDF + TEMP FILES)
    // ---------------------------------------------------------
    const publicKey = process.env.ILOVEPDF_PUBLIC_KEY;
    const secretKey = process.env.ILOVEPDF_SECRET_KEY;

    if (!publicKey || !secretKey) {
      return NextResponse.json({ error: 'Missing API Keys' }, { status: 500 });
    }

    const instance = new ILovePDFApi(publicKey, secretKey);
    let apiToolName = taskType.split('_')[0]; 
    if (taskType === 'pdf_to_jpg') apiToolName = 'pdfjpg';
    if (taskType === 'word_to_pdf') apiToolName = 'officepdf';

    const task = instance.newTask(apiToolName);
    await task.start();

    // Loop through files and SAVE THEM TO DISK FIRST (Fixes path.substring error)
    for (const f of files) {
      const b = Buffer.from(await f.arrayBuffer());
      const tempDir = os.tmpdir();
      // Create a unique name to avoid conflicts
      const safeName = `${Date.now()}_${Math.random().toString(36).substring(7)}_${f.name.replace(/\s/g, '_')}`;
      tempFilePath = path.join(tempDir, safeName);
      
      fs.writeFileSync(tempFilePath, b); // Write to disk
      
      const iLoveFile = new ILovePDFFile(tempFilePath); // Pass PATH, not buffer
      await task.addFile(iLoveFile);
    }

    // PDF Params
    const processParams = {};
    if (apiToolName === 'protect' && password) processParams.password = password;
    if (apiToolName === 'watermark' && watermarkText) {
         processParams.mode = 'text';
         processParams.text = watermarkText;
    }
    if (apiToolName === 'split' && splitRanges) {
        processParams.split_mode = 'ranges';
        processParams.ranges = splitRanges;
    }
    if (apiToolName === 'compress') {
        processParams.compression_level = compressionLevel || 'recommended';
    }

    await task.process(processParams);
    const downloadData = await task.download();

    return new NextResponse(downloadData, {
      status: 200,
      headers: {
        'Content-Type': apiToolName === 'pdfjpg' ? 'application/zip' : 'application/pdf',
        'Content-Disposition': `attachment; filename="processed_result.${apiToolName === 'pdfjpg' ? 'zip' : 'pdf'}"`,
      },
    });

  } catch (error) {
    console.error('API ERROR:', error);
    return NextResponse.json({ error: error.message || 'Processing failed.' }, { status: 500 });
  } finally {
    // Cleanup temp files
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch(e) {}
    }
  }
}