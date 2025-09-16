import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function DELETE(request) {
  try {
    const { public_id } = await request.json();

    if (!public_id) {
      return NextResponse.json(
        { success: false, error: 'No public_id provided' },
        { status: 400 }
      );
    }

    const result = await cloudinary.uploader.destroy(public_id);

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { success: false, error: 'Delete failed' },
      { status: 500 }
    );
  }
}
