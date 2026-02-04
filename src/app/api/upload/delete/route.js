import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { del } from '@vercel/blob';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function DELETE(request) {
  try {
    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json(
        { success: false, error: 'No public_id provided' },
        { status: 400 }
      );
    }

    if (public_id.startsWith('local:')) {
      const fileName = path.basename(public_id.slice('local:'.length));
      const filePath = path.join(LOCAL_UPLOAD_DIR, fileName);

      try {
        await fs.unlink(filePath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }

      return NextResponse.json({
        success: true,
        result: 'deleted',
        storage: 'local'
      });
    }

    if (public_id.startsWith('blob:')) {
      const blobUrl = public_id.slice('blob:'.length);
      await del(blobUrl);
      return NextResponse.json({
        success: true,
        result: 'deleted',
        storage: 'vercel-blob'
      });
    }

    const result = await cloudinary.uploader.destroy(public_id);

    return NextResponse.json({
      success: true,
      result,
      storage: 'cloudinary'
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Delete failed' },
      { status: 500 }
    );
  }
}
