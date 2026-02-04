import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { verifyPassword } from '@/lib/password';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    const normalizedUsername = String(username).trim().toLowerCase();

    await dbConnect();
    const admin = await Admin.findOne({ username: normalizedUsername }).select('+passwordHash +passwordSalt isActive username');

    let isValid = false;
    if (admin) {
      if (!admin.isActive) {
        return NextResponse.json({ success: false, error: 'Account disabled' }, { status: 403 });
      }
      isValid = verifyPassword(password, admin.passwordHash, admin.passwordSalt);
    } else if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
      isValid =
        normalizedUsername === String(process.env.ADMIN_USERNAME).trim().toLowerCase() &&
        password === process.env.ADMIN_PASSWORD;
    }

    if (isValid) {
      // Create session cookie
      const sessionData = {
        isAuthenticated: true,
        username: normalizedUsername,
        timestamp: Date.now()
      };
      
      const response = NextResponse.json({ success: true });
      
      // Set secure HTTP-only cookie
      response.cookies.set('admin-session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      
      if (admin) {
        admin.lastLoginAt = new Date();
        await admin.save();
      }

      return response;
    }
    
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
