import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import { verifyAdminSession } from '@/lib/adminSession';

function isAdmin(request) {
  return verifyAdminSession(request.cookies.get('admin-session')?.value);
}

export async function GET(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const feedback = await Feedback.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const experience = String(body.experience || '').trim();
    const rating = Number(body.rating);

    if (!name || !experience || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Please provide your name, rating, and experience.' },
        { status: 400 }
      );
    }

    await dbConnect();
    await Feedback.create({ name, email, rating, experience });
    return NextResponse.json({ success: true, message: 'Thank you for sharing your feedback.' }, { status: 201 });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json({ success: false, error: 'Unable to submit feedback. Please try again.' }, { status: 500 });
  }
}
