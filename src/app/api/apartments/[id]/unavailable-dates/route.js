import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tenant from '@/models/Tenant';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const excludeBookingId = searchParams.get('excludeBooking');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid apartment ID' },
        { status: 400 }
      );
    }
    
    const unavailableDates = await Tenant.getUnavailableDates(id, excludeBookingId);
    
    return NextResponse.json({
      success: true,
      data: unavailableDates
    });
  } catch (error) {
    console.error('Error fetching unavailable dates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unavailable dates' },
      { status: 500 }
    );
  }
}
