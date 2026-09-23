import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import { verifyAdminSession } from '@/lib/adminSession';

function isAdmin(request) {
  return verifyAdminSession(request.cookies.get('admin-session')?.value);
}

function isValidFeedbackId(id) {
  return mongoose.isValidObjectId(id);
}

export async function DELETE(request, { params }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!isValidFeedbackId(id)) {
    return NextResponse.json({ success: false, error: 'Invalid feedback ID' }, { status: 400 });
  }

  try {
    await dbConnect();
    const feedback = await Feedback.findByIdAndDelete(id);
    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback was not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Feedback deleted' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete feedback' }, { status: 500 });
  }
}
