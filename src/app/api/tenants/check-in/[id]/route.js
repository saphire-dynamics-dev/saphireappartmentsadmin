import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tenant from '@/models/Tenant';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking ID' },
        { status: 400 }
      );
    }
    
    const tenant = await Tenant.findById(id);
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Guest booking not found' },
        { status: 404 }
      );
    }
    
    if (tenant.status !== 'Confirmed') {
      return NextResponse.json(
        { success: false, error: 'Guest booking must be confirmed before check-in' },
        { status: 400 }
      );
    }
    
    // Check if check-in date is valid (today or after check-in date)
    const today = new Date();
    const checkInDate = new Date(tenant.stayDetails.checkInDate);
    
    if (today < checkInDate) {
      return NextResponse.json(
        { success: false, error: 'Check-in date has not arrived yet' },
        { status: 400 }
      );
    }
    
    tenant.status = 'Checked-In';
    await tenant.save();
    
    await tenant.populate('apartment', 'title location');
    
    return NextResponse.json({
      success: true,
      data: tenant,
      message: 'Guest checked in successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to check in guest' },
      { status: 500 }
    );
  }
}
