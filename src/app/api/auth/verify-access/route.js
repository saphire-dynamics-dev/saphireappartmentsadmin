import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { accessCode } = await request.json();
    
    if (accessCode === process.env.ACCESS_CODE) {
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid access code' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
