import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tenant from '@/models/Tenant';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking ID' },
        { status: 400 }
      );
    }
    
    const tenant = await Tenant.findById(id)
      .populate('apartment', 'title location price type features amenities contact');
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Guest booking not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch guest booking' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking ID' },
        { status: 400 }
      );
    }
    
    // If updating apartment or dates, check for conflicts
    if (body.apartment || body.stayDetails) {
      const existingTenant = await Tenant.findById(id);
      if (!existingTenant) {
        return NextResponse.json(
          { success: false, error: 'Guest booking not found' },
          { status: 404 }
        );
      }
      
      const apartmentId = body.apartment || existingTenant.apartment;
      const checkInDate = body.stayDetails?.checkInDate || existingTenant.stayDetails.checkInDate;
      const checkOutDate = body.stayDetails?.checkOutDate || existingTenant.stayDetails.checkOutDate;
      
      // Check for conflicting bookings (excluding current booking)
      const conflictingBooking = await Tenant.findOne({
        _id: { $ne: id },
        apartment: apartmentId,
        $or: [
          {
            'stayDetails.checkInDate': {
              $lte: new Date(checkOutDate)
            },
            'stayDetails.checkOutDate': {
              $gte: new Date(checkInDate)
            }
          }
        ],
        status: { $in: ['Confirmed', 'Checked-In'] }
      });
      
      if (conflictingBooking) {
        return NextResponse.json(
          { success: false, error: 'Apartment is already booked for these dates' },
          { status: 400 }
        );
      }
    }
    
    const tenant = await Tenant.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    ).populate('apartment', 'title location price type features amenities contact');
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Guest booking not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: tenant,
      message: 'Guest booking updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to update guest booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking ID' },
        { status: 400 }
      );
    }
    
    const tenant = await Tenant.findByIdAndDelete(id);
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Guest booking not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Guest booking deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete guest booking' },
      { status: 500 }
    );
  }
}
