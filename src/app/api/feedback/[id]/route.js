import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import { verifyAdminSession } from '@/lib/adminSession';
import { sendFeedbackReplyEmail } from '@/lib/emailService';

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

export async function POST(request, { params }) {
  if (!isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { message } = await request.json();
  const reply = String(message || '').trim();

  if (!isValidFeedbackId(id)) {
    return NextResponse.json({ success: false, error: 'Invalid feedback ID' }, { status: 400 });
  }
  if (!reply || reply.length > 2000) {
    return NextResponse.json({ success: false, error: 'Reply must be between 1 and 2,000 characters.' }, { status: 400 });
  }

  try {
    await dbConnect();
    const feedback = await Feedback.findById(id).lean();
    if (!feedback) {
      return NextResponse.json({ success: false, error: 'Feedback was not found' }, { status: 404 });
    }
    if (!feedback.email) {
      return NextResponse.json({ success: false, error: 'This visitor did not provide an email address.' }, { status: 400 });
    }

    const result = await sendFeedbackReplyEmail(feedback, reply);
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Unable to send the email. Please check the mail configuration.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    console.error('Error replying to feedback:', error);
    return NextResponse.json({ success: false, error: 'Failed to send reply' }, { status: 500 });
  }
}
