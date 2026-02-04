import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { put } from '@vercel/blob';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';

const MAX_SIZE = 30 * 1024 * 1024;
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const DEFAULT_PROVIDER = 'cloudinary';
const ALLOWED_MIME_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/jpg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp']
]);

const normalizeProvider = (value) => (value || '').trim().toLowerCase();

const getUploadProvider = () =>
  normalizeProvider(process.env.UPLOAD_PROVIDER) || DEFAULT_PROVIDER;

const parseFallbacks = () => {
  const raw =
    process.env.UPLOAD_FALLBACKS ||
    process.env.UPLOAD_FALLBACK ||
    '';
  const fallbacks = raw
    .split(',')
    .map(normalizeProvider)
    .filter(Boolean);

  if (process.env.ENABLE_LOCAL_UPLOAD_FALLBACK === 'true' && !fallbacks.includes('local')) {
    fallbacks.push('local');
  }

  return fallbacks;
};

const resolveProviderChain = () => {
  const chain = [getUploadProvider(), ...parseFallbacks()].filter(Boolean);
  return [...new Set(chain)];
};

const resolveExtension = (file) => {
  if (file?.type && ALLOWED_MIME_TYPES.has(file.type)) {
    return ALLOWED_MIME_TYPES.get(file.type);
  }

  const rawName = file?.name || '';
  const ext = path.extname(rawName).replace('.', '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }

  return null;
};

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: 'saphire-apartments',
          resource_type: 'image',
          allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:best', fetch_format: 'auto' }
          ],
          flags: 'progressive',
          chunk_size: 6000000
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      )
      .end(buffer);
  });

const uploadToVercelBlob = async (buffer, extension, contentType) => {
  const fileName = `uploads/${Date.now()}-${crypto.randomUUID().slice(0, 12)}.${extension}`;
  const result = await put(fileName, buffer, {
    access: 'public',
    contentType: contentType || `image/${extension === 'jpg' ? 'jpeg' : extension}`
  });

  return {
    url: result.url,
    public_id: `blob:${result.url}`,
    storage: 'vercel-blob'
  };
};

const uploadToLocal = async (buffer, extension) => {
  await fs.mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const fileName = `${Date.now()}-${crypto.randomUUID().slice(0, 12)}.${extension}`;
  const filePath = path.join(LOCAL_UPLOAD_DIR, fileName);
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${fileName}`,
    public_id: `local:${fileName}`,
    storage: 'local'
  };
};

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

    const extension = resolveExtension(file);
    if (!extension) {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 30MB limit' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = file.type || `image/${extension === 'jpg' ? 'jpeg' : extension}`;

    const providerChain = resolveProviderChain();
    let lastError;

    for (const provider of providerChain) {
      try {
        if (provider === 'local') {
          const localResult = await uploadToLocal(buffer, extension);
          return NextResponse.json({
            success: true,
            url: localResult.url,
            public_id: localResult.public_id,
            storage: localResult.storage,
            fallback: provider !== providerChain[0]
          });
        }

        if (provider === 'vercel-blob') {
          const blobResult = await uploadToVercelBlob(buffer, extension, contentType);
          return NextResponse.json({
            success: true,
            url: blobResult.url,
            public_id: blobResult.public_id,
            storage: blobResult.storage,
            fallback: provider !== providerChain[0]
          });
        }

        if (provider === 'cloudinary') {
          const result = await uploadToCloudinary(buffer);
          return NextResponse.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            storage: 'cloudinary',
            fallback: provider !== providerChain[0]
          });
        }
      } catch (error) {
        lastError = error;
        console.error(`Upload error (${provider}):`, error);
      }
    }

    throw lastError || new Error('Upload failed');
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
