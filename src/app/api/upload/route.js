import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '35mb',
    },
  },
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size (30MB limit)
    const maxSize = 30 * 1024 * 1024; // 30MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 30MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("before");
    // Upload to Cloudinary with proper settings
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'saphire-apartments',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:best', fetch_format: 'auto' }
          ],
          flags: 'progressive',
          chunk_size: 6000000 // 6MB chunks
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });
    console.log(result);
    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle specific Cloudinary errors
    if (error.message && error.message.includes('File size too large')) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Please compress your image or use a smaller file.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
